// Land Harz Praxis – kleine Helfer (Akkordeons usw.)
// laeuft auf allen Seiten, macht nur was, wenn die Elemente da sind

// Schalter Terminbuchung
// t2med.aktiv auf true und Link eintragen, dann erscheinen die T2med-Buttons im Termin-Fenster
var PRAXIS = {
  t2med: { aktiv: false, link: '' },
  beispielTermine: false,   // true = Beispielzeiten in der Slot-Karte zeigen
  anamneseLang: false,      // true = Raucher, Anliegen und Unterschrift im Anamnesebogen wieder zeigen

  // Online-Termin (js/termin.js)
  // ziel: 'vorschau' = nichts wird gesendet, Angaben landen nur in diesem Browser in der Dashboard-Demo
  //       't2med'    = Schritt "Termin" zeigt T2med (einbettung = Adresse des T2med-Buchungsfensters, sonst link)
  //       'endpunkt' = alle Angaben gehen verschlüsselt (https) als JSON an endpunkt, von dort ins Praxis-Dashboard
  termin: { ziel: 'vorschau', einbettung: '', endpunkt: '' },

  // Anamnesebogen: Vorlage folgt. Adresse eintragen, dann wird die Auswahl im Termin-Ablauf freigeschaltet
  anamnese: { online: '', download: '' },

  // Videosprechstunde über Patmed: Link eintragen, dann führt der Knopf direkt dorthin
  patmed: { link: '' },

  // Rezept und Rückruf: endpunkt eintragen (https), sonst nur Vorschau. Nie per E-Mail.
  rezept: { endpunkt: '' },
  rueckruf: { endpunkt: '' },

  // Schalter: Funktionen ausblenden statt löschen (true = wieder sichtbar)
  funktionen: {
    au: false,            // Krankmeldung/Folge-AU online – laut Dr. Müller raus, stattdessen Videosprechstunde
    terminAlt: false,     // alter Termin-Ablauf statt js/termin.js
    demoKnoepfe: false,   // schwebende Demo-Knöpfe (Bestandspatient/Neupatient) für den alten Ablauf
    whatsapp: false       // vorerst kein WhatsApp
  }
};
window.PRAXIS = PRAXIS;

function initT2med() {
  var an = PRAXIS.t2med.aktiv && PRAXIS.t2med.link;
  document.querySelectorAll('.t2med-btn').forEach(function (a) {
    a.hidden = !an;
    a.style.display = an ? '' : 'none';
    if (an) a.href = PRAXIS.t2med.link;
  });
  if (an) document.querySelectorAll('.t2med-folgt').forEach(function (el) { el.style.display = 'none'; });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initT2med); else initT2med();

function oeffneAkk(btn, auf) {
    var box = document.getElementById(btn.getAttribute('aria-controls'));
    if (!box) return;
    btn.setAttribute('aria-expanded', auf ? 'true' : 'false');
    box.hidden = !auf;
    const item = btn.closest('.akk-item');
    if (item) {
        item.classList.toggle('offen', auf);
        if (item.classList.contains('service-item')) item.classList.toggle('active', auf);
    }
}

function initAkk() {
  const btns = document.querySelectorAll('.akk-btn');
  btns.forEach(btn => {
    let auf = btn.getAttribute('aria-expanded') === 'true';
    oeffneAkk(btn, auf);
    btn.addEventListener('click', () => {
      var neu = btn.getAttribute('aria-expanded') !== 'true';
      // Gruppe: immer nur eins offen (wie bisher bei den Leistungen)
      var grp = btn.dataset.gruppe;
      if (grp && neu) {
        document.querySelectorAll('.akk-btn[data-gruppe="' + grp + '"]').forEach(el => { if (el !== btn) oeffneAkk(el, false); });
      }
      oeffneAkk(btn, neu);
    });
  });
}

// alte Aufrufe aus den Leistungs-Chips (onclick="openLeistung(1)") weiter bedienen
function openLeistung(idx) {
    var btns = document.querySelectorAll('.akk-btn[data-gruppe="leistungen"]');
    btns.forEach(function (el, i) { oeffneAkk(el, i === idx); });
    var sec = document.getElementById('leistungen');
    if (sec) setTimeout(function () { sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
}
function toggleService(el) {
    var btn = el.closest ? el.closest('.akk-btn') || el.querySelector('.akk-btn') : null;
    if (btn) btn.click();
}

document.addEventListener('DOMContentLoaded', initAkk);
// TODO: Akkordeon auch auf den Unterseiten nutzen, wenn Dr. Müller die Texte freigibt

// Instagram – nur HIER Name eintragen und freischalten
var instaName = 'nutridoccheck';
var instaAktiv = true; // false = Folgen-Knopf wieder aus
var instaRaster = false; // true = Kachel-Raster mit Bildern wieder zeigen (erst mit echten Bildern)

document.addEventListener('DOMContentLoaded', () => {
    if (instaRaster) {
        document.querySelectorAll('[data-insta="raster"]').forEach(el => { el.hidden = false; });
        document.querySelectorAll('.insta-sec').forEach(el => el.classList.remove('ohne-raster'));
    }
    document.querySelectorAll('[data-insta="name"]').forEach(el => { el.textContent = '@' + instaName; });
    document.querySelectorAll('a[data-insta="link"]').forEach(a => {
        if (instaAktiv) {
            a.href = 'https://www.instagram.com/' + instaName + '/';
            a.target = '_blank'; a.rel = 'noopener';
            a.removeAttribute('aria-disabled');
            a.removeAttribute('tabindex');
            var hint = a.querySelector('.sr-only'); if (hint) hint.textContent = ' (Instagram, neues Fenster)';
        } else {
            a.addEventListener('click', e => e.preventDefault()); // noch nicht aktiv
        }
    });
});

// Wisch-Reihen (Handy): Hinweis-Knopf unter jeder Reihe, verbunden ueber aria-controls
// "Wischen →" blaettert eine Karte weiter, an der letzten Karte "← Zurück" = zur ersten Karte
function initWischKnopf(knopf) {
  var reihe = document.getElementById(knopf.getAttribute('aria-controls'));
  if (!reihe) return;
  var ruhig = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let amEnde = null;
  function pruefe() {
    var rollbar = reihe.scrollWidth > reihe.clientWidth + 2;
    knopf.hidden = !rollbar;
    var ende = rollbar && reihe.scrollLeft + reihe.clientWidth >= reihe.scrollWidth - 10;
    if (ende === amEnde) return;
    amEnde = ende;
    knopf.textContent = ende ? '← Zurück' : 'Wischen →';
    knopf.setAttribute('aria-label', ende ? 'Zurück zur ersten Karte' : 'Weiter zur nächsten Karte');
  }
  var tick = false;
  function bald() {
    if (tick) return; tick = true;
    requestAnimationFrame(function () { tick = false; pruefe(); });
  }
  reihe.addEventListener('scroll', bald, { passive: true });
  window.addEventListener('resize', bald);
  // Reihe kann beim Laden versteckt sein (z. B. „Weitere Anliegen“ zugeklappt): beim Aufklappen neu pruefen
  if (window.ResizeObserver) new ResizeObserver(bald).observe(reihe);
  knopf.addEventListener('click', function () {
    var art = ruhig || document.documentElement.classList.contains('pxa-keine-anim') ? 'auto' : 'smooth';
    if (amEnde) { reihe.scrollTo({ left: 0, behavior: art }); return; }
    var k = reihe.firstElementChild;
    var gap = parseFloat(getComputedStyle(reihe).columnGap) || 0;
    reihe.scrollBy({ left: k ? k.getBoundingClientRect().width + gap : reihe.clientWidth * 0.8, behavior: art });
  });
  pruefe();
}
function initWischKnoepfe() { document.querySelectorAll('[data-wisch-knopf]').forEach(initWischKnopf); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWischKnoepfe); else initWischKnoepfe();

// Klasse fuer den Hilfe-Button: nur wenn die Demo-Knoepfe wirklich an sind
if (PRAXIS.funktionen.demoKnoepfe) document.documentElement.classList.add('demo-knoepfe-an');

// Praxis-Kompass: nicht mehr kleben, bevor er den Digitalen Empfang ueberdeckt
(function () {
  var kompass = document.getElementById('kompass');
  var empfang = document.getElementById('empfang');
  if (!kompass || !empfang) return;

  var hoehe = 0;
  var haftTop = 60;
  var weg = false;

  function merken() {
    if (kompass.classList.contains('kompass-weg')) return;
    var r = kompass.getBoundingClientRect();
    if (r.height > 8) hoehe = r.height;
    var t = parseFloat(getComputedStyle(kompass).top);
    if (!isNaN(t)) haftTop = t;
  }

  function pruefe() {
    merken();
    var eTop = empfang.getBoundingClientRect().top;
    var puffer = 24;
    var grenze = haftTop + hoehe + puffer;
    var sollWeg = weg ? (eTop < grenze + 24) : (eTop < grenze);
    if (sollWeg === weg) return;
    weg = sollWeg;
    kompass.classList.toggle('kompass-weg', sollWeg);
  }

  window.addEventListener('scroll', pruefe, { passive: true });
  window.addEventListener('resize', pruefe);
  window.addEventListener('hashchange', pruefe);
  if (window.ResizeObserver) new ResizeObserver(pruefe).observe(kompass);
  pruefe();
})();
