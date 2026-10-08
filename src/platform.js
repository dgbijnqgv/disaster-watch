// One interface over the three places the UI can run:
//   desktop  – Electron; window.dwNative comes from electron/preload.cjs
//   android  – Capacitor native plugins
//   web      – plain browser (development preview)
// The UI only talks to this module, never to Electron or Capacitor directly.
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { BackgroundRunner } from '@capacitor/background-runner';

const desktop = globalThis.dwNative;
const native = Capacitor.isNativePlatform();

export const name = desktop ? 'desktop' : native ? Capacitor.getPlatform() : 'web';

// On desktop and Android a background process watches for threats and sends the daily brief,
// even when the window is closed. In a plain browser the page has to do it itself.
export const backgroundAlerts = name !== 'web';

function browserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      reject,
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

export async function getPosition() {
  if (native) {
    const perm = await Geolocation.requestPermissions({ permissions: ['coarseLocation'] });
    if (perm.coarseLocation !== 'granted' && perm.location !== 'granted') throw new Error('denied');
    const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 });
    return { lat: p.coords.latitude, lon: p.coords.longitude };
  }
  return browserPosition();
}

export async function notificationsAllowed() {
  if (desktop) return true;
  if (native) return (await LocalNotifications.checkPermissions()).display === 'granted';
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

export async function requestNotifications() {
  if (desktop) return true;
  if (native) return (await LocalNotifications.requestPermissions()).display === 'granted';
  if (typeof Notification === 'undefined') return false;
  return (await Notification.requestPermission()) === 'granted';
}

let nextId = 1;
export async function notify(title, body) {
  if (desktop) return desktop.notify(title, body);
  if (native) {
    return LocalNotifications.schedule({ notifications: [{ id: (Date.now() % 2e9) + nextId++, title, body, largeBody: body }] });
  }
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(title, { body, icon: 'icon.svg' });
}

// Hand the user's location and alert preferences to the background process.
export async function syncBackground(settings) {
  try {
    if (desktop) return await desktop.saveSettings(settings);
    if (native) return await BackgroundRunner.dispatchEvent({ label: 'com.disasterwatch.background', event: 'saveSettings', details: settings });
  } catch (err) {
    console.warn('Background sync failed', err);
  }
}

// Desktop only: launch at sign-in so alerts keep working after a restart.
export const autoStart = desktop
  ? { get: () => desktop.getAutoStart(), set: (on) => desktop.setAutoStart(on) }
  : null;

// Desktop only: the background process can ask the window to show a specific view.
export function onOpenBrief(handler) {
  desktop?.onOpenBrief(handler);
}
