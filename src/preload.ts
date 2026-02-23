import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
    // Window Controls
    window: {
        minimize: () => ipcRenderer.send('window-minimize'),
        maximize: () => ipcRenderer.send('window-maximize'),
        close: () => ipcRenderer.send('window-close'),
    },

    // Server Management
    servers: {
        get: () => ipcRenderer.invoke('get-servers'),
        save: (data: any) => ipcRenderer.invoke('save-servers', data),
    },

    // Screen Sharing logic
    screen: {
        getSources: () => ipcRenderer.invoke('get-sources'),
        selectSource: (id: string) => ipcRenderer.send('source-selected', id),
        onShowPicker: (cb: () => void) => ipcRenderer.on('show-screen-picker', cb),
        offShowPicker: (cb: () => void) => ipcRenderer.off('show-screen-picker', cb),
    },
});