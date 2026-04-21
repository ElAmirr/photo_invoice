const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getHwid: () => ipcRenderer.invoke('get-hwid'),
    checkLicense: () => ipcRenderer.invoke('check-license'),
    saveLicense: (data) => ipcRenderer.invoke('save-license', data),
    deleteLicense: () => ipcRenderer.invoke('delete-license'),
    startTrial: () => ipcRenderer.invoke('start-trial'),
    getAppInfo: () => ipcRenderer.invoke('get-app-info'),
    manualCheckUpdates: () => ipcRenderer.invoke('manual-check-updates'),
    quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),
    onUpdateProgress: (callback) => ipcRenderer.on('update-progress', (event, percent) => callback(percent)),
    onUpdateReady: (callback) => ipcRenderer.on('update-ready', (event) => callback()),
    onLicenseRevoked: (callback) => ipcRenderer.on('license-revoked', (event, ...args) => callback(...args))
});
