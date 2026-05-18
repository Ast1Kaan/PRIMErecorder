import { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain, globalShortcut, desktopCapturer, protocol, dialog } from 'electron'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'
import { initializeDatabase, getAppSettings } from './db/database'
import { registerSettingsHandlers } from './ipc/settingsHandlers'
import { registerScanHandlers } from './ipc/scanHandlers'
import { registerStreamHandlers } from './ipc/streamHandlers'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false
const isDev = process.env.VITE_DEV_SERVER_URL

function getTrayIconPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'resources', 'icons', 'tray-icon.png')
  }
  return path.join(__dirname, '../resources/icons/tray-icon.png')
}

function createTray() {
  const iconPath = getTrayIconPath()
  const icon = nativeImage.createFromPath(iconPath)
  const trayIcon = icon.isEmpty() ? undefined : icon.resize({ width: 18, height: 18 })

  tray = new Tray(trayIcon || iconPath)
  const menu = Menu.buildFromTemplate([
    {
      label: 'PRIMErecorder Aç 🎛',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    {
      label: '🔴 Kayıt Başlat',
      click: () => mainWindow?.webContents.send('hotkey:start-record')
    },
    {
      label: '🟢 Kayıt Durdur',
      click: () => mainWindow?.webContents.send('hotkey:stop-record')
    },
    { type: 'separator' },
    {
      label: 'Ayarlar',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Çıkış',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
  tray.setToolTip('PRIMErecorder • Arka plan kaydına hazır')
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

// Main window oluştur
function createWindow() {
  const fs = require('fs')
  const preloadPaths = [
    path.join(__dirname, '../preload/index.mjs'),
    path.join(__dirname, '../preload/index.cjs'),
    path.join(__dirname, '../preload/index.js'),
  ]
  let preloadPath = preloadPaths[0]
  for (const p of preloadPaths) {
    if (fs.existsSync(p)) {
      preloadPath = p
      break
    }
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  // Capture renderer console logs in the terminal
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message} (at ${sourceId}:${line})`)
  })

  // Dev URL'den veya built dist'ten yükle
  const url = isDev
    ? process.env.VITE_DEV_SERVER_URL
    : `file://${path.join(__dirname, '../renderer/index.html')}`

  mainWindow.loadURL(url as string)

  // Dev tools
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// App lifecycle
app.on('ready', () => {
  initializeDatabase()
  registerSettingsHandlers()
  registerScanHandlers()
  registerStreamHandlers()

  const settings = getAppSettings()
  const startMinimized = settings.general?.autoStartMinimized ?? false
  createWindow()
  createTray()

  if (startMinimized && mainWindow) {
    mainWindow.hide()
  }

  // Register local-video protocol to serve video files safely from filesystem
  protocol.registerFileProtocol('local-video', (request, callback) => {
    const url = request.url.replace('local-video://', '')
    try {
      return callback(decodeURIComponent(url))
    } catch (error) {
      console.error(error)
    }
  })

  ipcMain.handle('system:selectVideoFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Video Dosyaları', extensions: ['mp4', 'webm', 'ogg', 'mkv', 'avi'] }]
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })

  // Register Global Hotkeys
  try {
    globalShortcut.register('Ctrl+Alt+R', () => {
      console.log('[Hotkey Engine] Global Kayıt Başlat tetiklendi!')
      mainWindow?.webContents.send('hotkey:start-record')
    })
    globalShortcut.register('Ctrl+Alt+S', () => {
      console.log('[Hotkey Engine] Global Kayıt Durdur tetiklendi!')
      mainWindow?.webContents.send('hotkey:stop-record')
    })
  } catch (err) {
    console.error('[Hotkey Engine] Kısayollar kaydedilemedi:', err)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('will-quit', () => {
  // Clear hotkeys to prevent leaks
  globalShortcut.unregisterAll()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// IPC Handlers (ileride her modülün kendi ipc dosyası var)
ipcMain.handle('system:getInfo', async () => {
  return {
    platform: process.platform,
    version: app.getVersion(),
  }
})

ipcMain.handle('system:getScreenSources', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['window', 'screen'],
      thumbnailSize: { width: 300, height: 200 }
    })
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }))
  } catch (err) {
    console.error('[Screen Capturer Engine] Hata:', err)
    return []
  }
})

// Hata handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})
