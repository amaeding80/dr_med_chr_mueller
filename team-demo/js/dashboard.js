(function () {
  var $ = function (s) { return document.querySelector(s); };
  var STATUS = { neu: 'Neu', arbeit: 'In Arbeit', erledigt: 'Erledigt' };
  var filter = 'neu', textNr = 0;

  // Datum
  function iso(d) {
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }
  var jetzt = new Date(), morgen = new Date();
  morgen.setDate(morgen.getDate() + 1);
  var HEUTE = iso(jetzt), MORGEN = iso(morgen);
  function tag(d) { return d === 'heute' ? HEUTE : d === 'morgen' ? MORGEN : d; }
  function tagText(d) {
    var t = tag(d);
    if (t === HEUTE) return 'heute';
    if (t === MORGEN) return 'morgen';
    return t.split('-').reverse().slice(0, 2).join('.') + '.';
  }
  function uhr() { return new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }); }
  function nachTermin(a, b) { return (tag(a.datum) + a.zeit) < (tag(b.datum) + b.zeit) ? -1 : 1; }

  function person(id) { return TEAM.filter(function (t) { return t.id === id; })[0] || { kurz: '–' }; }
  function finde(liste, id) { return liste.filter(function (x) { return x.id == id; })[0]; }

  function speichern() {
    try { localStorage.setItem('lhDemo2', JSON.stringify({ b: BOEGEN, a: ANFRAGEN, t: TEXTE, o: OHNE_BOGEN })); } catch (e) {}
  }
  function melden(t) {
    speichern();
    var m = $('#meldung');
    m.textContent = t; m.classList.add('an');
    clearTimeout(m._t); m._t = setTimeout(function () { m.classList.remove('an'); }, 2400);
    alles();
  }
  function leer(text, klein) { return '<div class="leer">' + text + (klein ? '<small>' + klein + '</small>' : '') + '</div>'; }

  // Online-Bogen eingegangen? (gleicher Name, gleicher Tag)
  function bogenDa(o) {
    return BOEGEN.some(function (b) { return b.name.toLowerCase() === o.name.toLowerCase() && tag(b.datum) === tag(o.datum); });
  }

  // Karten
  function bogenKarte(b) {
    return '<div class="eintrag" data-aktion="bogen" data-id="' + b.id + '">' +
      '<div class="oben"><span class="zeit">' + b.zeit + '</span>' +
      (b.gelesen ? '<span class="marke-status m-erledigt">Gelesen</span>' : '<span class="marke-status m-neu">Neu</span>') + '</div>' +
      '<div><div class="name">' + b.name + '</div><p>' + tagText(b.datum) + ' · ' + b.grund + '</p></div>' +
      '<button class="btn" data-aktion="bogen" data-id="' + b.id + '">Ansehen</button></div>';
  }

  function fehltKarte(o) {
    var status, knopf = '', extra = '';
    if (bogenDa(o)) {
      status = '<span class="marke-status m-da">Bogen ausgefüllt</span>';
    } else if (o.geklaert) {
      status = '<span class="marke-status m-erledigt">Vor Ort geklärt</span>';
    } else if (o.geoeffnet) {
      status = '<span class="marke-status m-arbeit">Link geöffnet ' + o.geoeffnet + '</span>';
      extra = '<p><b>Vor Ort fragen:</b> Bogen schon ausgefüllt?</p>';
      knopf = '<button class="btn" data-aktion="geklaert" data-id="' + o.id + '">Vor Ort geklärt</button>';
    } else if (o.gesendet) {
      status = '<span class="marke-status m-arbeit">Link gesendet ' + o.gesendet + '</span>';
      knopf = '<button class="btn btn-leise" data-aktion="oeffnen" data-id="' + o.id + '">Demo: Patient öffnet Link</button>';
    } else {
      status = '<span class="marke-status m-fehlt">Bogen fehlt</span>';
      knopf = '<button class="btn" data-aktion="senden" data-id="' + o.id + '">Link senden</button>';
    }
    return '<div class="eintrag">' +
      '<div class="oben"><span class="zeit">' + o.zeit + '</span>' + status + '</div>' +
      '<div><div class="name">' + o.name + '</div><p>' + tagText(o.datum) + ' · ' + o.kontakt + '</p>' + extra + '</div>' +
      knopf + '</div>';
  }

  function anfrageKarte(a) {
    var knopf = a.status === 'neu' ? '<button class="btn" data-aktion="status" data-wert="arbeit" data-id="' + a.id + '">Übernehmen</button>' :
      a.status === 'arbeit' ? '<button class="btn" data-aktion="status" data-wert="erledigt" data-id="' + a.id + '">Erledigt</button>' :
      '<button class="btn btn-leise" data-aktion="status" data-wert="neu" data-id="' + a.id + '">Wieder öffnen</button>';
    return '<div class="eintrag" data-aktion="anfrage" data-id="' + a.id + '">' +
      '<div class="oben"><span class="ueberzeile">' + a.typ + '</span><span class="marke-status m-' + a.status + '">' + STATUS[a.status] + '</span></div>' +
      '<div><div class="name">' + a.name + '</div><p>' + a.text + '</p></div>' +
      '<p class="klein">Bei ' + person(a.an).kurz + ' · ' + a.eingang + '</p>' + knopf + '</div>';
  }

  // Heute
  function heute() {
    var h = jetzt.getHours();
    $('#view-heute h1').textContent = h < 11 ? 'Guten Morgen.' : h < 17 ? 'Guten Tag.' : 'Guten Abend.';
    $('#heuteDatum').textContent = jetzt.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    var boegen = BOEGEN.filter(function (b) { return tag(b.datum) === HEUTE; }).sort(nachTermin);
    var fehlt = OHNE_BOGEN.filter(function (o) { return tag(o.datum) === HEUTE && !bogenDa(o) && !o.geklaert; }).sort(nachTermin);
    var neu = ANFRAGEN.filter(function (a) { return a.status === 'neu'; });

    $('#heuteInhalt').innerHTML =
      '<div class="abschnitt"><h2>Bogen fehlt</h2><span class="klein">Neupatienten mit Termin heute</span></div>' +
      (fehlt.length ? '<div class="liste">' + fehlt.map(fehltKarte).join('') + '</div>' : leer('Alles erledigt.', 'Alle Neupatienten von heute haben ihren Bogen.')) +
      '<div class="abschnitt"><h2>Neue Bögen</h2><span class="klein">Termin heute</span></div>' +
      (boegen.length ? '<div class="liste">' + boegen.map(bogenKarte).join('') + '</div>' : leer('Keine Bögen für heute.')) +
      '<div class="abschnitt"><h2>Neue Anfragen</h2></div>' +
      (neu.length ? '<div class="liste">' + neu.slice(0, 3).map(anfrageKarte).join('') + '</div>' +
        (neu.length > 3 ? '<p><a class="btn btn-leise" href="#anfragen">Alle ' + neu.length + ' ansehen</a></p>' : '')
        : leer('Alles erledigt.', 'Keine neuen Anfragen.'));
  }

  // Bögen
  function boegen() {
    var fehlt = OHNE_BOGEN.filter(function (o) { return !bogenDa(o) && !o.geklaert; }).sort(nachTermin);
    var liste = BOEGEN.slice().sort(nachTermin);
    $('#boegenInhalt').innerHTML =
      '<div class="abschnitt"><h2>Bogen fehlt</h2><button class="btn btn-leise" data-aktion="eintragen">+ Neupatient eintragen</button></div>' +
      '<p class="klein">Neupatienten aus T2med, die den Bogen bei der Buchung übersprungen haben.</p>' +
      '<p class="hinweis-box"><b>Persönlicher Link:</b> Wir sehen nur, ob er geöffnet wurde – nicht, ob auf Papier ausgefüllt. ' +
      'Geplant: Klicks in der ersten Minute nach dem Senden zählen nicht (z. B. automatische Link-Vorschau).</p>' +
      (fehlt.length ? '<div class="liste">' + fehlt.map(fehltKarte).join('') + '</div>' : leer('Alles erledigt.')) +
      '<div class="abschnitt"><h2>Eingegangene Bögen</h2><span class="klein">nach Termin sortiert</span></div>' +
      '<div class="liste">' + liste.map(bogenKarte).join('') + '</div>';
  }

  // Anfragen
  function anfragen() {
    document.querySelectorAll('#statusFilter .pille').forEach(function (p) {
      var n = ANFRAGEN.filter(function (a) { return a.status === p.dataset.filter; }).length;
      p.querySelector('b').textContent = n;
      p.classList.toggle('aktiv', p.dataset.filter === filter);
    });
    var l = ANFRAGEN.filter(function (a) { return a.status === filter; });
    $('#anfragenInhalt').innerHTML = l.length ? '<div class="liste">' + l.map(anfrageKarte).join('') + '</div>' :
      leer(filter === 'erledigt' ? 'Noch nichts erledigt.' : 'Alles erledigt.', filter === 'neu' ? 'Keine neuen Anfragen.' : '');
  }

  // Texte
  function texte() {
    $('#textWahl').innerHTML = TEXTE.map(function (t, i) {
      return '<button class="pille' + (i === textNr ? ' aktiv' : '') + '" data-aktion="textwahl" data-id="' + i + '">' + t.bereich + '</button>';
    }).join('');
  }
  function textLaden() {
    $('#textTitel').value = TEXTE[textNr].titel; $('#textInhalt').value = TEXTE[textNr].text;
    $('#textStand').textContent = ''; vorschau();
  }
  function vorschau() { $('#vTitel').textContent = $('#textTitel').value; $('#vInhalt').textContent = $('#textInhalt').value; }

  // Team
  function team() {
    var arten = [['Rezept', 'sl'], ['Überweisung', 'jh'], ['Krankschreibung', 'kb'], ['Termin', 'kb'], ['Befund', 'cm']];
    $('#regeln').innerHTML = arten.map(function (r) {
      return '<div class="regel"><b>' + r[0] + '</b><span>' + person(r[1]).name + '</span></div>';
    }).join('');
  }

  function zaehler() {
    var b = BOEGEN.filter(function (x) { return !x.gelesen; }).length;
    var a = ANFRAGEN.filter(function (x) { return x.status === 'neu'; }).length;
    $('#pBoegen').textContent = b || ''; $('#pAnfragen').textContent = a || '';
  }
  function alles() { heute(); boegen(); anfragen(); texte(); zaehler(); }

  // Blatt (Detail)
  function blatt(inhalt, fuss) {
    $('#blattInhalt').innerHTML = inhalt; $('#blattFuss').innerHTML = fuss || '';
    $('#blatt').hidden = false; $('#blattInhalt').scrollTop = 0;
  }
  function blattZu() { $('#blatt').hidden = true; }

  function bogenZeigen(id) {
    var b = finde(BOEGEN, id);
    blatt('<p class="ueberzeile">Anamnesebogen · Termin ' + tagText(b.datum) + ', ' + b.zeit + '</p><h2>' + b.name + '</h2>' +
      '<div class="angaben">' +
      '<div><span>Anlass</span>' + b.grund + '</div>' +
      '<div><span>Medikamente</span>' + b.medikamente + '</div>' +
      '<div><span>Allergien</span>' + b.allergien + '</div>' +
      '<div><span>Vorerkrankungen</span>' + b.vorerkrankungen + '</div>' +
      '<div><span>Geboren</span>' + b.geb + '</div>' +
      '<div><span>Krankenkasse</span>' + b.kasse + '</div></div>',
      '<button class="btn btn-gross" data-aktion="gelesen" data-id="' + b.id + '">' + (b.gelesen ? 'Schließen' : 'Gelesen') + '</button>' +
      '<button class="btn btn-leise" data-aktion="anarzt" data-id="' + b.id + '">An Dr. Müller geben</button>');
  }

  function anfrageZeigen(id) {
    var a = finde(ANFRAGEN, id);
    var leute = TEAM.map(function (t) {
      return '<button class="pille' + (t.id === a.an ? ' aktiv' : '') + '" data-aktion="weiter" data-wert="' + t.id + '" data-id="' + a.id + '">' + t.kurz + '</button>';
    }).join('');
    var stat = Object.keys(STATUS).map(function (k) {
      return '<button class="pille p-' + k + (k === a.status ? ' aktiv' : '') + '" data-aktion="status" data-wert="' + k + '" data-id="' + a.id + '">' + STATUS[k] + '</button>';
    }).join('');
    blatt('<p class="ueberzeile">' + a.typ + ' · ' + a.eingang + '</p><h2>' + a.name + '</h2><p><span class="marke-status m-bestand">Bestandspatient</span></p><p>' + a.text + '</p>' +
      '<p class="ueberzeile">Weitergeben an</p><div class="pillen">' + leute + '</div>' +
      '<p class="ueberzeile">Stand</p><div class="pillen">' + stat + '</div>',
      a.status !== 'erledigt' ? '<button class="btn btn-gross" data-aktion="status" data-wert="erledigt" data-id="' + a.id + '">Erledigt</button>' : '');
  }

  function eintragenZeigen() {
    blatt('<p class="ueberzeile">Aus T2med übernehmen</p><h2>Neupatient eintragen</h2>' +
      '<label>Name<input id="nName" type="text" autocomplete="off"></label>' +
      '<label>Termin<input id="nDatum" type="date" value="' + HEUTE + '"></label>' +
      '<label>Uhrzeit<input id="nZeit" type="time" value="12:00"></label>' +
      '<label>Handy oder E-Mail<input id="nKontakt" type="text"></label>',
      '<button class="btn btn-gross" data-aktion="neu-speichern">Eintragen</button>');
  }

  // Alle Klicks an einer Stelle
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-aktion],[data-zu]');
    if (!el) return;
    if (el.hasAttribute('data-zu')) { blattZu(); return; }
    var akt = el.dataset.aktion, id = el.dataset.id, wert = el.dataset.wert, o, a;
    e.stopPropagation();

    if (akt === 'bogen') bogenZeigen(id);
    if (akt === 'gelesen') { finde(BOEGEN, id).gelesen = true; blattZu(); melden('Als gelesen markiert'); }
    if (akt === 'anarzt') { finde(BOEGEN, id).gelesen = true; blattZu(); melden('An Dr. Müller gegeben'); }

    if (akt === 'senden') { o = finde(OHNE_BOGEN, id); o.gesendet = uhr(); melden('Link an ' + o.name + ' gesendet (Demo)'); }
    if (akt === 'oeffnen') { o = finde(OHNE_BOGEN, id); o.geoeffnet = uhr(); melden(o.name + ' hat den Link geöffnet (Demo)'); }
    if (akt === 'geklaert') { o = finde(OHNE_BOGEN, id); o.geklaert = true; melden('Erledigt: ' + o.name); }
    if (akt === 'eintragen') eintragenZeigen();
    if (akt === 'neu-speichern') {
      var name = $('#nName').value.trim();
      if (!name) { $('#nName').focus(); return; }
      OHNE_BOGEN.push({ id: 'o' + Date.now(), name: name, datum: $('#nDatum').value || HEUTE, zeit: $('#nZeit').value || '–',
        kontakt: $('#nKontakt').value || '–', gesendet: null, geoeffnet: null });
      blattZu(); melden(name + ' eingetragen');
    }

    if (akt === 'anfrage') anfrageZeigen(id);
    if (akt === 'status') {
      a = finde(ANFRAGEN, id); a.status = wert;
      if (!$('#blatt').hidden && wert === 'erledigt') blattZu();
      melden(a.name + ': ' + STATUS[wert]);
      if (!$('#blatt').hidden) anfrageZeigen(id);
    }
    if (akt === 'weiter') { a = finde(ANFRAGEN, id); a.an = wert; melden('Weitergegeben an ' + person(wert).kurz); anfrageZeigen(id); }

    if (akt === 'textwahl') { textNr = +id; texte(); textLaden(); }
  });

  $('#statusFilter').addEventListener('click', function (e) {
    var p = e.target.closest('.pille'); if (!p) return;
    filter = p.dataset.filter; anfragen();
  });
  $('#blatt').addEventListener('click', function (e) { if (e.target === this) blattZu(); });

  $('#textTitel').addEventListener('input', vorschau);
  $('#textInhalt').addEventListener('input', vorschau);
  $('#textSpeichern').addEventListener('click', function () {
    TEXTE[textNr].titel = $('#textTitel').value; TEXTE[textNr].text = $('#textInhalt').value;
    $('#textStand').textContent = 'Veröffentlicht um ' + uhr() + ' (Demo – nicht wirklich online).';
    melden('Text veröffentlicht (Demo)');
  });

  // Ansichten
  function zeigen(view) {
    if (!$('#view-' + view)) view = 'heute';
    document.querySelectorAll('.view').forEach(function (v) { v.hidden = v.id !== 'view-' + view; });
    document.querySelectorAll('[data-view]').forEach(function (a) { a.classList.toggle('aktiv', a.dataset.view === view); });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', function () { zeigen(location.hash.slice(1)); });

  function starten() { $('#login').hidden = true; $('#app').hidden = false; zeigen(location.hash.slice(1) || 'heute'); }
  $('#loginForm').addEventListener('submit', function (e) { e.preventDefault(); starten(); });

  // Anleitung
  function anleitungZu() {
    $('#anleitung').hidden = true;
    try { localStorage.setItem('lhDemo2Gesehen', '1'); } catch (e) {}
  }
  $('#anleitungZu').addEventListener('click', anleitungZu);
  $('#anleitungX').addEventListener('click', anleitungZu);
  $('#anleitung').addEventListener('click', function (e) { if (e.target === this) anleitungZu(); });
  $('#hilfeAuf').addEventListener('click', function (e) { e.preventDefault(); $('#anleitung').hidden = false; });
  var gesehen = null;
  try { gesehen = localStorage.getItem('lhDemo2Gesehen'); } catch (e) {}
  if (!gesehen) $('#anleitung').hidden = false;

  $('#demoReset').addEventListener('click', function () {
    try { localStorage.removeItem('lhDemo2'); } catch (e) {}
    location.hash = 'heute'; location.reload();
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { blattZu(); anleitungZu(); } });

  alles(); textLaden(); team();

  // ?direkt=ansicht überspringt die Anmeldung
  var d = location.search.match(/direkt=(\w+)/);
  if (d) { location.hash = d[1]; starten(); }
})();
