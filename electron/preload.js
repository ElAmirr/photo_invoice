const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Add any necessary IPC communication here
    // For example:
    // sendMessage: (channel, data) => ipcRenderer.send(channel, data),
    // onMessage: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args))
});
