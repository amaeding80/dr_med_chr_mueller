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
