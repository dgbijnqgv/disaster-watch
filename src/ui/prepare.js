// The Prepare tab: what the threat levels mean, a go-bag checklist and per-hazard guides.
import { GO_BAG, LEVELS, PREP, TYPES } from '../core/index.js';
import { icon } from '../icons.js';
import { $, esc, levelChip } from './dom.js';
import { store } from './state.js';

/** Hazards with a guide in the Prepare tab. */
export const GUIDE_TYPES = ['wildfire', 'flood', 'storm', 'earthquake', 'severe', 'heat', 'tsunami', 'volcano', 'winter'];

const packed = new Set(store.get('kit', []));
const progress = () => `${packed.size} of ${GO_BAG.length} packed`;
const list = (items) => `<ul>${items.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`;

export function initPrepare() {
  $('#levelKey').innerHTML = LEVELS.slice(1).map((l) => `<li>${levelChip(l.id)}<span>${esc(l.blurb)}</span></li>`).join('');

  $('#kit').innerHTML = GO_BAG
    .map((item, i) => `<li><label><input type="checkbox" data-i="${i}"${packed.has(i) ? ' checked' : ''}><span>${esc(item)}</span></label></li>`)
    .join('');
  $('#kitProgress').textContent = progress();
  $('#kit').addEventListener('change', (ev) => {
    const i = Number(ev.target.dataset.i);
    if (ev.target.checked) packed.add(i); else packed.delete(i);
    store.set('kit', [...packed]);
    $('#kitProgress').textContent = progress();
  });

  $('#guides').innerHTML = GUIDE_TYPES.map((t) => `
    <details data-type="${t}"><summary>${icon(t, 18)}${TYPES[t].label}</summary>
      <h4>Before</h4>${list(PREP[t].ready)}
      <h4>During</h4>${list(PREP[t].now)}
    </details>`).join('');
}

/** Opens one hazard's guide and scrolls to it. The Prepare tab must already be showing. */
export function openGuide(type) {
  const guide = $(`#guides details[data-type="${type}"]`);
  if (!guide) return;
  guide.open = true;
  guide.scrollIntoView({ block: 'start' });
}
