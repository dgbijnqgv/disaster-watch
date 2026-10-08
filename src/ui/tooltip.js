// Tooltips for any element with a data-tip attribute: one shared bubble, shown after a short hover,
// switching instantly between neighbouring controls, and never on touch.
const SHOW_DELAY_MS = 400;
const GAP = 10;
const MARGIN = 8;

const tip = Object.assign(document.createElement('div'), { className: 'tip', role: 'tooltip' });
let target = null;
let timer = 0;

function show(el) {
  target = el;
  tip.textContent = el.dataset.tip;
  const r = el.getBoundingClientRect();
  const t = tip.getBoundingClientRect();
  const below = r.top - t.height - GAP < 0;
  tip.style.top = `${below ? r.bottom + GAP : r.top - t.height - GAP}px`;
  tip.style.left = `${Math.min(Math.max(MARGIN, r.left + r.width / 2 - t.width / 2), innerWidth - t.width - MARGIN)}px`;
  tip.classList.toggle('below', below);
  tip.classList.add('on');
}

/** Hides the tooltip. Call before re-rendering markup that might contain its target. */
export function hideTip() {
  clearTimeout(timer);
  target = null;
  tip.classList.remove('on');
}

export function initTooltips() {
  document.body.append(tip);
  document.addEventListener('pointerover', (ev) => {
    const el = ev.target.closest?.('[data-tip]');
    if (!el || el === target || ev.pointerType === 'touch' || !el.dataset.tip) return;
    clearTimeout(timer);
    timer = setTimeout(() => show(el), tip.classList.contains('on') ? 0 : SHOW_DELAY_MS);
  });
  document.addEventListener('pointerout', (ev) => {
    const el = ev.target.closest?.('[data-tip]');
    if (el && !el.contains(ev.relatedTarget)) hideTip();
  });
  for (const type of ['pointerdown', 'scroll', 'keydown']) document.addEventListener(type, hideTip, true);
}
