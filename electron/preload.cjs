// Exposes a small, fixed API to the UI (src/platform.js). Nothing else from Node/Electron is reachable.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dwNative', {
  notify: (title, body) => ipcRenderer.invoke('notify', String(title), String(body)),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  getAutoStart: () => ipcRenderer.invoke('autostart:get'),
  setAutoStart: (on) => ipcRenderer.invoke('autostart:set', Boolean(on)),
  onOpenBrief: (handler) => ipcRenderer.on('open-brief', () => handler()),
});
