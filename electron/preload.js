const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getHwid: () => ipcRenderer.invoke('get-hwid'),
    checkLicense: () => ipcRenderer.invoke('check-license'),
    saveLicense: (data) => ipcRenderer.invoke('save-license', data),
    deleteLicense: () => ipcRenderer.invoke('delete-license'),
    startTrial: () => ipcRenderer.invoke('start-trial'),
    onLicenseRevoked: (callback) => ipcRenderer.on('license-revoked', (event, ...args) => callback(...args))
});
