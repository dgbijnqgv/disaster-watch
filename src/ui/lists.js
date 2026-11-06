// The Near me and World lists, the "what to do" card for threats near the user, and the World filters.
import { LEVELS, TYPES, adviceFor, byUrgency, headline, plural, relevant, where } from '../core/index.js';
import { icon } from '../icons.js';
import { $, esc, levelOptions, timeAgo } from './dom.js';
import { passesFilters, saveSettings, state } from './state.js';

const WORLD_LIMIT = 250;
const FILTER_TYPES = ['earthquake', 'wildfire', 'storm', 'flood', 'volcano', 'severe', 'drought', 'other'];

/** One row for any event: a plain hazard icon, a sentence, then its threat level and where it is. */
function eventRow(e) {
  const level = LEVELS[e.level];
  const meta = [`${level.name} threat`, state.loc ? where(e) : timeAgo(e.time)].filter(Boolean).join(' · ');
  return `<li><button class="ev" data-id="${esc(e.id)}">
    <span class="ev-icon">${icon(e.type, 20)}</span>
    <span class="ev-text"><span class="ev-title">${esc(headline(e))}</span><span class="ev-meta"><i class="dot" style="--c:${level.color}"></i>${esc(meta)}</span></span>
  </button></li>`;
}

const eventList = (events) => `<ul class="events">${events.map(eventRow).join('')}</ul>`;

/** Steps for the most urgent event that could reach the user. Other threats' steps are in their details. */
function adviceCard(threats) {
  const reaching = threats.filter((e) => e.inZone && e.level >= 2);
  if (!reaching.length) return '';
  const [e] = reaching;
  const a = adviceFor(e);
  const others = reaching.length > 1
    ? `<p class="advice-more">${plural(reaching.length - 1, 'other event', 'other events')} could also reach you. Open one below for its steps.</p>` : '';
  return `<section class="advice" style="--c:${LEVELS[e.level].color}">
    <h3>${esc(a.title)}</h3>
    <p class="advice-for">${esc(headline(e))} (${esc(where(e).toLowerCase())}).</p>
    <ol class="steps">${a.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
    <p class="urgent">${icon('alert', 16)}<span>${esc(a.urgent)}</span></p>
    <button class="linklike advice-link" data-open-id="${esc(e.id)}">Details and official advice</button>
    ${others}
  </section>`;
}
const empty = (text) => `<p class="empty">${text}</p>`;
const failed = () => state.loadError && !state.fetchedAt; // nothing has loaded yet, so no list can be trusted
const FAILED = 'Events could not be loaded. Disaster Watch will try again shortly.';

function renderNear() {
  if (failed()) { $('#nearList').innerHTML = empty(FAILED); return; }
  if (!state.loc) {
    $('#nearList').innerHTML = empty('Allow location access or set your location in Settings to see what is near you.');
    return;
  }
  const near = state.events.filter((e) => e.nearby && passesFilters(e)).sort(byUrgency);
  const threats = near.filter(relevant);
  const minor = near.filter((e) => !relevant(e));
  // Minor events stay folded away so they don't compete for attention; keep the fold open across refreshes.
  const wasOpen = $('#nearList details')?.open ?? false;
  const reaching = threats.filter((e) => e.inZone);
  const nearby = threats.filter((e) => !e.inZone);
  $('#nearList').innerHTML = adviceCard(threats)
    + (reaching.length ? `<h3 class="group">Could reach you</h3>${eventList(reaching)}` : '')
    + (nearby.length ? `<h3 class="group">Nearby, not expected to reach you</h3>${eventList(nearby)}` : '')
    + (threats.length ? '' : empty('Nothing near you needs attention.'))
    + (minor.length
      ? `<details class="fold"${wasOpen ? ' open' : ''}><summary>${plural(minor.length, 'minor event', 'minor events')} nearby</summary>${eventList(minor)}</details>`
      : '');
}

function renderWorld() {
  if (failed()) { $('#worldList').innerHTML = empty(FAILED); return; }
  const world = state.events.filter(passesFilters).sort((a, b) => (b.level - a.level) || (b.time - a.time));
  if (!world.length) {
    $('#worldList').innerHTML = empty('No events match your filters.');
    return;
  }
  $('#worldList').innerHTML = eventList(world.slice(0, WORLD_LIMIT))
    + (world.length > WORLD_LIMIT
      ? empty(`Showing the ${WORLD_LIMIT} most serious of ${world.length}. Raise the minimum threat to narrow the list.`) : '');
}

export function renderLists() {
  renderNear();
  renderWorld();
}

function renderTypeFilters() {
  const hidden = state.settings.hiddenTypes;
  $('#typeFilters').innerHTML = FILTER_TYPES.map((t) => `<button data-type="${t}" aria-pressed="${!hidden.includes(t)}"
    data-tip="${hidden.includes(t) ? 'Show' : 'Hide'} these on the map and in the list">${icon(t, 16)}${TYPES[t].label}</button>`).join('');
}

/**
 * Wires up list rows and the World filters.
 * @param {{ onSelect: (e: object) => void, onHover: (id: string, on: boolean) => void, onFiltersChange: () => void }} handlers
 */
export function initLists({ onSelect, onHover, onFiltersChange }) {
  const eventWithId = (id) => state.events.find((e) => e.id === id);
  const rowOf = (ev) => ev.target.closest?.('button.ev[data-id]');

  document.addEventListener('click', (ev) => {
    const id = rowOf(ev)?.dataset.id ?? ev.target.closest?.('[data-open-id]')?.dataset.openId;
    const e = id && eventWithId(id);
    if (e) onSelect(e);
  });
  for (const [type, on] of [['pointerover', true], ['pointerout', false]]) {
    document.addEventListener(type, (ev) => {
      const row = rowOf(ev);
      if (row && !row.contains(ev.relatedTarget)) onHover(row.dataset.id, on);
    });
  }

  $('#minLevel').innerHTML = levelOptions(state.settings.minLevel);
  $('#minLevel').addEventListener('change', (ev) => {
    state.settings.minLevel = Number(ev.target.value);
    saveSettings();
    onFiltersChange();
  });

  renderTypeFilters();
  $('#typeFilters').addEventListener('click', (ev) => {
    const type = ev.target.closest('button')?.dataset.type;
    if (!type) return;
    const hidden = state.settings.hiddenTypes;
    state.settings.hiddenTypes = hidden.includes(type) ? hidden.filter((t) => t !== type) : [...hidden, type];
    saveSettings();
    renderTypeFilters();
    onFiltersChange();
  });
}
