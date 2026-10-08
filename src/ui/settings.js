// The Settings tab: watch area, alerts, start-up and appearance.
import * as platform from '../platform.js';
import { currentBrief } from './brief.js';
import { $, levelOptions } from './dom.js';
import { saveSettings, state } from './state.js';

const BACKGROUND_NOTE = {
  desktop: 'Disaster Watch keeps running in the system tray when you close the window, so alerts and the daily brief still arrive.',
  android: 'Disaster Watch checks for new threats in the background about every 15 minutes and sends the daily brief, even when the app is closed.',
  web: 'Browser preview: alerts only arrive while this page is open.',
};

export const applyTheme = () => { document.documentElement.dataset.theme = state.settings.theme; };

/** Binds a form control to a setting: sets its initial value and saves on change. */
function bind(selector, key, { parse = (v) => v, event = 'change', after } = {}) {
  const el = $(selector);
  el.value = state.settings[key];
  el.addEventListener(event, () => {
    state.settings[key] = parse(el.value);
    saveSettings();
    after?.();
  });
}

/** @param {{ onRadiusChange: () => void, onThemeChange: () => void }} handlers */
export function initSettings({ onRadiusChange, onThemeChange }) {
  $('#radiusVal').textContent = state.settings.radiusKm;
  $('#radius').addEventListener('input', (ev) => { $('#radiusVal').textContent = ev.target.value; });
  bind('#radius', 'radiusKm', { parse: Number, after: onRadiusChange });

  bind('#theme', 'theme', { after: () => { applyTheme(); onThemeChange(); } });

  $('#notifyLevel').innerHTML = levelOptions(state.settings.notifyLevel);
  bind('#notifyLevel', 'notifyLevel', { parse: Number });
  bind('#briefTime', 'briefTime', { parse: (v) => v || '07:00' });

  const toggle = $('#notifyToggle');
  toggle.checked = state.settings.notify;
  platform.notificationsAllowed().then((ok) => { if (!ok) toggle.checked = false; });
  toggle.addEventListener('change', async () => {
    if (toggle.checked && !(await platform.requestNotifications())) {
      toggle.checked = false;
      alert('Notifications are blocked. Allow them for Disaster Watch in your system settings.');
    }
    state.settings.notify = toggle.checked;
    saveSettings();
  });

  $('#testNotify').addEventListener('click', async () => {
    if (!(await platform.notificationsAllowed()) && !(await platform.requestNotifications())) {
      alert('Allow notifications first.');
      return;
    }
    const b = currentBrief();
    platform.notify(b.title, b.text);
  });

  if (platform.autoStart) {
    $('#autoStartRow').hidden = false;
    platform.autoStart.get().then((on) => { $('#autoStart').checked = on; });
    $('#autoStart').addEventListener('change', (ev) => platform.autoStart.set(ev.target.checked));
  }
  $('#bgNote').textContent = BACKGROUND_NOTE[platform.name] ?? '';
}
