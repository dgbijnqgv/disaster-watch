// Desktop app shell: window, tray, native notifications, start-at-login and the background worker.
import { app, BrowserWindow, Tray, Menu, ipcMain, shell, protocol, net, session, nativeImage } from 'electron';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync, writeFileSync } from 'node:fs';
import { join, normalize, sep } from 'node:path';
import { startBackground, updateSettings, showNotification } from './background.js';

const APP_ID = 'com.disasterwatch.app';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const startedHidden = process.argv.includes('--hidden') || app.getLoginItemSettings().wasOpenedAtLogin;

let win = null;
let tray = null;
let quitting = false;

// Serve the bundled UI from app://bundle/ — a secure origin, so geolocation and fetch behave like a normal site.
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

if (!app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => showWindow());
app.setAppUserModelId(APP_ID); // Windows needs this for notifications to show under the app's name

function showWindow() {
  if (!win) createWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function createWindow({ show = true } = {}) {
  win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 380,
    minHeight: 560,
    show,
    title: 'Disaster Watch',
    icon: join(ROOT, 'electron', 'assets', 'icon.png'),
    autoHideMenuBar: true,
    backgroundColor: '#f4f6f9',
    webPreferences: { preload: join(ROOT, 'electron', 'preload.cjs'), contextIsolation: true, sandbox: true },
  });
  win.loadURL('app://bundle/index.html');

  // Links (sources, official alerts) open in the user's browser; the app window never navigates away.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (ev, url) => { if (!url.startsWith('app://')) ev.preventDefault(); });

  // Closing the window keeps the app in the tray so alerts keep coming.
  win.on('close', (ev) => {
    if (quitting) return;
    ev.preventDefault();
    win.hide();
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(join(ROOT, 'electron', 'assets', 'tray.png'));
  tray = new Tray(icon);
  tray.setToolTip('Disaster Watch');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open Disaster Watch', click: showWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on('click', showWindow);
}

ipcMain.handle('notify', (_ev, title, body) => showNotification(title, body));
ipcMain.handle('settings:save', (_ev, settings) => updateSettings(settings));
ipcMain.handle('autostart:get', () => app.getLoginItemSettings().openAtLogin);
ipcMain.handle('autostart:set', (_ev, on) => app.setLoginItemSettings({ openAtLogin: on, args: ['--hidden'] }));

app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => { /* stay alive in the tray */ });
app.on('activate', showWindow); // macOS dock click

app.whenReady().then(() => {
  protocol.handle('app', async (req) => {
    const path = normalize(join(DIST, decodeURIComponent(new URL(req.url).pathname)));
    if (!path.startsWith(DIST + sep)) return new Response('Forbidden', { status: 403 }); // stay inside dist/
    const res = await net.fetch(pathToFileURL(path).toString());
    // no-store: after an app update the window must never show cached files from the old version.
    return new Response(res.body, { status: res.status, headers: { 'Content-Type': res.headers.get('content-type') ?? '', 'Cache-Control': 'no-store' } });
  });

  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    callback(['geolocation', 'notifications'].includes(permission));
  });
  // Identify the app to the free map-tile and data services, as their usage policies require.
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: ['https://*/*'] }, (details, callback) => {
    details.requestHeaders['User-Agent'] = `DisasterWatch/${app.getVersion()} (${process.platform})`;
    callback({ requestHeaders: details.requestHeaders });
  });

  // First launch: start with the computer so warnings keep working after a restart (can be turned off in Settings).
  const firstRunFlag = join(app.getPath('userData'), '.autostart-set');
  if (app.isPackaged && !existsSync(firstRunFlag)) {
    app.setLoginItemSettings({ openAtLogin: true, args: ['--hidden'] });
    writeFileSync(firstRunFlag, '');
  }

  createTray();
  createWindow({ show: !startedHidden });
  startBackground({ onNotificationClick: () => { showWindow(); win.webContents.send('open-brief'); } });
});
