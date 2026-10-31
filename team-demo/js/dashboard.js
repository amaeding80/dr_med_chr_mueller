(function () {
  var $ = function (s) { return document.querySelector(s); };
  var STATUS = { neu: 'Neu', arbeit: 'In Arbeit', erledigt: 'Erledigt' };
  var filter = 'neu', textNr = 0;

  // Schalter: persönlicher Link an Neupatienten (senden, geöffnet, Tracking).
  // Vorerst aus, evtl. später über T2med. Wieder einschalten: true setzen.
  var FUNKTIONEN = { link: false };

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

  function kontakt(k) {
    if (/^[0-9+ ]+$/.test(k)) return '<a href="tel:' + k.replace(/ /g, '') + '">' + k + '</a>';
    return k;
  }
  function eingangKey(a) { var m = a.eingang.split(/[. ]+/); return m[1] + m[0] + m[2]; }
  function nachEingang(a, b) { return eingangKey(a) < eingangKey(b) ? -1 : 1; }

  function person(id) { return TEAM.filter(function (t) { return t.id === id; })[0] || { kurz: '–' }; }
  function finde(liste, id) { return liste.filter(function (x) { return x.id == id; })[0]; }

  function speichern() {
    try { localStorage.setItem('lhDemo5', JSON.stringify({ b: BOEGEN, a: ANFRAGEN, t: TEXTE, o: OHNE_BOGEN, s: BESTAND })); } catch (e) {}
  }
  function melden(t) {
    speichern();
    var m = $('#meldung');
    m.textContent = t; m.classList.add('an');
    clearTimeout(m._t); m._t = setTimeout(function () { m.classList.remove('an'); }, 2200);
    alles();
  }
  function leer(text, klein) { return '<div class="leer">' + text + (klein ? '<small>' + klein + '</small>' : '') + '</div>'; }

  // Online-Bogen eingegangen? (gleicher Name, gleicher Tag)
  function bogenDa(o) {
    if (o.eingegangen) return true;
    return BOEGEN.some(function (b) { return b.name.toLowerCase() === o.name.toLowerCase() && tag(b.datum) === tag(o.datum); });
  }

  // Karten
  function bogenKarte(b) {
    return '<div class="eintrag" data-aktion="bogen" data-id="' + b.id + '">' +
      '<div class="oben"><span class="zeit">' + b.zeit + '</span>' +
      (b.gelesen ? '<span class="marke-status m-erledigt">Gelesen</span>' : '<span class="marke-status m-neu">Neu</span>') + '</div>' +
      '<div><div class="name">' + b.name + '</div><p>' + tagText(b.datum) + ' · ' + b.grund + '</p></div>' +
      '<div class="knopfreihe"><button class="btn" data-aktion="bogen" data-id="' + b.id + '">Ansehen</button></div></div>';
  }

  // Fortschritt: Bogen fehlt, Link gesendet, Link geöffnet, Bogen da
  function stufe(o) { return bogenDa(o) ? 4 : o.geoeffnet ? 3 : o.gesendet ? 2 : 1; }
  function punkte(o) {
    var s = stufe(o), n = ['Bogen fehlt', 'Link gesendet', 'Link geöffnet', 'Bogen da ✓'], h = '';
    for (var i = 1; i <= 4; i++) h += '<span class="' + (i <= s ? 'an' : '') + '"></span>';
    return '<div class="schritte-punkte" title="' + n.join(' → ') + '">' + h + '</div>' +
      '<div class="schritt-text">Schritt ' + s + ' von 4: ' + n[s - 1] + '</div>';
  }

  function fehltKarte(o) {
    var status, knopf = '', extra = '', s = stufe(o), cls = '';
    if (s === 4) {
      status = '<span class="marke-status m-da">Bogen da ✓</span>';
      extra = '<p>Fertig – nichts mehr zu tun.</p>'; cls = ' fertig';
    } else if (o.geklaert) {
      status = '<span class="marke-status m-erledigt">Vor Ort geklärt ✓</span>';
      extra = '<p>Fertig – nichts mehr zu tun.</p>'; cls = ' fertig';
    } else if (s === 3) {
      status = '<span class="marke-status m-arbeit">Link geöffnet ' + o.geoeffnet + '</span>';
      extra = '<p><b>Vor Ort fragen:</b> Bogen schon ausgefüllt?</p>';
      knopf = '<button class="btn btn-haupt" data-aktion="geklaert" data-id="' + o.id + '">Vor Ort geklärt</button>' +
        '<button class="btn btn-leise" data-aktion="senden" data-id="' + o.id + '">Link erneut senden</button>' +
        '<button class="btn btn-demo" data-aktion="eingang" data-id="' + o.id + '">Demo: Bogen kommt an</button>';
    } else if (s === 2) {
      status = '<span class="marke-status m-arbeit">Link gesendet ' + o.gesendet + '</span>';
      knopf = '<button class="btn btn-leise" data-aktion="senden" data-id="' + o.id + '">Link erneut senden</button>' +
        '<button class="btn btn-demo" data-aktion="oeffnen" data-id="' + o.id + '">Demo: Patient öffnet Link</button>';
    } else {
      status = '<span class="marke-status m-fehlt">Bogen fehlt</span>'; cls = ' dringend';
      knopf = '<button class="btn btn-dringend" data-aktion="senden" data-id="' + o.id + '">Link senden</button>';
    }
    return '<div class="eintrag' + cls + '">' +
      '<div class="oben"><span class="zeit">' + o.zeit + '</span>' + status + '</div>' +
      '<div><div class="name">' + o.name + '</div><p>' + tagText(o.datum) + ' · ' + kontakt(o.kontakt) + '</p>' + extra + '</div>' +
      (o.geklaert ? '' : punkte(o)) +
      (knopf ? '<div class="knopfreihe">' + knopf + '</div>' : '') + '</div>';
  }

  function anfrageKarte(a) {
    var knopf = a.status === 'neu' ? '<button class="btn btn-haupt" data-aktion="status" data-wert="arbeit" data-id="' + a.id + '">Übernehmen</button>' :
      a.status === 'arbeit' ? '<button class="btn" data-aktion="anfrage" data-id="' + a.id + '">Weiterleiten</button>' +
        '<button class="btn btn-haupt" data-aktion="status" data-wert="erledigt" data-id="' + a.id + '">Erledigt</button>' :
      '<button class="btn btn-leise" data-aktion="status" data-wert="neu" data-id="' + a.id + '">Wieder öffnen</button>';
    return '<div class="eintrag" data-aktion="anfrage" data-id="' + a.id + '">' +
      '<div class="oben"><span class="ueberzeile">' + a.typ + '</span><span class="marke-status m-' + a.status + '">' + STATUS[a.status] + '</span></div>' +
      '<div><span class="marke-status m-bestand">Bestandspatient</span><div class="name">' + a.name + '</div><p>' + a.text + '</p></div>' +
      '<p class="zustaendig">Zuständig: <b>' + person(a.an).kurz + '</b> · ' + a.eingang + '</p>' +
      '<div class="knopfreihe">' + knopf + '</div></div>';
  }

  // Termine: eine Liste, nach Tag gruppiert
  // Demo: feste Uhrzeit, damit "Jetzt" mitten im Vormittag steht
  var JETZT = '10:15';

  function aufgabe(t) {
    if (!t.o || t.o.geklaert) return '';
    if (!FUNKTIONEN.link) return 'vorort';
    if (!t.o.gesendet) return 'senden';
    return t.o.geoeffnet ? 'fragen' : '';
  }

  function terminZeile(t) {
    var status = '', knopf = '', klick = '', o = t.o;
    if (t.bogen) { status = '<span class="lbl l-gruen">✓ Bogen da</span>'; klick = ' data-aktion="bogen" data-id="' + t.bogen.id + '"'; }
    else if (o && !FUNKTIONEN.link) {
      if (o.geklaert) status = '<span class="lbl l-gruen">✓ Vor Ort ausgefüllt</span>';
      else {
        status = '<span class="lbl l-amber">Bogen fehlt – vor Ort ausfüllen</span>';
        knopf = '<button class="btn btn-klein" data-aktion="geklaert" data-id="' + o.id + '">Erledigt</button>';
      }
    }
    else if (o) {
      klick = ' data-aktion="termin" data-id="' + o.id + '"';
      if (o.geklaert) status = '<span class="lbl l-gruen">✓ Vor Ort geklärt</span>';
      else if (o.geoeffnet) {
        status = '<span class="lbl l-amber">Link geöffnet – vor Ort fragen</span>';
        knopf = '<button class="btn btn-klein" data-aktion="geklaert" data-id="' + o.id + '">Geklärt</button>';
      } else if (o.gesendet) {
        status = '<span class="lbl l-grau">Link nicht geöffnet</span>';
        knopf = '<button class="btn btn-klein" data-aktion="senden" data-id="' + o.id + '">Erneut senden</button>';
      } else knopf = '<button class="btn btn-klein btn-dringend" data-aktion="senden" data-id="' + o.id + '">Link senden</button>';
    }
    var vorbei = tag(t.datum) === HEUTE && t.zeit < JETZT && !knopf;
    return '<li class="termin' + (aufgabe(t) || knopf || (t.akut && !vorbei) ? ' aufgabe' : '') + (t.akut ? ' akut' : '') + (vorbei ? ' vorbei' : '') + '"' + (o ? ' id="t-' + o.id + '"' : t.id ? ' id="t-' + t.id + '"' : '') + klick + '>' +
      '<span class="t-zeit">' + t.zeit + '</span>' +
      '<div class="t-mitte"><div class="t-name">' + t.name + (t.art === 'neu' ? ' <span class="marke-art a-neu">Neu</span>' : '') + (t.akut ? ' <span class="marke-art a-akut">Akut</span>' : '') + '</div>' +
      '<p class="t-hinweis">' + (t.hinweis || '–') + '</p>' + status + '</div>' +
      (knopf ? '<div class="t-knopf">' + knopf + '</div>' : '') + '</li>';
  }

  function alleTermine() {
    var l = BESTAND.map(function (b) { return { art: 'bestand', id: b.id, akut: b.akut, name: b.name, datum: b.datum, zeit: b.zeit, hinweis: b.hinweis }; });
    BOEGEN.forEach(function (b) { l.push({ art: 'neu', name: b.name, datum: b.datum, zeit: b.zeit, hinweis: b.grund, bogen: b }); });
    OHNE_BOGEN.forEach(function (o) { if (!bogenDa(o)) l.push({ art: 'neu', name: o.name, datum: o.datum, zeit: o.zeit, hinweis: o.hinweis, o: o }); });
    return l.filter(function (t) { return tag(t.datum) >= HEUTE; }).sort(nachTermin);
  }

  function heute() {
    $('#heuteDatum').textContent = jetzt.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    var liste = alleTermine(), html = '', zuletzt = null, jetztDa = false;
    var heuteL = liste.filter(function (t) { return tag(t.datum) === HEUTE; });
    var senden = heuteL.filter(function (t) { return aufgabe(t) === 'senden'; });
    var fragen = heuteL.filter(function (t) { return aufgabe(t) === 'fragen'; });
    var vorort = heuteL.filter(function (t) { return aufgabe(t) === 'vorort'; });
    var akut = heuteL.filter(function (t) { return t.akut && t.zeit >= JETZT; });
    var teile = [];
    if (akut.length) teile.push('<a href="#" data-aktion="springen" data-id="' + akut[0].id + '">' + akut.length + ' Akuttermin' + (akut.length === 1 ? '' : 'e') + '</a>');
    if (vorort.length) teile.push('<a href="#" data-aktion="springen" data-id="' + vorort[0].o.id + '">' + vorort.length + (vorort.length === 1 ? ' Bogen' : ' Bögen') + ' vor Ort</a>');
    if (senden.length) teile.push('<a href="#" data-aktion="springen" data-id="' + senden[0].o.id + '">' + senden.length + ' Link senden</a>');
    if (fragen.length) teile.push('<a href="#" data-aktion="springen" data-id="' + fragen[0].o.id + '">' + fragen.length + ' vor Ort fragen</a>');
    $('#heuteZuTun').innerHTML = teile.length ? 'Heute zu tun: ' + teile.join(', ') : '✓ Heute alles erledigt';

    liste.forEach(function (t) {
      var d = tag(t.datum);
      if (d !== zuletzt) {
        if (zuletzt) html += '</ul>';
        var titel = d === HEUTE ? 'Heute' : d === MORGEN ? 'Morgen' :
          new Date(d + 'T12:00').toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'numeric' });
        html += '<h2 class="tag-titel">' + titel + '</h2><ul class="termine">';
        zuletzt = d;
      }
      if (d === HEUTE && !jetztDa && t.zeit >= JETZT) { html += '<li class="jetzt-linie"><span>Jetzt ' + JETZT + '</span></li>'; jetztDa = true; }
      html += terminZeile(t);
    });
    $('#heuteInhalt').innerHTML = html ? html + '</ul>' : leer('Keine Termine.');
  }

  function terminZeigen(id) {
    var o = finde(OHNE_BOGEN, id), k = '';
    if (o.gesendet) k += '<button class="btn" data-aktion="senden" data-id="' + o.id + '">Link erneut senden</button>';
    if (o.geoeffnet && !o.geklaert) k += '<button class="btn btn-haupt" data-aktion="geklaert" data-id="' + o.id + '">Vor Ort geklärt</button>';
    if (o.gesendet && !o.geoeffnet) k += '<button class="btn btn-demo" data-aktion="oeffnen" data-id="' + o.id + '">Demo: Patient öffnet Link</button>';
    if (o.gesendet) k += '<button class="btn btn-demo" data-aktion="eingang" data-id="' + o.id + '">Demo: Bogen kommt an</button>';
    blatt('<p class="ueberzeile">Neupatient · ' + tagText(o.datum) + ', ' + o.zeit + '</p><h2>' + o.name + '</h2>' +
      '<p>' + (o.hinweis || '') + '</p><p>' + kontakt(o.kontakt) + '</p>' +
      (o.gesendet ? '<p class="klein">Link gesendet ' + o.gesendet + (o.geoeffnet ? ' · geöffnet ' + o.geoeffnet : '') + '</p>' : ''),
      '<div class="knopfreihe">' + k + '</div>');
  }

  // Bögen
  function boegen() {
    var fehlt = OHNE_BOGEN.slice().sort(function (a, b) {
      var fa = bogenDa(a) || a.geklaert, fb = bogenDa(b) || b.geklaert;
      return fa !== fb ? (fa ? 1 : -1) : nachTermin(a, b);
    });
    var liste = BOEGEN.slice().sort(nachTermin);
    $('#boegenInhalt').innerHTML =
      '<div class="abschnitt"><h2>Bogen fehlt</h2><button class="btn" data-aktion="eintragen">+ Neupatient eintragen</button></div>' +
      '<p class="klein">Neupatienten aus T2med, die den Bogen bei der Buchung übersprungen haben.</p>' +
      (FUNKTIONEN.link ? '<p class="hinweis-box">Wir sehen nur, ob der Link geöffnet wurde.</p>' +
        '<div class="liste">' + fehlt.map(fehltKarte).join('') + '</div>' :
        '<ul class="termine">' + fehlt.filter(function (o) { return !bogenDa(o); }).map(function (o) {
          return terminZeile({ art: 'neu', name: o.name, datum: o.datum, zeit: o.zeit, hinweis: o.hinweis, o: o });
        }).join('') + '</ul>') +
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
    var l = ANFRAGEN.filter(function (a) { return a.status === filter; }).sort(nachEingang);
    $('#anfragenInhalt').innerHTML = l.length ? '<div class="liste">' + l.map(anfrageKarte).join('') + '</div>' :
      leer(filter === 'erledigt' ? 'Noch nichts erledigt.' : 'Alles erledigt.', filter === 'neu' ? 'Keine neuen Anfragen.' : '');
  }

  // Texte
  function texte() {
    $('#textWahl').innerHTML = TEXTE.map(function (t, i) {
      return '<button class="pille' + (i === textNr ? ' aktiv' : '') + '" data-aktion="textwahl" data-id="' + i + '">' + t.bereich + '</button>';
    }).join('');
  }
  var gespeichert = false;
  function textLaden() {
    var t = TEXTE[textNr];
    $('#textTitel').value = t.titel; $('#textInhalt').value = t.text;
    $('#textStand').textContent = ''; $('#textOnline').disabled = true; gespeichert = false;
    $('#textZurueck').hidden = !t.vorher;
    vorschau();
  }
  function vorschau() { $('#vTitel').textContent = $('#textTitel').value; $('#vInhalt').textContent = $('#textInhalt').value; }

  // Team
  function team() {
    var arten = [['Termin', 'kb'], ['Rezept', 'sl'], ['AU', 'kb'], ['Überweisung', 'jh'], ['Befund', 'jh'], ['Impfung', 'kb'], ['Ernährung', 'cm'], ['Privatleistung', 'cm']];
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
      (FUNKTIONEN.link ? '<label>Handy oder E-Mail<input id="nKontakt" type="text"></label>' : '') +
      '<label>Hinweis des Patienten<input id="nHinweis" type="text"></label>',
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
    if (akt === 'termin') { terminZeigen(id); return; }
    if (akt === 'springen') {
      e.preventDefault();
      var z = $('#t-' + id); z.scrollIntoView({ behavior: 'smooth', block: 'center' });
      z.classList.add('markiert'); setTimeout(function () { z.classList.remove('markiert'); }, 1600);
      return;
    }
    if (akt === 'gelesen') { finde(BOEGEN, id).gelesen = true; blattZu(); melden('Als gelesen markiert'); }
    if (akt === 'anarzt') { finde(BOEGEN, id).gelesen = true; blattZu(); melden('An Dr. Müller gegeben'); }

    if (!FUNKTIONEN.link && (akt === 'senden' || akt === 'oeffnen' || akt === 'eingang')) return;
    if (akt === 'senden') { o = finde(OHNE_BOGEN, id); o.gesendet = uhr(); o.geoeffnet = null; melden('Link an ' + o.name + ' gesendet (Demo)'); }
    if (akt === 'eingang') { o = finde(OHNE_BOGEN, id); o.eingegangen = true; blattZu();
      BOEGEN.push({ id: 'b' + o.id, name: o.name, geb: '–', datum: o.datum, zeit: o.zeit, eingang: uhr(), kasse: '–', grund: o.hinweis || '–',
        medikamente: 'keine', allergien: 'keine', vorerkrankungen: 'keine', gelesen: false });
      melden('Bogen von ' + o.name + ' ist da (Demo)'); }
    if (akt === 'oeffnen') { o = finde(OHNE_BOGEN, id); o.geoeffnet = uhr(); blattZu(); melden(o.name + ' hat den Link geöffnet (Demo)'); }
    if (akt === 'geklaert') { o = finde(OHNE_BOGEN, id); o.geklaert = true; blattZu(); melden('Erledigt: ' + o.name); }
    if (akt === 'eintragen') eintragenZeigen();
    if (akt === 'neu-speichern') {
      var name = $('#nName').value.trim();
      if (!name) { $('#nName').focus(); return; }
      OHNE_BOGEN.push({ id: 'o' + Date.now(), name: name, datum: $('#nDatum').value || HEUTE, zeit: $('#nZeit').value || '–',
        kontakt: $('#nKontakt') ? $('#nKontakt').value : '–', hinweis: $('#nHinweis').value, gesendet: null, geoeffnet: null });
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
    gespeichert = true; $('#textOnline').disabled = false;
    $('#textStand').textContent = 'Gespeichert. Noch nicht auf der Webseite.';
  });
  $('#textOnline').addEventListener('click', function () {
    var t = TEXTE[textNr];
    t.vorher = { titel: t.titel, text: t.text };
    t.titel = $('#textTitel').value; t.text = $('#textInhalt').value;
    $('#textOnline').disabled = true; $('#textZurueck').hidden = false;
    melden('Steht jetzt auf der Webseite (Demo)');
    $('#textStand').textContent = 'Auf der Webseite seit ' + uhr() + ' (Demo).';
  });
  $('#textZurueck').addEventListener('click', function () {
    var t = TEXTE[textNr];
    if (!t.vorher) return;
    t.titel = t.vorher.titel; t.text = t.vorher.text; t.vorher = null;
    textLaden(); melden('Vorherige Version wiederhergestellt (Demo)');
  });

  // Ansichten
  function zeigen(view) {
    if (!$('#view-' + view)) view = 'heute';
    document.querySelectorAll('.view').forEach(function (v) { v.hidden = v.id !== 'view-' + view; });
    document.querySelectorAll('[data-view]').forEach(function (a) { a.classList.toggle('aktiv', a.dataset.view === view); });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', function () { zeigen(location.hash.slice(1)); });

  if (!FUNKTIONEN.link) document.querySelectorAll('.nur-link').forEach(function (el) { el.hidden = true; });

  function starten() {
    $('#login').hidden = true; $('#app').hidden = false; zeigen(location.hash.slice(1) || 'heute');
    var g = null;
    try { g = localStorage.getItem('lhDemo3Gesehen'); } catch (e) {}
    if (!g) $('#anleitung').hidden = false;
  }
  $('#loginForm').addEventListener('submit', function (e) { e.preventDefault(); starten(); });

  // Anleitung
  function anleitungZu() {
    $('#anleitung').hidden = true;
    try { localStorage.setItem('lhDemo3Gesehen', '1'); } catch (e) {}
  }
  $('#anleitungZu').addEventListener('click', anleitungZu);
  $('#anleitungX').addEventListener('click', anleitungZu);
  $('#anleitung').addEventListener('click', function (e) { if (e.target === this) anleitungZu(); });
  $('#hilfeAuf').addEventListener('click', function (e) { e.preventDefault(); $('#anleitung').hidden = false; });

  $('#demoReset').addEventListener('click', function () {
    try { localStorage.removeItem('lhDemo5'); } catch (e) {}
    location.hash = 'heute'; location.reload();
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { blattZu(); anleitungZu(); } });

  alles(); textLaden(); team();

  // ?direkt=ansicht überspringt die Anmeldung
  var d = location.search.match(/direkt=(\w+)/);
  if (d) { location.hash = d[1]; starten(); }
})();
