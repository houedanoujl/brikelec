// Commandes exposées à la page (espace personnel) : vérifier le code, puis quitter.
// Le code lui-même reste dans le processus principal (electron/main.cjs).
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kiosk', {
  checkPin: pin => ipcRenderer.invoke('kiosk:check-pin', String(pin)),
  quit: () => ipcRenderer.send('kiosk:quit'),
})
