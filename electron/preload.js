const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    getHwid: () => ipcRenderer.invoke('get-hwid'),
    checkLicense: () => ipcRenderer.invoke('check-license'),
    saveLicense: (data) => ipcRenderer.invoke('save-license', data),
    startTrial: () => ipcRenderer.invoke('start-trial')
});
