// Land Harz Praxis – Online-Termin, Rezept, Rückruf, Videosprechstunde
// Ablauf Termin: Anliegen > Mitbringen > Patient > Standort > Vorab-Angaben > Datenschutz > Termin > Anamnesebogen
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
  var SCHRITTE = ['Anliegen', 'Mitbringen', 'Patient', 'Standort', 'Angaben', 'Datenschutz', 'Termin', 'Anamnesebogen'];
  var TAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  // typische Mitbring-Liste je Terminart (allgemein, keine festgelegte Liste der Praxis)
  var MITBRINGEN = {
    akut: ['Versichertenkarte', 'Liste Ihrer Medikamente, falls vorhanden', 'Kurz notieren, seit wann die Beschwerden bestehen'],
    kontrolle: ['Versichertenkarte', 'Medikamentenplan', 'Aktuelle Befunde oder Messwerte, falls vorhanden'],
    vorsorge: ['Versichertenkarte', 'Impfausweis', 'Vorhandene Vorbefunde'],
    ultraschall: ['Versichertenkarte', 'Überweisung, falls Sie eine haben', 'Frühere Befunde zum Untersuchungsgebiet, falls vorhanden'],
    impfung: ['Versichertenkarte', 'Impfausweis'],
    ernaehrung: ['Versichertenkarte', 'Medikamentenplan', 'Aktuelle Laborwerte, falls vorhanden'],
    privat: ['Versichertenkarte oder Ausweis', 'Unterlagen zu Ihrem Anliegen, falls vorhanden'],
    sonstiges: ['Versichertenkarte', 'Unterlagen zu Ihrem Anliegen, falls vorhanden']
  };

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
      kontakt: { vorname: '', nachname: '', geb: '', kasse: '', telefon: '', email: '' }, hinweis: '',
      datenschutz: { ok: false, zeit: '' }, termin: { datum: '', zeit: '', quelle: '' },
      anamnese: { status: '', weg: '', unterschrift: '', kurz: { allergien: '', vorerkrankungen: [], medikamente: '' } } };
  }
  function schrittListe() {
    return T.patient === 'bestand' ? SCHRITTE.slice(0, 7) : SCHRITTE;
  }
  function gesamt() { return schrittListe().length; }
  var SCHRITT_TITEL = {
    Anliegen: 'Worum geht es?',
    Mitbringen: 'Was Sie bitte mitbringen',
    Patient: 'Waren Sie schon bei uns?',
    Standort: 'Welcher Standort?',
    Angaben: 'Ihre Angaben',
    Datenschutz: 'Datenschutz',
    Termin: 'Freien Termin wählen',
    Anamnesebogen: 'Beispiel-Anamnesebogen'
  };
  function kopf(name) {
    var l = schrittListe(), n = l.indexOf(name) + 1;
    if (n < 1) n = 1;
    auf('Termin vereinbaren · Schritt ' + n + ' von ' + l.length, SCHRITT_TITEL[name] || name);
    fortschritt(n, l.length);
  }

  function unterschriftStarten(leinwand) {
    var ctx = leinwand.getContext('2d');
    var zeichnen = false;
    function pos(e) {
      var r = leinwand.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (leinwand.width / r.width), y: (e.clientY - r.top) * (leinwand.height / r.height) };
    }
    leinwand.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      leinwand.setPointerCapture(e.pointerId);
      zeichnen = true;
      var p = pos(e);
      ctx.beginPath(); ctx.moveTo(p.x, p.y);
      leinwand.dataset.hatStrich = '1';
    });
    leinwand.addEventListener('pointermove', function (e) {
      if (!zeichnen) return;
      var p = pos(e);
      ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#212522';
      ctx.lineTo(p.x, p.y); ctx.stroke();
    });
    function ende() { zeichnen = false; }
    leinwand.addEventListener('pointerup', ende);
    leinwand.addEventListener('pointercancel', ende);
  }
  function unterschriftLeeren(leinwand) {
    var ctx = leinwand.getContext('2d');
    ctx.clearRect(0, 0, leinwand.width, leinwand.height);
    delete leinwand.dataset.hatStrich;
  }

  function sAnliegen() {
    kopf('Anliegen');
    var hd = T.standort === 'hd';
    var liste = GRUENDE.map(function (g) {
      var aus = hd && nurWn(g.id);
      return { id: g.id, titel: g.titel, text: aus ? 'Nur in ' + st('wn').name : g.text, aus: aus };
    });
    dlgInhalt.innerHTML = wahlKarten('tb-grund', liste, T.grund, ' tb-wahl-2') +
      '<div class="tb-zusatz" id="tb-zusatz"></div>';
    function zusatz() {
      var g = wert('tb-grund'), z = dlgBox.querySelector('#tb-zusatz');
      if (g === 'akut') z.innerHTML = '<p class="tb-hinweis">Bei starken oder schnell schlimmer werdenden Beschwerden rufen Sie bitte direkt an: <a href="' + st(T.standort || 'wn').telLink + '">' + esc(st(T.standort || 'wn').tel) + '</a>. Im Notfall: 112.</p>';
      else if (g === 'ernaehrung') {
        z.innerHTML = '<p class="tb-hinweis">Bei uns gibt es nie gleich einen langen Termin. Zuerst sprechen wir in einem Beratungsgespräch darüber, was möglich ist und was nicht. Ernährungsmedizinische Leistungen zahlt die gesetzliche Krankenkasse nicht. Über mögliche Kosten informieren wir Sie vorher.</p>' +
          '<fieldset class="tb-gruppe"><legend>Beratungsgespräch</legend>' + wahlKarten('tb-form', [
            { id: 'video', titel: 'Per Video', text: 'Videosprechstunde über Patmed' },
            { id: 'vorort', titel: 'Vor Ort', text: st('wn').name }], T.ernaehrung.form) + '</fieldset>' +
          '<fieldset class="tb-gruppe"><legend>Thema (freiwillig)</legend><div class="tb-pillen">' + THEMEN.map(function (th) {
            return '<label class="tb-pille"><input type="radio" name="tb-thema" value="' + esc(th) + '"' + (T.ernaehrung.thema === th ? ' checked' : '') + '><span>' + esc(th) + '</span></label>';
          }).join('') + '</div></fieldset>';
      } else z.innerHTML = '';
    }
    dlgBox.querySelectorAll('input[name="tb-grund"]').forEach(function (r) { r.addEventListener('change', zusatz); });
    zusatz();
    fuss(null, 'Weiter', function () {
      var g = wert('tb-grund');
      if (!g) return fehler('Bitte wählen Sie einen Besuchsgrund.');
      if (g === 'ernaehrung') {
        T.ernaehrung.form = wert('tb-form'); T.ernaehrung.thema = wert('tb-thema');
        if (!T.ernaehrung.form) return fehler('Bitte wählen Sie: per Video oder vor Ort.');
      }
      T.grund = g; sMitbringen();
    });
  }

  function sMitbringen() {
    kopf('Mitbringen');
    var liste = MITBRINGEN[T.grund] || MITBRINGEN.sonstiges;
    var extra = (T.grund === 'ernaehrung' && T.ernaehrung.form === 'video')
      ? '<li>Ruhiger Raum und ein Gerät mit Kamera und Mikrofon. Den Zugangslink erhalten Sie vor dem Termin.</li>' : '';
    dlgInhalt.innerHTML = '<p>Damit am Empfang möglichst nichts fehlt, bringen Sie bitte Folgendes mit. Die Liste ist eine Orientierung.</p>' +
      '<ul class="tb-mitbringen">' + liste.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + extra + '</ul>' +
      '<p class="tb-klein">Was sonst noch offen ist, klären wir in der Praxis.</p>';
    fuss(sAnliegen, 'Weiter', sPatient);
  }

  function sPatient() {
    kopf('Patient');
    dlgInhalt.innerHTML = wahlKarten('tb-patient', [
      { id: 'bestand', titel: 'Ja, ich bin Patientin / Patient der Praxis', text: 'Bestandspatient' },
      { id: 'neu', titel: 'Nein, ich komme zum ersten Mal', text: 'Neupatient – wir nehmen neue Patientinnen und Patienten auf' }
    ], T.patient);
    fuss(sMitbringen, 'Weiter', function () {
      T.patient = wert('tb-patient');
      if (!T.patient) return fehler('Bitte wählen Sie eine Antwort.');
      sStandort();
    });
  }

  function sStandort() {
    kopf('Standort');
    var wn = st('wn'), hd = st('hd');
    var nurHaupt = nurWn(T.grund);
    dlgInhalt.innerHTML = wahlKarten('tb-standort', [
      { id: 'wn', titel: wn.name + ' · ' + wn.art, text: wn.adresse },
      { id: 'hd', titel: hd.name + ' · ' + hd.art, text: nurHaupt ? 'Dieses Anliegen gibt es nur in ' + wn.name : hd.adresse, aus: nurHaupt }
    ], nurHaupt ? 'wn' : T.standort) +
      (nurHaupt ? '<p class="tb-klein">Ultraschall und Ernährungsmedizin gibt es nur in ' + esc(wn.name) + '.</p>' :
        '<p class="tb-klein">Die Termine für beide Standorte laufen über dieselbe Buchung.</p>');
    fuss(sPatient, 'Weiter', function () {
      T.standort = wert('tb-standort');
      if (!T.standort) return fehler('Bitte wählen Sie einen Standort.');
      if (T.standort === 'hd' && nurWn(T.grund)) return fehler('Dieses Anliegen gibt es nur in ' + wn.name + '.');
      sAngaben();
    });
  }

  function sAngaben() {
    kopf('Angaben');
    var k = T.kontakt;
    dlgInhalt.innerHTML =
      '<p>Bitte tragen Sie Ihre Angaben in Ruhe ein. Am Empfang reicht dann der Termin und die Versichertenkarte.</p>' +
      '<div class="tb-reihe"><label class="tb-feld">Vorname<input id="tb-vorname" autocomplete="given-name" value="' + esc(k.vorname) + '"></label>' +
      '<label class="tb-feld">Nachname<input id="tb-nachname" autocomplete="family-name" value="' + esc(k.nachname) + '"></label></div>' +
      '<div class="tb-reihe"><label class="tb-feld">Geburtsdatum<input id="tb-geb" inputmode="numeric" placeholder="TT.MM.JJJJ" value="' + esc(k.geb) + '"></label>' +
      '<label class="tb-feld">Krankenkasse<input id="tb-kasse" autocomplete="organization" value="' + esc(k.kasse || '') + '" placeholder="z. B. AOK Sachsen-Anhalt"></label></div>' +
      '<div class="tb-reihe"><label class="tb-feld">Telefon<input id="tb-tel" type="tel" autocomplete="tel" value="' + esc(k.telefon) + '"></label>' +
      '<label class="tb-feld">E-Mail <span class="tb-opt">(freiwillig, nur für die Terminbestätigung)</span><input id="tb-mail" type="email" autocomplete="email" value="' + esc(k.email) + '"></label></div>' +
      '<label class="tb-feld">Hinweis an die Praxis <span class="tb-opt">(freiwillig)</span><textarea id="tb-hinweis" rows="3" placeholder="z. B. kurz Ihre Beschwerden, Rollstuhl, Begleitperson, Dolmetscher">' + esc(T.hinweis) + '</textarea></label>' +
      '<p class="tb-klein">Bitte schicken Sie uns hier keine Befunde. Befunde tauschen wir nur verschlüsselt oder persönlich aus.</p>';
    fuss(sStandort, 'Weiter', function () {
      k.vorname = feld('tb-vorname'); k.nachname = feld('tb-nachname'); k.geb = feld('tb-geb');
      k.kasse = feld('tb-kasse'); k.telefon = feld('tb-tel'); k.email = feld('tb-mail'); T.hinweis = feld('tb-hinweis');
      if (!k.vorname || !k.nachname) return fehler('Bitte geben Sie Ihren Namen ein.');
      if (!k.geb) return fehler('Bitte geben Sie Ihr Geburtsdatum ein.');
      if (!k.kasse) return fehler('Bitte geben Sie Ihre Krankenkasse an.');
      if (!k.telefon) return fehler('Bitte geben Sie eine Telefonnummer für Rückfragen an.');
      sDatenschutz();
    });
  }

  function sDatenschutz() {
    kopf('Datenschutz');
    dlgInhalt.innerHTML = '<p>Ihre Angaben nutzen wir nur, um Ihren Termin zu planen und vorzubereiten. Sie werden verschlüsselt übertragen und nicht per E-Mail verschickt.</p>' +
      '<label class="tb-check"><input type="checkbox" id="tb-ds"' + (T.datenschutz.ok ? ' checked' : '') + '><span>Ich habe die <a href="datenschutz.html" target="_blank" rel="noopener">Datenschutzerklärung</a> gelesen und bin mit der Verarbeitung meiner Angaben einverstanden.</span></label>';
    fuss(sAngaben, 'Weiter', function () {
      if (!dlgBox.querySelector('#tb-ds').checked) return fehler('Bitte bestätigen Sie die Datenschutzerklärung.');
      T.datenschutz = { ok: true, zeit: new Date().toISOString() };
      sTermin();
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

  function sTermin() {
    kopf('Termin');
    var ziel = (P.termin || {}).ziel || 'vorschau';
    var t2 = (P.termin || {}).einbettung || (P.t2med && P.t2med.aktiv && P.t2med.link) || '';
    var sTel = st(T.standort);
    var fallback = '<p class="tb-klein">Lieber telefonisch? <a href="' + sTel.telLink + '">' + esc(sTel.tel) + '</a></p>';
    if (ziel === 't2med' && t2) {
      dlgInhalt.innerHTML = '<div class="tb-t2med" id="t2med-termin"><iframe src="' + esc(t2) + '" title="Freien Termin bei T2med wählen und verbindlich buchen" loading="lazy"></iframe></div>' +
        '<label class="tb-check"><input type="checkbox" id="tb-gebucht"><span>Ich habe meinen Termin bei T2med gebucht.</span></label>' + fallback;
      fuss(sDatenschutz, T.patient === 'neu' ? 'Weiter' : 'Termin vereinbaren', function () {
        if (!dlgBox.querySelector('#tb-gebucht').checked) return fehler('Bitte buchen Sie zuerst Ihren Termin.');
        T.termin = { datum: '', zeit: '', quelle: 't2med' };
        T.patient === 'neu' ? sAnamnese() : abschicken();
      });
      return;
    }
    var tage = beispielZeiten(T.standort, T.grund);
    dlgInhalt.innerHTML = '<p class="tb-hinweis tb-vorschau">Vorschau: Diese Uhrzeiten sind Beispiele aus den Sprechzeiten, keine echten freien Termine. Später wählen Sie hier über T2med einen freien Termin und buchen ihn verbindlich.</p>' +
      (T.grund === 'ernaehrung' ? '<p class="tb-klein">Für Beratungsgespräche gibt es feste Zeitfenster, die Dr. Müller festlegt.</p>' : '') +
      tage.map(function (tag) {
        return '<fieldset class="tb-gruppe"><legend>' + datumText(tag.datum) + '</legend><div class="tb-zeiten">' + tag.slots.map(function (s) {
          var v = tag.datum + ' ' + s.zeit;
          return '<label class="tb-zeit' + (s.belegt ? ' aus' : '') + '"><input type="radio" name="tb-slot" value="' + v + '"' + (s.belegt ? ' disabled' : '') +
            (T.termin.datum + ' ' + T.termin.zeit === v ? ' checked' : '') + '><span>' + s.zeit + (s.belegt ? '<span class="tb-sr"> belegt</span>' : '') + '</span></label>';
        }).join('') + '</div></fieldset>';
      }).join('') + fallback;
    fuss(sDatenschutz, T.patient === 'neu' ? 'Weiter' : 'Termin vereinbaren', function () {
      var v = wert('tb-slot');
      if (!v) return fehler('Bitte wählen Sie eine Uhrzeit.');
      T.termin = { datum: v.split(' ')[0], zeit: v.split(' ')[1], quelle: 'vorschau' };
      T.patient === 'neu' ? sAnamnese() : abschicken();
    });
  }

  function sAnamnese() {
    kopf('Anamnesebogen');
    var k = T.anamnese.kurz;
    var vor = ['Bluthochdruck', 'Diabetes', 'Herzerkrankung', 'Schilddrüse', 'Nierenerkrankung', 'Keine bekannt'];
    dlgInhalt.innerHTML =
      '<p class="tb-beispiel">Beispiel-Anamnesebogen. Das ist eine Vorlage, bis der Bogen der Praxis vorliegt. Keine Angaben aus einem echten Bogen von Dr. Müller.</p>' +
      wahlKarten('tb-weg', [
        { id: 'jetzt', titel: 'Jetzt ausfüllen', text: 'Auf diesem Gerät, mit Unterschrift' },
        { id: 'praxis', titel: 'In der Praxis', text: 'Bitte kommen Sie dafür etwas früher. Am Empfang oder am Tablet.' }
      ], T.anamnese.weg || 'jetzt') +
      '<div id="tb-bogen-felder">' +
      '<label class="tb-feld">Allergien<textarea id="tb-allergien" rows="2" placeholder="z. B. Penicillin, Nüsse … oder: keine bekannt">' + esc(k.allergien) + '</textarea></label>' +
      '<fieldset class="tb-gruppe"><legend>Vorerkrankungen</legend><div class="tb-pillen">' + vor.map(function (v) {
        return '<label class="tb-pille"><input type="checkbox" name="tb-vor" value="' + v + '"' + (k.vorerkrankungen.indexOf(v) > -1 ? ' checked' : '') + '><span>' + v + '</span></label>';
      }).join('') + '</div></fieldset>' +
      '<label class="tb-feld">Dauermedikamente<textarea id="tb-medis" rows="2" placeholder="z. B. Ramipril 5 mg … oder: keine">' + esc(k.medikamente) + '</textarea></label>' +
      '<div class="tb-unterschrift-feld">' +
      '<p><strong>Unterschrift</strong> mit Finger, Stift oder Maus</p>' +
      '<canvas id="tb-unterschrift" class="tb-unterschrift" width="600" height="180" aria-label="Unterschrift"></canvas>' +
      '<button type="button" class="tb-btn tb-leise" id="tb-unterschrift-leeren">Unterschrift löschen</button>' +
      '</div>' +
      '<label class="tb-check"><input type="checkbox" id="tb-bogen-ok"' + (T.anamnese.ok ? ' checked' : '') + '><span>Ich bestätige, dass meine Angaben nach bestem Wissen richtig sind.</span></label>' +
      '</div>';
    var leinwand = dlgBox.querySelector('#tb-unterschrift');
    unterschriftStarten(leinwand);
    dlgBox.querySelector('#tb-unterschrift-leeren').addEventListener('click', function () { unterschriftLeeren(leinwand); });
    function felderZeigen() {
      var jetzt = wert('tb-weg') !== 'praxis';
      dlgBox.querySelector('#tb-bogen-felder').hidden = !jetzt;
    }
    dlgBox.querySelectorAll('input[name="tb-weg"]').forEach(function (r) { r.addEventListener('change', felderZeigen); });
    felderZeigen();
    fuss(sTermin, 'Termin vereinbaren', function () {
      T.anamnese.weg = wert('tb-weg') || 'jetzt';
      k.allergien = feld('tb-allergien'); k.medikamente = feld('tb-medis');
      k.vorerkrankungen = [].map.call(dlgBox.querySelectorAll('input[name="tb-vor"]:checked'), function (c) { return c.value; });
      if (T.anamnese.weg === 'praxis') {
        T.anamnese.status = 'fehlt';
        T.anamnese.unterschrift = '';
        abschicken();
        return;
      }
      if (!k.allergien || !k.medikamente) return fehler('Bitte füllen Sie Allergien und Medikamente aus, oder schreiben Sie „keine bekannt“.');
      if (!k.vorerkrankungen.length) return fehler('Bitte wählen Sie mindestens eine Angabe bei den Vorerkrankungen.');
      if (!leinwand.dataset.hatStrich) return fehler('Bitte unterschreiben Sie den Bogen.');
      if (!dlgBox.querySelector('#tb-bogen-ok').checked) return fehler('Bitte bestätigen Sie Ihre Angaben.');
      T.anamnese.unterschrift = leinwand.toDataURL('image/png');
      T.anamnese.status = 'ausgefuellt';
      T.anamnese.ok = true;
      abschicken();
    });
  }

  function abschicken() {
    if (T.patient !== 'neu' && !T.anamnese.status) T.anamnese.status = 'nicht-noetig';
    T.grundText = grundTitel(T.grund);
    var btn = dlgFuss.querySelector('[data-tb="weiter"]'); if (btn) btn.disabled = true;
    var paket = JSON.parse(JSON.stringify(T));
    var nachher = function (r) { fertig(r.vorschau); };
    var scheitern = function () { fehler('Das hat leider nicht geklappt. Bitte rufen Sie uns an: ' + st(T.standort).tel); if (btn) btn.disabled = false; };
    var kette = window.t2medAnbindung
      ? t2medAnbindung.terminAnT2med(paket).then(function (r) {
          if (r && r.vorschau) return senden(paket, (P.termin || {}).endpunkt);
          if (T.anamnese.status === 'ausgefuellt') {
            return t2medAnbindung.anamneseInAkte(paket.kontakt, paket.anamnese).then(function () { return r; });
          }
          return r;
        })
      : senden(paket, (P.termin || {}).endpunkt);
    kette.then(nachher).catch(scheitern);
  }

  function zeile(a, b) { return b ? '<div><dt>' + a + '</dt><dd>' + esc(b) + '</dd></div>' : ''; }
  function fertig(vorschau) {
    auf('Termin vereinbaren', vorschau ? 'Vorschau: so sieht die Bestätigung aus' : 'Ihr Termin ist vereinbart');
    fortschritt(0);
    var s = st(T.standort);
    dlgInhalt.innerHTML = '<dl class="tb-zusammen">' +
      zeile('Patient', T.patient === 'neu' ? 'Neupatient' : 'Bestandspatient') +
      zeile('Standort', s.name) +
      zeile('Besuchsgrund', T.grundText + (T.grund === 'ernaehrung' ? ' · Beratungsgespräch ' + (T.ernaehrung.form === 'video' ? 'per Video' : 'vor Ort') : '')) +
      zeile('Hinweis', T.hinweis) +
      zeile('Datenschutz', 'bestätigt') +
      zeile('Termin', T.termin.datum ? datumText(T.termin.datum) + ', ' + T.termin.zeit + ' Uhr' : 'über T2med gewählt') +
      zeile('Krankenkasse', T.kontakt.kasse) +
      zeile('Anamnesebogen', T.anamnese.status === 'ausgefuellt' ? 'ausgefüllt' : T.anamnese.status === 'nicht-noetig' ? 'nicht nötig' : 'fehlt, wird in der Praxis ausgefüllt') +
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
    sAnliegen();
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
      body.innerHTML = '<div class="tb-danke"><h3>' + (r.vorschau ? 'Vorschau: Rezeptbestellung' : 'Danke, Ihre Rezeptbestellung ist angekommen') + '</h3>' +
        (r.vorschau ? '<p>Es wurde nichts an die Praxis gesendet. Die Online-Rezeptbestellung wird gerade eingerichtet, bis dahin bestellen Sie bitte telefonisch: <a href="' + st('wn').telLink + '">' + st('wn').tel + '</a>.</p><p class="tb-klein">Das Anliegen erscheint zur Ansicht in der <a href="team-demo/#anfragen" target="_blank" rel="noopener">Dashboard-Demo</a>.</p>'
          : '<p>Das Rezept wird auf Ihre Gesundheitskarte übertragen. Bei Rückfragen rufen wir Sie an.</p>') +
        '<button type="button" class="tb-btn tb-haupt" onclick="closeModal(\'modal-rezept\')">Schließen</button></div>';
    }).catch(function () { alert('Das hat leider nicht geklappt. Bitte rufen Sie uns an: ' + st('wn').tel); });
  }

  // ---------- Rückruf ----------
  function rueckruf(standort) {
    auf('Telefon', 'Rückruf anfordern'); fortschritt(0);
    var tz = D.telefonsprechstunde || {};
    var rrVorschau = !/^https:\/\//.test((P.rueckruf || {}).endpunkt || '');
    dlgInhalt.innerHTML = (rrVorschau ? '<p class="tb-hinweis">Vorschau: Es wird noch nichts gesendet. Bitte rufen Sie uns an: <a href="' + st('wn').telLink + '">' + esc(st('wn').tel) + '</a> (' + esc(st('wn').name) + '), <a href="' + st('hd').telLink + '">' + esc(st('hd').tel) + '</a> (' + esc(st('hd').name) + ').</p>' : '') +
      '<p>Wir rufen Sie zurück, sobald wir können.</p>' +
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
    var v = P.video || {};
    var link = (v.aktiv && v.url) ? v.url : ((P.patmed || {}).link || '');
    if (link) { window.open(link, '_blank', 'noopener'); return; }
    info('Digitaler Empfang', 'Videosprechstunde',
      '<p>Die Videosprechstunde läuft über Patmed. Den persönlichen Link erhalten Sie vor dem Termin per SMS oder E-Mail.</p>' +
      '<p><a href="videosprechstunde.html">So läuft die Videosprechstunde ab</a></p>' +
      '<p>Einen Termin vereinbaren Sie auf dieser Seite oder telefonisch: <a href="' + st('wn').telLink + '">' + st('wn').tel + '</a>.</p>');
  }

  // ---------- an die Seite hängen ----------
  // Kopfleiste schmaler, sobald gescrollt wird
  function kopfleiste() {
    var h = document.querySelector('header');
    if (!h) return;
    var an = function () { h.classList.toggle('kopf-schmal', window.scrollY > 60); };
    window.addEventListener('scroll', an, { passive: true }); an();
  }

  function start() {
    dialogBauen(); kopfleiste();
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
