// Land-Harz-Praxis – kleine Helfer (Akkordeons usw.)
// laeuft auf allen Seiten, macht nur was, wenn die Elemente da sind

function oeffneAkk(btn, auf) {
    var box = document.getElementById(btn.getAttribute('aria-controls'));
    if (!box) return;
    btn.setAttribute('aria-expanded', auf ? 'true' : 'false');
    box.hidden = !auf;
    const item = btn.closest('.akk-item');
    if (item) item.classList.toggle('offen', auf);
}

function initAkk() {
  const btns = document.querySelectorAll('.akk-btn');
  btns.forEach(btn => {
    let auf = btn.getAttribute('aria-expanded') === 'true';
    oeffneAkk(btn, auf);
    btn.addEventListener('click', () => {
      oeffneAkk(btn, btn.getAttribute('aria-expanded') !== 'true');
    });
  });
}

document.addEventListener('DOMContentLoaded', initAkk);
