// The event detail view, which slides over the panel. It reads top to bottom:
// what it is, whether it affects you, what to do; everything else is folded away.
import { LEVELS, TYPES, adviceFor, eventImage, headline, where } from '../core/index.js';
import { icon } from '../icons.js';
import { $, esc, paragraphs, safeUrl, timeAgo } from './dom.js';
import { GUIDE_TYPES } from './prepare.js';
import { feedKey } from './sources.js';
import { state } from './state.js';
import { hideTip } from './tooltip.js';

const STEPS_SHOWN = 3; // for events that cannot reach the user; all steps otherwise
/** event id -> Promise of its picture (or null), so refreshes and reopening don't refetch. */
const images = new Map();
let handlers = { onClose: () => {}, onOpenGuide: () => {} };

function riskSentence(e) {
  if (!state.loc) return 'Set your location to see whether this affects you.';
  if (e.local) return 'This official alert covers your location.';
  if (e.inZone) return `This could affect you. It is ${where(e)}.`;
  return `This is not expected to affect you. It is ${where(e)}.`;
}

function facts(e) {
  const url = safeUrl(e.url);
  const rows = [
    e.time && ['Updated', timeAgo(e.time)],
    e.expires && ['Ends', new Date(e.expires).toLocaleString([], { weekday: 'long', hour: 'numeric', minute: '2-digit' })],
    ['Source', `${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(e.source)} ${icon('external', 14)}</a>` : esc(e.source)}
      <button class="icon-btn" data-open-sources="${esc(feedKey(e))}" aria-label="About this source" data-tip="About this source">${icon('info', 16)}</button>`],
  ].filter(Boolean);
  return `<dl class="facts">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
}

function fullDetails(e) {
  const zones = (e.area ?? '').split(';').map((z) => z.trim()).filter(Boolean);
  const parts = [
    e.headline && paragraphs(e.headline),
    e.detail && paragraphs(e.detail),
    zones.length && `<p><strong>Areas covered:</strong> ${zones.map(esc).join(', ')}</p>`,
  ].filter(Boolean).join('');
  return parts ? `<details class="fold"><summary>Full details</summary><div class="prose">${parts}</div></details>` : '';
}

async function loadImage(e, figure) {
  if (!images.has(e.id)) images.set(e.id, eventImage(e));
  const info = await images.get(e.id);
  if (!info) { figure.remove(); return; }

  const img = new Image();
  img.alt = info.caption;
  img.decoding = 'async';
  img.onload = () => figure.classList.replace(figure.classList.contains('pending') ? 'pending' : 'loading', 'ready');
  img.onerror = () => figure.remove();
  img.src = info.src;
  if (info.fit) figure.classList.add(info.fit);

  const href = safeUrl(info.link);
  const link = href ? Object.assign(document.createElement('a'), { href, target: '_blank', rel: 'noopener' }) : document.createElement('div');
  if (href) link.dataset.tip = 'Open the full-size image';
  link.append(img);
  figure.querySelector('.frame').append(link);
  figure.querySelector('figcaption').innerHTML = `${esc(info.caption)} <span class="credit">${esc(info.credit)}</span>`;
}

export function showDetail(e) {
  hideTip(); // its target may be about to be replaced
  const el = $('#detail');
  const scroll = el.hidden ? 0 : el.scrollTop; // a refresh re-renders the open view in place
  const level = LEVELS[e.level];
  const advice = adviceFor(e);
  const steps = e.inZone ? advice.steps : advice.steps.slice(0, STEPS_SHOWN);
  // Earthquake pictures only exist for significant quakes, so reserve no space until one loads.
  const figure = `<figure class="media ${e.type === 'earthquake' ? 'pending' : 'loading'}"><div class="frame"></div><figcaption></figcaption></figure>`;

  // The picture leads, unless the user needs to act: then the steps come first.
  el.innerHTML = `
    <button class="btn ghost small back">${icon('chevronLeft', 16)} Back</button>
    ${e.inZone ? '' : figure}
    <div class="detail-head">
      <span class="ev-icon">${icon(e.type, 20)}</span>
      <span>${esc(TYPES[e.type].label)}<span class="lvl-text" style="--c:${level.color}" data-tip="${esc(level.blurb)}">${esc(level.name)} threat</span></span>
    </div>
    <h2>${esc(headline(e))}</h2>
    <p class="risk${e.inZone ? ' affects' : ''}" style="--c:${level.color}">${esc(riskSentence(e))}</p>

    <h3>${esc(advice.title)}</h3>
    <ol class="steps">${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    ${advice.urgent ? `<p class="urgent">${icon('alert', 16)}<span>${esc(advice.urgent)}</span></p>` : ''}
    ${e.inZone ? figure : ''}
    ${e.instruction ? `<h3>Official advice</h3><div class="prose">${paragraphs(e.instruction)}</div>` : ''}

    ${facts(e)}
    ${fullDetails(e)}
    ${GUIDE_TYPES.includes(e.type) ? '<button class="linklike guide-link">Open the full safety guide</button>' : ''}
  `;
  el.hidden = false;
  el.scrollTop = scroll;

  $('.back', el).addEventListener('click', closeDetail);
  $('.guide-link', el)?.addEventListener('click', () => handlers.onOpenGuide(e.type));
  loadImage(e, $('.media', el));
}

export function closeDetail() {
  hideTip();
  $('#detail').hidden = true;
  handlers.onClose();
}

/** @param {{ onClose: () => void, onOpenGuide: (type: string) => void }} h */
export function initDetail(h) {
  handlers = h;
  document.addEventListener('keydown', (ev) => {
    // Escape in an open dialog closes just the dialog.
    if (ev.key === 'Escape' && !$('#detail').hidden && !document.querySelector('dialog[open]')) closeDetail();
  });
}
