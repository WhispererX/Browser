const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld('electron', {
    log: (msg) => ipcRenderer.send('log', msg),
    navigate: (action, url) => ipcRenderer.send('navigate', action, url),
    newTab: (tabId) => ipcRenderer.send('new-tab', tabId),
    switchTab: (tabId) => ipcRenderer.send('switch-tab', tabId),
    closeTab: (tabId) => ipcRenderer.send('close-tab', tabId),
    onUpdateAddressBar: (callback) => ipcRenderer.on('update-adress-bar', (event, url) => callback(url)),
    onUpdateNavigationState: (callback) => ipcRenderer.on('update-navigation-state', (event, state) => callback(state)),
    onUpdateTabDisplay: (callback) => ipcRenderer.on('update-tab-display', (event, tabId, title, favicon) => callback(tabId, title, favicon)),
});