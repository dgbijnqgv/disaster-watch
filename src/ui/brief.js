// The brief card at the top of the panel: overall status, one line of summary and the one thing to do.
import { actionFor, buildBrief } from '../core/index.js';
import { icon } from '../icons.js';
import { $ } from './dom.js';
import { state } from './state.js';

const STATUS_ICON = { none: 'location', clear: 'shieldCheck', watch: 'eye', action: 'alert', error: 'alert' };

/** The brief for the current state; also used for the test notification. */
export const currentBrief = () => buildBrief(state.events, state.loc, { radiusKm: state.settings.radiusKm, sources: state.sources });

export function renderBrief() {
  const b = currentBrief();
  const failed = Boolean(state.loadError);
  const status = failed ? 'error' : b.status;

  $('#brief').dataset.status = status;
  $('#briefIcon').innerHTML = icon(STATUS_ICON[status], 26);
  $('#briefTitle').textContent = failed ? 'Could not load live data' : b.title;
  $('#briefSummary').textContent = failed ? 'Check your internet connection. Disaster Watch will try again automatically.' : b.summary;

  // The events themselves are listed right below the card; here only the most important action.
  const top = failed ? null : b.items.find((e) => e.inZone && e.level >= 2);
  $('#briefAction').hidden = !top;
  if (top) $('#briefAction').textContent = actionFor(top);

  const updated = state.fetchedAt
    ? `Updated ${new Date(state.fetchedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : '';
  $('#updated').textContent = [updated, b.incomplete && !failed && 'some sources did not respond'].filter(Boolean).join(' · ');
}
