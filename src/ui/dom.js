// Small DOM and HTML helpers shared by the UI modules.
import { LEVELS } from '../core/index.js';

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Escapes text for use inside HTML, including attribute values. All feed text goes through this. */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

/** Feed-supplied links are only used if they are plain web addresses. */
export const safeUrl = (url) => (/^https?:\/\//i.test(url ?? '') ? url : null);

export function timeAgo(t) {
  if (!Number.isFinite(t)) return '';
  const min = Math.round((Date.now() - t) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
}

/** Feed text is hard-wrapped at ~70 columns: keep paragraph breaks, join the rest, one <p> per paragraph. */
export const paragraphs = (s) => String(s ?? '')
  .split(/\n\s*\n/)
  .map((p) => p.replace(/\s+/g, ' ').trim())
  .filter(Boolean)
  .map((p) => `<p>${esc(p)}</p>`)
  .join('');

/** Threat level name with a coloured dot. */
export const levelChip = (level) => `<span class="lvl" style="--c:${LEVELS[level].color}">${LEVELS[level].name}</span>`;

/** `<option>`s for a "minimum threat level" select. */
export const levelOptions = (selected) => LEVELS.slice(1)
  .map((l) => `<option value="${l.id}"${l.id === selected ? ' selected' : ''}>${l.name}${l.id < 4 ? ' and above' : ''}</option>`)
  .join('');
