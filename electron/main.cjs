// Application de la borne (Windows) : le jeu en plein écran kiosque, sans réseau.
// Le site généré (nuxt generate → .output/public) est servi par le protocole
// app://borne/. Cette origine ne change jamais : le classement, stocké dans
// localStorage, est conservé d'un lancement à l'autre (dossier de l'application).
//
// Deux modes :
// - borne (installeur NSIS) : plein écran verrouillé, lancement à l'ouverture de session ;
// - test (exécutable portable, ou --test) : fenêtre agrandie qui se ferme normalement,
//   F11 pour le plein écran, pas de lancement automatique. Pour essayer le jeu sur un PC de bureau.
// Lancement : npm run kiosk:dev (ajouter -- --test pour une fenêtre normale)
// Quitter : Ctrl+Maj+Q, ou l'espace personnel (5 touchers sur le logo CIPREL).
const { app, BrowserWindow, protocol, session, powerSaveBlocker, ipcMain } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const SCHEME = 'app'
const ORIGIN = `${SCHEME}://borne`
const ROOT = path.join(__dirname, '..', '.output', 'public')
// electron-builder renseigne PORTABLE_EXECUTABLE_FILE pour l'exécutable portable
const TEST = !!process.env.PORTABLE_EXECUTABLE_FILE || process.argv.includes('--test') || process.argv.includes('--windowed')

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

// Origine « standard » et « secure » : localStorage, modules ES et fetch y fonctionnent.
protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
])

app.commandLine.appendSwitch('disable-pinch')                    // pas de zoom à deux doigts
app.commandLine.appendSwitch('overscroll-history-navigation', '0') // pas de « page précédente » au balayage
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required') // sons du final

if (!app.requestSingleInstanceLock()) app.quit()

let win = null
let quitting = false

// Fichier à servir : chemin exact, sinon index.html pour les routes de l'application (/puzzle/solaire…).
function resolve (url) {
  let rel
  try { rel = decodeURIComponent(new URL(url).pathname) } catch { return null }
  const file = path.normalize(path.join(ROOT, rel))
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return null
  try { if (fs.statSync(file).isFile()) return file } catch { /* absent */ }
  if (!path.extname(file)) return path.join(ROOT, 'index.html')
  return null
}

async function serve (request) {
  const file = resolve(request.url)
  if (!file) return new Response('Introuvable', { status: 404 })
  const data = await fs.promises.readFile(file)
  return new Response(data, { headers: { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' } })
}

function createWindow () {
  win = new BrowserWindow({
    width: 1600,
    height: 900,
    kiosk: !TEST,
    fullscreen: !TEST,
    autoHideMenuBar: true,
    backgroundColor: '#e6f3f9',
    show: false,
    title: 'La centrale du futur',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: !app.isPackaged,
    },
  })
  win.setMenu(null)
  const wc = win.webContents
  wc.on('did-finish-load', () => { wc.setVisualZoomLevelLimits(1, 1).catch(() => {}) })

  // rien ne sort de l'application : pas de navigation externe, pas de fenêtre ouverte
  wc.on('will-navigate', (e, url) => { if (!url.startsWith(`${ORIGIN}/`)) e.preventDefault() })
  wc.setWindowOpenHandler(() => ({ action: 'deny' }))

  wc.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return
    const key = input.key.toLowerCase()
    // Ctrl+Maj+Q : quitter (personnel, clavier branché)
    if (input.control && input.shift && key === 'q') { e.preventDefault(); quitting = true; app.quit(); return }
    // pas de zoom ni de rechargement au clavier
    if ((input.control || input.meta) && ['+', '-', '=', '0', 'r'].includes(key)) e.preventDefault()
    if (key === 'f5') e.preventDefault()
    // version de test : F11 bascule le plein écran
    if (TEST && key === 'f11') { e.preventDefault(); win.setFullScreen(!win.isFullScreen()) }
  })

  // la page plante : on la recharge (la partie repart de l'accueil, le classement reste)
  wc.on('render-process-gone', (_e, details) => {
    console.error('[borne] page arrêtée :', details.reason)
    setTimeout(() => { if (!win.isDestroyed()) wc.reload() }, 1000)
  })

  // Alt+F4 et la croix ne ferment pas la borne ; seul le personnel peut quitter.
  // L'arrêt ou la fermeture de session Windows, eux, ne doivent pas être bloqués.
  win.on('query-session-end', () => { quitting = true })
  win.on('session-end', () => { quitting = true })
  win.on('close', (e) => { if (!quitting && !TEST) e.preventDefault() })
  win.once('ready-to-show', () => { if (TEST) win.maximize(); win.show() })

  win.loadURL(`${ORIGIN}/`)
}

app.on('second-instance', () => {
  if (!win) return
  if (win.isMinimized()) win.restore()
  win.focus()
})

// Code du personnel : vérifié ici, jamais transmis à la page. Il se règle sur
// chaque borne dans borne.json (dossier de l'application) : { "pin": "4 à 8 chiffres" }.
// Trois erreurs : accès bloqué 60 s. Quitter n'est possible qu'après un code juste.
const DEFAULT_PIN = '2026'
function staffPin () {
  try {
    const cfg = JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'borne.json'), 'utf8'))
    if (/^\d{4,8}$/.test(String(cfg?.pin))) return String(cfg.pin)
  } catch { /* pas de fichier : code par défaut */ }
  return DEFAULT_PIN
}
let pinFails = 0
let pinLockedUntil = 0
let staffUntil = 0
ipcMain.handle('kiosk:check-pin', (_e, pin) => {
  const now = Date.now()
  if (now < pinLockedUntil) return { ok: false, wait: Math.ceil((pinLockedUntil - now) / 1000) }
  if (String(pin) === staffPin()) { pinFails = 0; staffUntil = now + 5 * 60_000; return { ok: true } }
  if (++pinFails >= 3) { pinFails = 0; pinLockedUntil = now + 60_000; return { ok: false, wait: 60 } }
  return { ok: false }
})
ipcMain.on('kiosk:quit', () => {
  if (Date.now() > staffUntil) return
  quitting = true
  app.quit()
})

app.whenReady().then(() => {
  protocol.handle(SCHEME, serve)

  // hors ligne : aucune requête réseau, aucune permission (caméra, micro, notifications…)
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (_d, cb) => cb({ cancel: true }))
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false))

  powerSaveBlocker.start('prevent-display-sleep')
  // borne installée : elle démarre avec la session Windows (jamais en version de test)
  if (app.isPackaged && !TEST) app.setLoginItemSettings({ openAtLogin: true })

  createWindow()
})

app.on('before-quit', () => { quitting = true })
app.on('window-all-closed', () => app.quit())
