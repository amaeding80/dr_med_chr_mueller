// Land-Harz-Praxis – kleine Helfer (Akkordeons usw.)
// laeuft auf allen Seiten, macht nur was, wenn die Elemente da sind

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
var instaName = 'praxis-harz'; // TODO: echten Instagram-Namen eintragen
var instaAktiv = false; // TODO: auf true setzen, sobald das Profil online ist

document.addEventListener('DOMContentLoaded', () => {
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
  knopf.addEventListener('click', function () {
    var art = ruhig ? 'auto' : 'smooth';
    if (amEnde) { reihe.scrollTo({ left: 0, behavior: art }); return; }
    var k = reihe.firstElementChild;
    var gap = parseFloat(getComputedStyle(reihe).columnGap) || 0;
    reihe.scrollBy({ left: k ? k.getBoundingClientRect().width + gap : reihe.clientWidth * 0.8, behavior: art });
  });
  pruefe();
}
function initWischKnoepfe() { document.querySelectorAll('[data-wisch-knopf]').forEach(initWischKnopf); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initWischKnoepfe); else initWischKnoepfe();
