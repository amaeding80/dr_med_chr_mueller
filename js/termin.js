// Land-Harz-Praxis – Online-Termin, Rezept, Rückruf, Videosprechstunde
// Ablauf Termin: Bestands-/Neupatient > Standort > Besuchsgrund > Hinweis > Datenschutz > Termin > Anamnesebogen
// Einstellungen: js/land-harz.js (PRAXIS) und js/praxis-daten.js (Zeiten)
// Alles, was bei der Praxis ankommt, ist ein "Eingang" (siehe senden). Das Praxis-Dashboard liest genau dieses Format.

(function () {
  var P = window.PRAXIS || {};
  var D = window.PRAXIS_DATEN || { standorte: {}, sprechzeiten: {}, telefonsprechstunde: {}, nurHauptstandort: [] };
  var F = P.funktionen || {};
  var SPEICHER = 'lhpEingang'; // nur Vorschau: Eingänge in diesem Browser (für team-demo)

  // ---------- Grunddaten ----------
  var GRUENDE = [
    { id: 'akut', titel: 'Akute Beschwerden', text: 'Infekt, Schmerzen, plötzliche Beschwerden' },
    { id: 'kontrolle', titel: 'Kontrolle oder Dauerbehandlung', text: 'Blutdruck, Diabetes, Schilddrüse, Befundbesprechung' },
    { id: 'vorsorge', titel: 'Vorsorge / Check-up', text: 'Gesundheitsuntersuchung, Hautkrebsscreening' },
    { id: 'ultraschall', titel: 'Ultraschall', text: 'Sonografie' },
    { id: 'impfung', titel: 'Impfung', text: 'Impfberatung, Auffrischung, Reiseimpfung' },
    { id: 'ernaehrung', titel: 'Ernährungsmedizin', text: 'Zuerst ein Beratungsgespräch, per Video oder vor Ort' },
    { id: 'privat', titel: 'Privatleistung', text: 'BIA-Messung, Gesundheitszeugnis, Tauglichkeit' },
    { id: 'sonstiges', titel: 'Sonstiges', text: 'Attest oder anderes Anliegen' }
  ];
  var THEMEN = ['Gewicht / Adipositas', 'Stoffwechsel / Diabetes', 'Unverträglichkeit', 'Mangelernährung / Muskelabbau'];
  var SCHRITTE = ['Patient', 'Standort', 'Besuchsgrund', 'Hinweis', 'Datenschutz', 'Termin', 'Anamnesebogen'];
  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  function st(id) { return (D.standorte || {})[id] || { name: id, tel: '', telLink: '' }; }
  function nurWn(grund) { return (D.nurHauptstandort || []).indexOf(grund) > -1; }
  function grundTitel(id) { for (var i = 0; i < GRUENDE.length; i++) if (GRUENDE[i].id === id) return GRUENDE[i].titel; return id || ''; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hhmm(m) { return Math.floor(m / 60) + ':' + ('0' + m % 60).slice(-2); }
  function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function datumText(isoStr) { var d = new Date(isoStr + 'T12:00'); return TAGE[d.getDay()] + ', ' + d.getDate() + '.' + (d.getMonth() + 1) + '.'; }
  function zeitenText(z) {
    var out = [];
    for (var t = 1; t <= 5; t++) if (z && z[t]) out.push(TAGE[t].slice(0, 2) + ' ' + z[t].map(function (b) { return hhmm(b[0]) + '–' + hhmm(b[1]); }).join(', '));
    return out.join(' · ');
  }
  function jetztIn(z) {
    var n = new Date(), t = n.getHours() * 60 + n.getMinutes(), s = z && z[n.getDay()];
    if (!s) return false;
    for (var i = 0; i < s.length; i++) if (t >= s[i][0] && t < s[i][1]) return true;
    return false;
  }

  // ---------- Senden: eine Stelle für alles ----------
  // ziel 'endpunkt' oder gesetzter Endpunkt: per https an den Server (von dort ins Dashboard)
  // sonst Vorschau: nur in diesem Browser speichern, nichts verlässt das Gerät
  function senden(eingang, endpunkt) {
    eingang.id = eingang.id || 'w' + Date.now();
    eingang.eingang = new Date().toISOString();
    eingang.quelle = 'webseite';
    if (endpunkt && /^https:\/\//.test(endpunkt)) {
      return fetch(endpunkt, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(eingang) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return { ok: true, vorschau: false }; });
    }
    try {
      var l = JSON.parse(localStorage.getItem(SPEICHER) || '[]');
      l.push(eingang); localStorage.setItem(SPEICHER, JSON.stringify(l.slice(-40)));
    } catch (e) {}
    return Promise.resolve({ ok: true, vorschau: true });
  }
  window.lhpSenden = senden;

  // ---------- Dialog (ein Fenster für alles) ----------
  var dlg, dlgBox, dlgKopf, dlgInhalt, dlgFuss, zuletztFokus;
  function dialogBauen() {
    if (dlg) return;
    dlg = document.createElement('div');
    dlg.className = 'tb-overlay'; dlg.hidden = true;
    dlg.innerHTML = '<div class="tb-box" role="dialog" aria-modal="true" aria-labelledby="tb-titel">' +
      '<div class="tb-kopf"><div><p class="tb-ueber" id="tb-ueber"></p><h2 class="tb-titel" id="tb-titel" tabindex="-1"></h2></div>' +
      '<button type="button" class="tb-x" aria-label="Fenster schließen">&times;</button></div>' +
      '<div class="tb-fortschritt" id="tb-fortschritt" aria-hidden="true"></div>' +
      '<div class="tb-inhalt" id="tb-inhalt"></div><div class="tb-fuss" id="tb-fuss"></div></div>';
    document.body.appendChild(dlg);
    dlgBox = dlg.querySelector('.tb-box'); dlgInhalt = dlg.querySelector('#tb-inhalt'); dlgFuss = dlg.querySelector('#tb-fuss');
    dlg.querySelector('.tb-x').addEventListener('click', zu);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) zu(); });
    // capture: vor den alten Esc-Handlern der Seite, die sonst nach oben scrollen
    window.addEventListener('keydown', function (e) {
      if (dlg.hidden) return;
      if (e.key === 'Escape') { e.stopPropagation(); zu(); return; }
      if (e.key === 'Tab') { // Fokus bleibt im Fenster
        var f = dlgBox.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), textarea, select, iframe');
        if (!f.length) return;
        var a = f[0], b = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
      }
    }, true);
  }
  function auf(ueber, titel) {
    dialogBauen();
    if (dlg.hidden) { zuletztFokus = document.activeElement; dlg.hidden = false; document.documentElement.classList.add('tb-offen'); }
    dlg.querySelector('#tb-ueber').textContent = ueber || '';
    dlg.querySelector('#tb-titel').textContent = titel || '';
    dlgInhalt.scrollTop = 0;
    setTimeout(function () { dlg.querySelector('#tb-titel').focus(); }, 30);
  }
  function zu() {
    if (!dlg || dlg.hidden) return;
    dlg.hidden = true; document.documentElement.classList.remove('tb-offen');
    document.body.classList.remove('modal-open');
    if (zuletztFokus && zuletztFokus.focus) zuletztFokus.focus();
  }
  function fortschritt(n, gesamt) {
    var el = dlg.querySelector('#tb-fortschritt'), h = '';
    if (!n) { el.innerHTML = ''; return; }
    for (var i = 1; i <= gesamt; i++) h += '<span class="' + (i < n ? 'fertig' : i === n ? 'jetzt' : '') + '"></span>';
    el.innerHTML = h;
  }
  function wahlKarten(name, liste, wert, extra) {
    return '<div class="tb-wahl' + (extra || '') + '" role="radiogroup">' + liste.map(function (o) {
      var aus = o.aus ? ' disabled' : '';
      return '<label class="tb-karte' + (o.aus ? ' aus' : '') + '"><input type="radio" name="' + name + '" value="' + o.id + '"' + (wert === o.id ? ' checked' : '') + aus + '>' +
        '<span class="tb-karte-text"><strong>' + esc(o.titel) + '</strong>' + (o.text ? '<span>' + esc(o.text) + '</span>' : '') + '</span></label>';
    }).join('') + '</div>';
  }
  function wert(name) { var el = dlgBox.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
  function feld(id) { var el = dlgBox.querySelector('#' + id); return el ? el.value.trim() : ''; }
  function fehler(text) {
    var f = dlgBox.querySelector('.tb-fehler');
    if (!f) { f = document.createElement('p'); f.className = 'tb-fehler'; f.setAttribute('role', 'alert'); dlgFuss.insertBefore(f, dlgFuss.firstChild); }
    f.textContent = text;
  }
  function fuss(zurueck, weiterText, weiter) {
    dlgFuss.innerHTML = (zurueck ? '<button type="button" class="tb-btn tb-leise" data-tb="zurueck">Zurück</button>' : '<span></span>') +
      (weiterText ? '<button type="button" class="tb-btn tb-haupt" data-tb="weiter">' + weiterText + '</button>' : '');
    var z = dlgFuss.querySelector('[data-tb="zurueck"]'), w = dlgFuss.querySelector('[data-tb="weiter"]');
    if (z) z.addEventListener('click', zurueck);
    if (w) w.addEventListener('click', weiter);
  }

  // ---------- Termin-Ablauf ----------
  var T; // aktuelle Angaben
  function neu(grund, standort) {
    T = { art: 'termin', patient: '', standort: standort || '', grund: grund || '', ernaehrung: { form: '', thema: '' },
      kontakt: { vorname: '', nachname: '', geb: '', telefon: '', email: '' }, hinweis: '',
      datenschutz: { ok: false, zeit: '' }, termin: { datum: '', zeit: '', quelle: '' },
      anamnese: { status: '', weg: '', kurz: { allergien: '', vorerkrankungen: [], medikamente: '' } } };
  }
  function gesamt() { return T.patient === 'bestand' ? 6 : 7; }
  function kopf(n) { auf('Online-Termin · Schritt ' + n + ' von ' + gesamt(), SCHRITTE[n - 1] === 'Patient' ? 'Waren Sie schon bei uns?' : ({
    Standort: 'Welcher Standort?', Besuchsgrund: 'Worum geht es?', Hinweis: 'Ihre Angaben', Datenschutz: 'Datenschutz',
    Termin: 'Termin wählen', Anamnesebogen: 'Anamnesebogen' })[SCHRITTE[n - 1]]); fortschritt(n, gesamt()); }

  function s1() {
    kopf(1);
    dlgInhalt.innerHTML = wahlKarten('tb-patient', [
      { id: 'bestand', titel: 'Ja, ich bin Patientin / Patient der Praxis', text: 'Bestandspatient' },
      { id: 'neu', titel: 'Nein, ich komme zum ersten Mal', text: 'Neupatient – wir nehmen neue Patientinnen und Patienten auf' }
    ], T.patient);
    fuss(null, 'Weiter', function () {
      T.patient = wert('tb-patient');
      if (!T.patient) return fehler('Bitte wählen Sie eine Antwort.');
      s2();
    });
  }

  function s2() {
    kopf(2);
    var wn = st('wn'), hd = st('hd');
    dlgInhalt.innerHTML = wahlKarten('tb-standort', [
      { id: 'wn', titel: wn.name + ' · ' + wn.art, text: wn.adresse },
      { id: 'hd', titel: hd.name + ' · ' + hd.art, text: hd.adresse }
    ], T.standort) + '<p class="tb-klein">Ultraschall und Ernährungsmedizin gibt es nur in ' + esc(wn.name) + '. Die Termine für beide Standorte laufen über dieselbe Buchung.</p>';
    fuss(s1, 'Weiter', function () {
      T.standort = wert('tb-standort');
      if (!T.standort) return fehler('Bitte wählen Sie einen Standort.');
      if (T.standort === 'hd' && nurWn(T.grund)) T.grund = '';
      s3();
    });
  }

  function s3() {
    kopf(3);
    var hd = T.standort === 'hd';
    var liste = GRUENDE.map(function (g) {
      var aus = hd && nurWn(g.id);
      return { id: g.id, titel: g.titel, text: aus ? 'Nur in ' + st('wn').name : g.text, aus: aus };
    });
    dlgInhalt.innerHTML = wahlKarten('tb-grund', liste, T.grund, ' tb-wahl-2') +
      (hd ? '<p class="tb-klein">Ernährungsmedizin oder Ultraschall? <button type="button" class="tb-link" data-tb="zu-wn">Zu ' + esc(st('wn').name) + ' wechseln</button></p>' : '') +
      '<div class="tb-zusatz" id="tb-zusatz"></div>';
    var w = dlgBox.querySelector('[data-tb="zu-wn"]');
    if (w) w.addEventListener('click', function () { T.standort = 'wn'; s3(); });
    function zusatz() {
      var g = wert('tb-grund'), z = dlgBox.querySelector('#tb-zusatz');
      if (g === 'akut') z.innerHTML = '<p class="tb-hinweis">Bei starken oder schnell schlimmer werdenden Beschwerden rufen Sie bitte direkt an: <a href="' + st(T.standort).telLink + '">' + esc(st(T.standort).tel) + '</a>. Im Notfall: 112.</p>';
      else if (g === 'ernaehrung') {
        z.innerHTML = '<p class="tb-hinweis">Bei uns gibt es nie gleich einen langen Termin. Zuerst sprechen wir in einem Beratungsgespräch darüber, was möglich ist und was nicht. Ernährungsmedizinische Leistungen zahlt die gesetzliche Krankenkasse nicht. Über mögliche Kosten informieren wir Sie vorher.</p>' +
          '<fieldset class="tb-gruppe"><legend>Beratungsgespräch</legend>' + wahlKarten('tb-form', [
            { id: 'video', titel: 'Per Video', text: 'Videosprechstunde über Patmed' },
            { id: 'vorort', titel: 'Vor Ort', text: st('wn').name }], T.ernaehrung.form) + '</fieldset>' +
          '<fieldset class="tb-gruppe"><legend>Thema (freiwillig)</legend><div class="tb-pillen">' + THEMEN.map(function (t) {
            return '<label class="tb-pille"><input type="radio" name="tb-thema" value="' + esc(t) + '"' + (T.ernaehrung.thema === t ? ' checked' : '') + '><span>' + esc(t) + '</span></label>';
          }).join('') + '</div></fieldset>';
      } else z.innerHTML = '';
    }
    dlgBox.querySelectorAll('input[name="tb-grund"]').forEach(function (r) { r.addEventListener('change', zusatz); });
    zusatz();
    fuss(s2, 'Weiter', function () {
      var g = wert('tb-grund');
      if (!g) return fehler('Bitte wählen Sie einen Besuchsgrund.');
      if (g === 'ernaehrung') {
        T.ernaehrung.form = wert('tb-form'); T.ernaehrung.thema = wert('tb-thema');
        if (!T.ernaehrung.form) return fehler('Bitte wählen Sie: per Video oder vor Ort.');
      }
      T.grund = g; s4();
    });
  }

  function s4() {
    kopf(4);
    var k = T.kontakt;
    dlgInhalt.innerHTML =
      '<div class="tb-reihe"><label class="tb-feld">Vorname<input id="tb-vorname" autocomplete="given-name" value="' + esc(k.vorname) + '"></label>' +
      '<label class="tb-feld">Nachname<input id="tb-nachname" autocomplete="family-name" value="' + esc(k.nachname) + '"></label></div>' +
      '<div class="tb-reihe"><label class="tb-feld">Geburtsdatum<input id="tb-geb" inputmode="numeric" placeholder="TT.MM.JJJJ" value="' + esc(k.geb) + '"></label>' +
      '<label class="tb-feld">Telefon<input id="tb-tel" type="tel" autocomplete="tel" value="' + esc(k.telefon) + '"></label></div>' +
      '<label class="tb-feld">E-Mail <span class="tb-opt">(freiwillig, nur für die Terminbestätigung)</span><input id="tb-mail" type="email" autocomplete="email" value="' + esc(k.email) + '"></label>' +
      '<label class="tb-feld">Hinweis an die Praxis <span class="tb-opt">(freiwillig)</span><textarea id="tb-hinweis" rows="3" placeholder="z. B. kurz Ihre Beschwerden, Rollstuhl, Begleitperson, Dolmetscher">' + esc(T.hinweis) + '</textarea></label>' +
      '<p class="tb-klein">Bitte schicken Sie uns hier keine Befunde. Befunde tauschen wir nur verschlüsselt oder persönlich aus.</p>';
    fuss(s3, 'Weiter', function () {
      k.vorname = feld('tb-vorname'); k.nachname = feld('tb-nachname'); k.geb = feld('tb-geb');
      k.telefon = feld('tb-tel'); k.email = feld('tb-mail'); T.hinweis = feld('tb-hinweis');
      if (!k.vorname || !k.nachname) return fehler('Bitte geben Sie Ihren Namen ein.');
      if (!k.geb) return fehler('Bitte geben Sie Ihr Geburtsdatum ein.');
      if (!k.telefon) return fehler('Bitte geben Sie eine Telefonnummer für Rückfragen an.');
      s5();
    });
  }

  function s5() {
    kopf(5);
    dlgInhalt.innerHTML = '<p>Ihre Angaben nutzen wir nur, um Ihren Termin zu planen und vorzubereiten. Sie werden verschlüsselt übertragen und nicht per E-Mail verschickt.</p>' +
      '<label class="tb-check"><input type="checkbox" id="tb-ds"' + (T.datenschutz.ok ? ' checked' : '') + '><span>Ich habe die <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und bin mit der Verarbeitung meiner Angaben einverstanden.</span></label>';
    fuss(s4, 'Weiter', function () {
      if (!dlgBox.querySelector('#tb-ds').checked) return fehler('Bitte bestätigen Sie die Datenschutzerklärung.');
      T.datenschutz = { ok: true, zeit: new Date().toISOString() };
      s6();
    });
  }

  // Beispielzeiten aus den Sprechzeiten (nur Vorschau, keine echte Verfügbarkeit)
  function beispielZeiten(standort, grund) {
    var z = (D.sprechzeiten || {})[standort] || {}, tage = [], d = new Date();
    while (tage.length < 4) {
      d.setDate(d.getDate() + 1);
      var b = z[d.getDay()];
      if (!b) continue;
      var slots = [];
      b.forEach(function (bl) {
        for (var m = bl[0]; m <= bl[1] - 30; m += 30) {
          var belegt = ((d.getDate() * 7 + m / 30) % 3) === 0;
          if (grund === 'ernaehrung' && m % 120 !== 0) continue; // feste Zeitfenster
          slots.push({ zeit: hhmm(m), belegt: belegt });
        }
      });
      tage.push({ datum: iso(d), slots: slots });
    }
    return tage;
  }

  function s6() {
    kopf(6);
    var ziel = (P.termin || {}).ziel || 'vorschau';
    var t2 = (P.termin || {}).einbettung || (P.t2med && P.t2med.aktiv && P.t2med.link) || '';
    var sTel = st(T.standort);
    var fallback = '<p class="tb-klein">Lieber telefonisch? <a href="' + sTel.telLink + '">' + esc(sTel.tel) + '</a></p>';
    if (ziel === 't2med' && t2) {
      // Platzhalter für die T2med-Buchung: hier wird nur das Fenster eingebunden
      dlgInhalt.innerHTML = '<div class="tb-t2med" id="t2med-termin"><iframe src="' + esc(t2) + '" title="Termin bei T2med wählen" loading="lazy"></iframe></div>' +
        '<label class="tb-check"><input type="checkbox" id="tb-gebucht"><span>Ich habe meinen Termin gewählt.</span></label>' + fallback;
      fuss(s5, 'Weiter', function () {
        if (!dlgBox.querySelector('#tb-gebucht').checked) return fehler('Bitte wählen Sie zuerst Ihren Termin.');
        T.termin = { datum: '', zeit: '', quelle: 't2med' };
        T.patient === 'neu' ? s7() : abschicken();
      });
      return;
    }
    var tage = beispielZeiten(T.standort, T.grund);
    dlgInhalt.innerHTML = '<p class="tb-hinweis tb-vorschau">Vorschau: Diese Uhrzeiten sind Beispiele aus den Sprechzeiten, keine echten freien Termine. Die Online-Buchung über T2med folgt.</p>' +
      (T.grund === 'ernaehrung' ? '<p class="tb-klein">Für Beratungsgespräche gibt es feste Zeitfenster, die Dr. Müller festlegt.</p>' : '') +
      tage.map(function (t) {
        return '<fieldset class="tb-gruppe"><legend>' + datumText(t.datum) + '</legend><div class="tb-zeiten">' + t.slots.map(function (s) {
          var v = t.datum + ' ' + s.zeit;
          return '<label class="tb-zeit' + (s.belegt ? ' aus' : '') + '"><input type="radio" name="tb-slot" value="' + v + '"' + (s.belegt ? ' disabled' : '') +
            (T.termin.datum + ' ' + T.termin.zeit === v ? ' checked' : '') + '><span>' + s.zeit + (s.belegt ? '<span class="tb-sr"> belegt</span>' : '') + '</span></label>';
        }).join('') + '</div></fieldset>';
      }).join('') + fallback;
    fuss(s5, T.patient === 'neu' ? 'Weiter' : 'Termin anfragen', function () {
      var v = wert('tb-slot');
      if (!v) return fehler('Bitte wählen Sie eine Uhrzeit.');
      T.termin = { datum: v.split(' ')[0], zeit: v.split(' ')[1], quelle: 'vorschau' };
      T.patient === 'neu' ? s7() : abschicken();
    });
  }

  function s7() {
    kopf(7);
    var A = P.anamnese || {}, k = T.anamnese.kurz;
    var vor = ['Bluthochdruck', 'Diabetes', 'Herzerkrankung', 'Schilddrüse', 'Nierenerkrankung', 'Keine bekannt'];
    dlgInhalt.innerHTML = '<p>Für den ersten Termin brauchen wir Ihren Anamnesebogen. Wie möchten Sie ihn ausfüllen?</p>' +
      wahlKarten('tb-weg', [
        { id: 'praxis', titel: 'In der Praxis', text: 'Bitte kommen Sie dafür etwas früher.' },
        { id: 'online', titel: 'Online ausfüllen', text: A.online ? 'Direkt nach der Buchung' : 'Folgt in Kürze', aus: !A.online },
        { id: 'download', titel: 'Zum Ausdrucken', text: A.download ? 'Ausfüllen und mitbringen' : 'Folgt in Kürze', aus: !A.download }
      ], T.anamnese.weg || 'praxis') +
      '<details class="tb-details"><summary>Kurz vorab (freiwillig)</summary>' +
      '<label class="tb-feld">Allergien<textarea id="tb-allergien" rows="2" placeholder="z. B. Penicillin, Nüsse … oder: keine bekannt">' + esc(k.allergien) + '</textarea></label>' +
      '<fieldset class="tb-gruppe"><legend>Vorerkrankungen</legend><div class="tb-pillen">' + vor.map(function (v) {
        return '<label class="tb-pille"><input type="checkbox" name="tb-vor" value="' + v + '"' + (k.vorerkrankungen.indexOf(v) > -1 ? ' checked' : '') + '><span>' + v + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<label class="tb-feld">Medikamente<textarea id="tb-medis" rows="2" placeholder="z. B. Ramipril 5 mg … oder: keine">' + esc(k.medikamente) + '</textarea></label></details>';
    fuss(s6, 'Termin anfragen', function () {
      T.anamnese.weg = wert('tb-weg') || 'praxis';
      k.allergien = feld('tb-allergien'); k.medikamente = feld('tb-medis');
      k.vorerkrankungen = [].map.call(dlgBox.querySelectorAll('input[name="tb-vor"]:checked'), function (c) { return c.value; });
      abschicken();
    });
  }

  function abschicken() {
    if (T.patient !== 'neu') T.anamnese.status = 'nicht-noetig';
    else T.anamnese.status = 'fehlt'; // vollständiger Bogen kommt erst mit der Vorlage
    T.grundText = grundTitel(T.grund);
    var btn = dlgFuss.querySelector('[data-tb="weiter"]'); if (btn) btn.disabled = true;
    senden(JSON.parse(JSON.stringify(T)), (P.termin || {}).endpunkt).then(function (r) { fertig(r.vorschau); })
      .catch(function () { fehler('Das hat leider nicht geklappt. Bitte rufen Sie uns an: ' + st(T.standort).tel); if (btn) btn.disabled = false; });
  }

  function zeile(a, b) { return b ? '<div><dt>' + a + '</dt><dd>' + esc(b) + '</dd></div>' : ''; }
  function fertig(vorschau) {
    auf('Online-Termin', vorschau ? 'Vorschau: so sieht die Bestätigung aus' : 'Danke, Ihre Anfrage ist angekommen');
    fortschritt(0);
    var s = st(T.standort);
    dlgInhalt.innerHTML = '<dl class="tb-zusammen">' +
      zeile('Patient', T.patient === 'neu' ? 'Neupatient' : 'Bestandspatient') +
      zeile('Standort', s.name) +
      zeile('Besuchsgrund', T.grundText + (T.grund === 'ernaehrung' ? ' · Beratungsgespräch ' + (T.ernaehrung.form === 'video' ? 'per Video' : 'vor Ort') : '')) +
      zeile('Hinweis', T.hinweis) +
      zeile('Datenschutz', 'bestätigt') +
      zeile('Termin', T.termin.datum ? datumText(T.termin.datum) + ', ' + T.termin.zeit + ' Uhr' : 'über T2med gewählt') +
      zeile('Anamnesebogen', T.anamnese.status === 'nicht-noetig' ? 'nicht nötig' : T.anamnese.weg === 'praxis' ? 'wird in der Praxis ausgefüllt' : 'folgt') +
      '</dl>' +
      (vorschau ? '<p class="tb-hinweis tb-vorschau">Vorschau: Es wurde nichts an die Praxis gesendet. Die Angaben sind nur in diesem Browser gespeichert und erscheinen in der <a href="team-demo/#heute" target="_blank" rel="noopener">Dashboard-Demo</a>.</p>'
        : '<p>Wir melden uns, falls etwas unklar ist. Bitte bringen Sie Ihre Versichertenkarte mit.</p>');
    fuss(null, 'Schließen', zu);
  }

  function terminStarten(anliegen, standort) {
    var g = '', thema = '';
    if (anliegen) {
      var a = String(anliegen).toLowerCase();
      if (/ern|adipos|gewicht|stoffw|nahrung|mangel|sarko/.test(a)) {
        g = 'ernaehrung';
        thema = /adipos|gewicht/.test(a) ? THEMEN[0] : /stoffw|diab/.test(a) ? THEMEN[1] : /nahrung|unvertr/.test(a) ? THEMEN[2] : /mangel|sarko/.test(a) ? THEMEN[3] : '';
      } else if (/vorsorge|check/.test(a)) g = 'vorsorge';
      else if (/impf/.test(a)) g = 'impfung';
      else if (/privat|igel/.test(a)) g = 'privat';
      else if (/akut/.test(a)) g = 'akut';
    }
    var s = standort === 'heudeber' || standort === 'hd' || standort === 'ils' ? 'hd' : standort === 'wernigerode' || standort === 'wn' ? 'wn' : '';
    if (g === 'ernaehrung') s = 'wn';
    neu(g, s); T.ernaehrung.thema = thema;
    s1();
  }

  // ---------- Rezept (bestehendes Fenster auf der Startseite) ----------
  function rezeptSenden() {
    var q = function (id) { var el = document.getElementById(id); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; };
    if (!q('rz-vorname') || !q('rz-nachname')) return alert('Bitte geben Sie Ihren Namen ein.');
    if (!q('rz-gebdatum')) return alert('Bitte geben Sie Ihr Geburtsdatum ein.');
    if (!q('rz-telefon')) return alert('Bitte geben Sie Ihre Telefonnummer ein.');
    if (!q('rz-confirm')) return alert('Bitte bestätigen Sie, dass es sich um ein Dauermedikament handelt.');
    if (!q('rz-datenschutz')) return alert('Bitte stimmen Sie der Datenschutzerklärung zu.');
    var medis = [];
    document.querySelectorAll('.med-row-wrap-m').forEach(function (row) {
      var n = row.querySelector('.med-name'), ds = row.querySelector('.med-dosis'), pk = row.querySelector('.med-packung');
      if (n && n.value.trim()) medis.push([n.value.trim(), ds ? ds.value.trim() : '', pk ? pk.value.trim() : ''].filter(Boolean).join(', '));
    });
    if (!medis.length) return alert('Bitte geben Sie mindestens ein Medikament ein.');
    var e = { art: 'rezept', standort: (window.rezStandort === 'ils' ? 'hd' : 'wn'),
      kontakt: { vorname: q('rz-vorname'), nachname: q('rz-nachname'), geb: q('rz-gebdatum'), kasse: q('rz-kasse'), telefon: q('rz-telefon'), email: q('rz-email') },
      medikamente: medis, datenschutz: { ok: true, zeit: new Date().toISOString() } };
    var body = document.querySelector('#modal-rezept .modal-body');
    senden(e, (P.rezept || {}).endpunkt).then(function (r) {
      body.innerHTML = '<div class="tb-danke"><h3>' + (r.vorschau ? 'Vorschau: Rezeptanfrage' : 'Danke, Ihre Rezeptanfrage ist angekommen') + '</h3>' +
        (r.vorschau ? '<p>Es wurde nichts an die Praxis gesendet. Die Online-Rezeptbestellung wird gerade eingerichtet, bis dahin bestellen Sie bitte telefonisch: <a href="' + st('wn').telLink + '">' + st('wn').tel + '</a>.</p><p class="tb-klein">Die Anfrage erscheint zur Ansicht in der <a href="team-demo/#anfragen" target="_blank" rel="noopener">Dashboard-Demo</a>.</p>'
          : '<p>Das Rezept wird auf Ihre Gesundheitskarte übertragen. Bei Rückfragen rufen wir Sie an.</p>') +
        '<button type="button" class="tb-btn tb-haupt" onclick="closeModal(\'modal-rezept\')">Schließen</button></div>';
    }).catch(function () { alert('Das hat leider nicht geklappt. Bitte rufen Sie uns an: ' + st('wn').tel); });
  }

  // ---------- Rückruf ----------
  function rueckruf(standort) {
    auf('Telefon', 'Rückruf anfordern'); fortschritt(0);
    var tz = D.telefonsprechstunde || {};
    dlgInhalt.innerHTML = '<p>Wir rufen Sie zurück, sobald wir können.</p>' +
      wahlKarten('tb-rr-st', [{ id: 'wn', titel: st('wn').name }, { id: 'hd', titel: st('hd').name }], standort || 'wn', ' tb-wahl-2') +
      '<div class="tb-reihe"><label class="tb-feld">Name<input id="tb-rr-name" autocomplete="name"></label>' +
      '<label class="tb-feld">Telefon<input id="tb-rr-tel" type="tel" autocomplete="tel"></label></div>' +
      '<label class="tb-feld">Worum geht es? <span class="tb-opt">(kurz, freiwillig)</span><input id="tb-rr-text"></label>' +
      '<label class="tb-check"><input type="checkbox" id="tb-rr-ds"><span>Ich habe die <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und bin einverstanden.</span></label>';
    fuss(null, 'Rückruf anfordern', function () {
      var n = feld('tb-rr-name'), t = feld('tb-rr-tel');
      if (!n || !t) return fehler('Bitte geben Sie Name und Telefonnummer an.');
      if (!dlgBox.querySelector('#tb-rr-ds').checked) return fehler('Bitte bestätigen Sie die Datenschutzerklärung.');
      senden({ art: 'rueckruf', standort: wert('tb-rr-st') || 'wn', kontakt: { name: n, telefon: t }, anliegen: feld('tb-rr-text'),
        datenschutz: { ok: true, zeit: new Date().toISOString() } }, (P.rueckruf || {}).endpunkt).then(function (r) {
        auf('Telefon', r.vorschau ? 'Vorschau: Rückruf' : 'Danke, wir rufen Sie zurück');
        dlgInhalt.innerHTML = r.vorschau ? '<p class="tb-hinweis tb-vorschau">Vorschau: Es wurde nichts an die Praxis gesendet. Die Bitte erscheint zur Ansicht in der <a href="team-demo/#anfragen" target="_blank" rel="noopener">Dashboard-Demo</a>.</p>' : '<p>Ihre Rückrufbitte ist angekommen.</p>';
        fuss(null, 'Schließen', zu);
      }).catch(function () { fehler('Das hat leider nicht geklappt. Bitte rufen Sie uns an.'); });
    });
  }

  // ---------- Telefonsprechstunde: Anruf-Knopf nur in der Zeit, sonst Rückruf ----------
  function telefonBox() {
    document.querySelectorAll('[data-telefon]').forEach(function (box) {
      var tz = D.telefonsprechstunde || {}, h = '';
      ['wn', 'hd'].forEach(function (id) {
        var s = st(id), z = tz[id] || {}, offen = jetztIn(z), zeiten = zeitenText(z);
        h += '<div class="tel-ort"><p class="tel-name">' + esc(s.name) + '</p>' +
          (zeiten ? '<p class="tel-zeiten">Telefonsprechstunde: ' + esc(zeiten) + '</p>' : '') +
          (offen ? '<a class="tb-btn tb-haupt" href="' + s.telLink + '">Jetzt anrufen</a>'
            : '<button type="button" class="tb-btn" data-rueckruf="' + id + '">Rückruf anfordern</button>') + '</div>';
      });
      box.querySelector('.tel-orte').innerHTML = h;
    });
  }

  // ---------- kleine Info-Fenster ----------
  function info(ueber, titel, html) {
    auf(ueber, titel); fortschritt(0);
    dlgInhalt.innerHTML = html;
    fuss(null, 'Schließen', zu);
  }
  function video() {
    var link = (P.patmed || {}).link;
    if (link) { window.open(link, '_blank', 'noopener'); return; }
    info('Digitaler Empfang', 'Videosprechstunde',
      '<p>Die Videosprechstunde läuft über Patmed. Den Zugang richten wir gerade ein.</p>' +
      '<p>Bis dahin vereinbaren Sie die Videosprechstunde bitte telefonisch: <a href="' + st('wn').telLink + '">' + st('wn').tel + '</a>.</p>');
  }

  // ---------- an die Seite hängen ----------
  function start() {
    dialogBauen();
    if (!F.terminAlt) {
      window.openTerminModal = terminStarten;
      window.toggleErnaehrungsFlow = function () { terminStarten('ernaehrung', 'wn'); };
      window.openImpfModal = function () { terminStarten('impfung'); };
      window.openIgelModal = function () { terminStarten('privat'); };
      document.addEventListener('click', function (e) {
        var a = e.target.closest('[data-termin]');
        if (!a) return;
        e.preventDefault(); terminStarten(a.getAttribute('data-anliegen') || '', a.getAttribute('data-termin'));
      });
    }
    window.submitRezept = rezeptSenden;
    window.openAuModal = function () { video(); };
    window.openVideoModal = video;
    window.openUeberweisungModal = function () {
      info('Digitaler Empfang', 'Überweisung anfordern', '<p>Überweisungen fragen Sie bitte vorerst telefonisch an: <a href="' + st('wn').telLink + '">' + st('wn').tel + '</a> (Wernigerode) oder <a href="' + st('hd').telLink + '">' + st('hd').tel + '</a> (Heudeber).</p>');
    };
    window.openBefundModal = function () {
      info('Digitaler Empfang', 'Befunde', '<p>Befunde geben wir nur verschlüsselt oder persönlich heraus, nie per E-Mail.</p><p>Bitte sprechen Sie uns in der Praxis an oder rufen Sie an: <a href="' + st('wn').telLink + '">' + st('wn').tel + '</a>.</p>');
    };
    window.lhpRueckruf = rueckruf;
    document.addEventListener('click', function (e) {
      var r = e.target.closest('[data-rueckruf]');
      if (r) { e.preventDefault(); rueckruf(r.getAttribute('data-rueckruf')); }
      var v = e.target.closest('[data-video]');
      if (v) { e.preventDefault(); video(); }
    });
    // AU-Karte: hinter Schalter (PRAXIS.funktionen.au)
    document.querySelectorAll('[data-funktion="au"]').forEach(function (el) { el.hidden = !F.au; });
    // Demo-Knöpfe des alten Ablaufs
    if (!F.demoKnoepfe) {
      var css = document.createElement('style'); css.textContent = '#demo-buttons-wrap{display:none!important}';
      document.head.appendChild(css);
    }
    telefonBox();
    setInterval(telefonBox, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
