(function () {
  var $ = function (s) { return document.querySelector(s); };
  var statusText = { neu: 'neu', bearbeitung: 'in Bearbeitung', erledigt: 'erledigt' };
  var heuteIso = new Date().toISOString().slice(0, 10);
  var aktivBogen = null, aktivAnfrage = null, aktivText = 0;

  function person(id) {
    for (var i = 0; i < TEAM.length; i++) if (TEAM[i].id === id) return TEAM[i];
    return { name: '–' };
  }
  function bogen(id) {
    for (var i = 0; i < BOEGEN.length; i++) if (BOEGEN[i].id === id) return BOEGEN[i];
  }
  function demoSpeichern() {
    try { localStorage.setItem('lhDemo', JSON.stringify({ b: BOEGEN, a: ANFRAGEN, t: TEXTE, g: ABGLEICH })); } catch (e) {}
  }
  function melden(t) {
    demoSpeichern();
    var m = $('#meldung');
    m.textContent = t; m.classList.add('an');
    clearTimeout(m._t); m._t = setTimeout(function () { m.classList.remove('an'); }, 2200);
  }

  // Login-Attrappe
  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    $('#login').hidden = true; $('#app').hidden = false;
    zeigen(location.hash.slice(1) || 'heute');
  });
  $('#abmelden').addEventListener('click', function (e) {
    e.preventDefault(); $('#app').hidden = true; $('#login').hidden = false;
  });

  function zeigen(view) {
    if (!$('#view-' + view)) view = 'heute';
    document.querySelectorAll('.view').forEach(function (v) { v.hidden = v.id !== 'view-' + view; });
    document.querySelectorAll('#nav a').forEach(function (a) { a.classList.toggle('aktiv', a.dataset.view === view); });
  }
  window.addEventListener('hashchange', function () { zeigen(location.hash.slice(1)); });

  // Heute: nur eingegangene Bögen (heute/morgen) und übersprungene Bögen von heute
  var morgen = new Date(); morgen.setDate(morgen.getDate() + 1);
  var morgenIso = morgen.toISOString().slice(0, 10);
  function isoVon(d) { return d === 'heute' ? heuteIso : d === 'morgen' ? morgenIso : d; }
  function bogenZeilen(iso) {
    var l = BOEGEN.filter(function (b) { return isoVon(b.datum) === iso; })
      .sort(function (x, y) { return x.zeit < y.zeit ? -1 : 1; });
    if (!l.length) return '<tr><td colspan="4" class="muted">Keine Bögen.</td></tr>';
    return l.map(function (b) {
      return '<tr><td class="zeit">' + b.zeit + '</td><td>' + b.name + '</td><td>' + b.grund +
        '</td><td><a class="btn" href="#anamnese" data-bogen="' + b.id + '">Öffnen</a></td></tr>';
    }).join('');
  }
  function heute() {
    $('#heuteDatum').textContent = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    var hb = BOEGEN.filter(function (b) { return isoVon(b.datum) === heuteIso; }).length;
    var mb = BOEGEN.filter(function (b) { return isoVon(b.datum) === morgenIso; }).length;
    var ue = ABGLEICH.filter(function (a) { return isoVon(a.datum) === heuteIso && !bogenVorhanden(a); });
    var offen = ANFRAGEN.filter(function (a) { return a.status === 'neu'; }).length;
    $('#heuteKacheln').innerHTML =
      '<div class="kachel"><b>' + hb + '</b>Bögen für heute</div>' +
      '<div class="kachel"><b>' + mb + '</b>Bögen für morgen</div>' +
      '<div class="kachel' + (ue.length ? ' warn' : '') + '"><b>' + ue.length + '</b>Bogen übersprungen</div>' +
      '<div class="kachel"><b>' + offen + '</b>neue Anfragen</div>';
    $('#heuteBoegen tbody').innerHTML = bogenZeilen(heuteIso);
    $('#morgenBoegen tbody').innerHTML = bogenZeilen(morgenIso);
    $('#heuteUebersprungen tbody').innerHTML = ue.length ? ue.map(function (a) {
      return '<tr><td class="zeit">' + (a.zeit || '–') + '</td><td>' + a.name + '</td><td>' +
        (a.gesendet ? '<span class="status s-gesendet">Link gesendet</span>' : '<span class="status s-fehlt">Bogen übersprungen</span>') + '</td></tr>';
    }).join('') : '<tr><td colspan="3" class="muted">Keine.</td></tr>';
  }
  $('#view-heute').addEventListener('click', function (e) {
    var b = e.target.closest('[data-bogen]');
    if (b) { aktivBogen = b.dataset.bogen; anamneseListe(); anamneseDetail(); }
  });

  // Anamnesebögen
  // Sortierung nach dem vom Patienten eingetragenen Termin
  function sortKey(b) { return isoVon(b.datum) + ' ' + b.zeit; }
  function anamneseListe() {
    var q = $('#anamneseSuche').value.toLowerCase();
    BOEGEN.sort(function (x, y) { return sortKey(x) < sortKey(y) ? -1 : 1; });
    $('#anamneseListe').innerHTML = BOEGEN.filter(function (b) {
      return b.name.toLowerCase().indexOf(q) > -1;
    }).map(function (b) {
      return '<li data-id="' + b.id + '" class="' + (b.id === aktivBogen ? 'aktiv' : '') + '">' +
        '<div class="zeile"><strong>' + b.name + '</strong>' +
        (b.gelesen ? '<span class="status s-grau">gelesen</span>' : '<span class="status s-neu">neu</span>') + '</div>' +
        '<small>Termin ' + b.termin + ' · eingegangen ' + b.eingang + '</small></li>';
    }).join('');
    var n = BOEGEN.filter(function (b) { return !b.gelesen; }).length;
    $('#zAnamnese').textContent = n || '';
  }
  function anamneseDetail() {
    var b = bogen(aktivBogen);
    if (!b) return;
    b.gelesen = true;
    $('#anamneseDetail').innerHTML = '<h3>' + b.name + '</h3><dl>' +
      '<dt>Geburtsdatum</dt><dd>' + b.geb + '</dd>' +
      '<dt>Termin (laut Patient)</dt><dd>' + b.termin + '</dd>' +
      '<dt>Krankenkasse</dt><dd>' + b.kasse + '</dd>' +
      '<dt>Anlass</dt><dd>' + b.grund + '</dd>' +
      '<dt>Medikamente</dt><dd>' + b.medikamente + '</dd>' +
      '<dt>Allergien</dt><dd>' + b.allergien + '</dd>' +
      '<dt>Vorerkrankungen</dt><dd>' + b.vorerkrankungen + '</dd>' +
      '<dt>Bisheriger Hausarzt</dt><dd>' + b.hausarzt + '</dd></dl>' +
      '<div class="knoepfe"><button class="btn btn-haupt" data-aktion="pdf">Als PDF für T2med</button>' +
      '<button class="btn" data-aktion="arzt">An Dr. Müller weiterleiten</button></div>';
    anamneseListe();
  }
  $('#anamneseListe').addEventListener('click', function (e) {
    var li = e.target.closest('li'); if (!li) return;
    aktivBogen = li.dataset.id; anamneseDetail();
  });
  $('#anamneseSuche').addEventListener('input', anamneseListe);
  $('#anamneseDetail').addEventListener('click', function (e) {
    var a = e.target.dataset.aktion;
    if (a === 'pdf') melden('Demo: PDF für T2med würde jetzt erstellt');
    if (a === 'arzt') melden('Weitergeleitet an Dr. Christian Müller');
  });

  // Anfragen
  function anfragenListe() {
    var typ = $('#fTyp').value, st = $('#fStatus').value, p = $('#fPerson').value;
    var liste = ANFRAGEN.filter(function (a) {
      return (!typ || a.typ === typ) && (!st || a.status === st) && (!p || a.an === p);
    });
    $('#anfragenListe').innerHTML = liste.length ? liste.map(function (a) {
      return '<li data-id="' + a.id + '" class="' + (a.id === aktivAnfrage ? 'aktiv' : '') + '">' +
        '<div class="zeile"><strong>' + a.typ + ' · ' + a.name + '</strong>' +
        '<span class="status s-' + a.status + '">' + statusText[a.status] + '</span></div>' +
        '<small>' + a.eingang + ' · zuständig: ' + person(a.an).name + '</small></li>';
    }).join('') : '<li class="muted">Keine Anfragen für diesen Filter.</li>';
    $('#zAnfragen').textContent = ANFRAGEN.filter(function (a) { return a.status === 'neu'; }).length || '';
  }
  function anfrageDetail() {
    var a = ANFRAGEN.filter(function (x) { return x.id === aktivAnfrage; })[0];
    if (!a) return;
    var optP = TEAM.map(function (t) {
      return '<option value="' + t.id + '"' + (t.id === a.an ? ' selected' : '') + '>' + t.name + '</option>';
    }).join('');
    var optS = Object.keys(statusText).map(function (k) {
      return '<option value="' + k + '"' + (k === a.status ? ' selected' : '') + '>' + statusText[k] + '</option>';
    }).join('');
    $('#anfrageDetail').innerHTML = '<h3>' + a.typ + ' – ' + a.name + '</h3>' +
      '<p class="muted klein">Eingang über Webseiten-Formular am ' + a.eingang + '</p>' +
      '<p>' + a.text + '</p>' +
      '<label>Weiterleiten an<select id="dPerson">' + optP + '</select></label>' +
      '<label>Status<select id="dStatus">' + optS + '</select></label>' +
      '<label>Interne Notiz<textarea rows="3" placeholder="z. B. Rückruf versucht, AB besprochen"></textarea></label>' +
      '<div class="verlauf">' + a.eingang + ' eingegangen, automatisch an ' + person(a.an).name + '</div>';
  }
  $('#anfragenListe').addEventListener('click', function (e) {
    var li = e.target.closest('li[data-id]'); if (!li) return;
    aktivAnfrage = +li.dataset.id; anfrageDetail(); anfragenListe();
  });
  $('#anfrageDetail').addEventListener('change', function (e) {
    var a = ANFRAGEN.filter(function (x) { return x.id === aktivAnfrage; })[0];
    if (e.target.id === 'dPerson') { a.an = e.target.value; melden('Weitergeleitet an ' + person(a.an).name); }
    if (e.target.id === 'dStatus') { a.status = e.target.value; melden('Status: ' + statusText[a.status]); }
    anfragenListe(); heute();
  });
  ['#fTyp', '#fStatus', '#fPerson'].forEach(function (s) { $(s).addEventListener('change', anfragenListe); });
  $('#fPerson').innerHTML += TEAM.map(function (t) { return '<option value="' + t.id + '">' + t.name + '</option>'; }).join('');

  // Webseiten-Texte
  function textLaden() {
    var t = TEXTE[aktivText];
    $('#textTitel').value = t.titel; $('#textInhalt').value = t.text;
    vorschau(); $('#textStand').textContent = 'Zuletzt geändert: 27.10. von Katrin Bergmann (Beispiel)';
  }
  function vorschau() { $('#vTitel').textContent = $('#textTitel').value; $('#vInhalt').textContent = $('#textInhalt').value; }
  $('#textBereich').innerHTML = TEXTE.map(function (t, i) { return '<option value="' + i + '">' + t.bereich + '</option>'; }).join('');
  $('#textBereich').addEventListener('change', function () { aktivText = +this.value; textLaden(); });
  $('#textTitel').addEventListener('input', vorschau);
  $('#textInhalt').addEventListener('input', vorschau);
  $('#textVerwerfen').addEventListener('click', textLaden);
  $('#textSpeichern').addEventListener('click', function () {
    TEXTE[aktivText].titel = $('#textTitel').value; TEXTE[aktivText].text = $('#textInhalt').value;
    $('#textStand').textContent = 'Veröffentlicht um ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' (Demo)';
    melden('Veröffentlicht (Demo – nichts wirklich online gestellt)');
  });

  // Team
  $('#teamTabelle tbody').innerHTML = TEAM.map(function (t) {
    return '<tr><td>' + t.name + '</td><td>' + t.rolle + '</td><td>' + t.bekommt + '</td></tr>';
  }).join('');
  $('#regeln').innerHTML = [['Rezept', 'sl'], ['Überweisung / Anforderung', 'jh'], ['AU', 'kb'], ['Termin', 'kb'], ['Anamnesebogen', 'kb']]
    .map(function (r) { return '<div class="regel"><span>' + r[0] + '</span><strong>' + person(r[1]).name + '</strong></div>'; }).join('');

  // Abgleich T2med
  function agDatum(a) {
    if (a.datum === 'heute' || a.datum === heuteIso) return 'heute';
    return a.datum.split('-').reverse().join('.');
  }
  // Beispiel-Logik: gibt es schon einen Bogen mit gleichem Namen und Termindatum?
  function bogenVorhanden(a) {
    var d = a.datum === 'heute' ? heuteIso : a.datum;
    if (a.bogenDa) return true;
    return BOEGEN.some(function (b) {
      return b.name.toLowerCase() === a.name.toLowerCase() && (b.datum === 'heute' ? heuteIso : b.datum) === d;
    });
  }
  function abgleich() {
    $('#abgleichTabelle tbody').innerHTML = ABGLEICH.map(function (a, i) {
      var st, knopf = '';
      if (bogenVorhanden(a)) st = '<span class="status s-ok">Bogen liegt vor</span>';
      else if (a.gesendet) st = '<span class="status s-fehlt">Bogen übersprungen</span> <span class="status s-gesendet">Link gesendet</span>';
      else {
        st = '<span class="status s-fehlt">Bogen übersprungen</span>';
        knopf = '<button class="btn" data-senden="' + i + '">Link senden</button>';
      }
      if (!bogenVorhanden(a)) {
        knopf += ' <button class="btn" data-fertig="' + i + '">Bogen da</button>';
      }
      return '<tr><td>' + a.name + '</td><td>' + agDatum(a) + (a.zeit ? ', ' + a.zeit : '') + '</td><td>' + (a.kontakt || '–') +
        '</td><td>' + st + '</td><td>' + knopf + '</td></tr>';
    }).join('');
    heute();
  }
  $('#abgleichForm').addEventListener('submit', function (e) {
    e.preventDefault();
    ABGLEICH.push({ name: $('#agName').value, datum: $('#agDatum').value, zeit: $('#agZeit').value, kontakt: $('#agKontakt').value, gesendet: false });
    this.reset(); abgleich(); melden('Neupatient im Abgleich eingetragen');
  });
  $('#abgleichTabelle').addEventListener('click', function (e) {
    var s = e.target.dataset.senden, f = e.target.dataset.fertig;
    if (f !== undefined) { ABGLEICH[f].bogenDa = true; melden('Als „Bogen liegt vor“ markiert'); }
    if (s !== undefined) { ABGLEICH[s].gesendet = true; melden('Link an ' + ABGLEICH[s].name + ' (Demo, nichts gesendet)'); }
    abgleich();
  });
  $('#textKopieren').addEventListener('click', function () { melden('Text kopiert (Demo)'); });

  heute(); abgleich(); anamneseListe(); anfragenListe(); textLaden();
  aktivBogen = 'a1'; anamneseDetail();
  bogen('a5').gelesen = false; aktivAnfrage = 2; anfrageDetail(); anfragenListe();
  BOEGEN[0].gelesen = false; anamneseListe();

  // Demo: Anleitung und Zurücksetzen
  if (!localStorage.getItem('lhDemoGesehen')) $('#anleitung').hidden = false;
  $('#anleitungZu').addEventListener('click', function () {
    $('#anleitung').hidden = true; localStorage.setItem('lhDemoGesehen', '1');
  });
  $('#hilfeAuf').addEventListener('click', function (e) { e.preventDefault(); $('#anleitung').hidden = false; });
  $('#demoReset').addEventListener('click', function (e) {
    e.preventDefault(); localStorage.removeItem('lhDemo'); location.reload();
  });

  // ?direkt=view überspringt die Anmeldung (für Screenshots)
  var d = location.search.match(/direkt=(\w+)/);
  if (d) { $('#login').hidden = true; $('#app').hidden = false; zeigen(d[1]); }
})();
