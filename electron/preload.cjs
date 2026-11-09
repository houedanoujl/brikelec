// Seule commande exposée à la page : quitter l'application (espace personnel).
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('kiosk', {
  quit: () => ipcRenderer.send('kiosk:quit'),
})
