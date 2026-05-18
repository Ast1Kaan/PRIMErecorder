import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { AppSettings } from '../../shared/types/settings.types'
import { Scene } from '../../shared/types/scene.types'

interface DatabaseSchema {
  settings: AppSettings
  scenes: Scene[]
}

let dbFilePath = ''
let dbData: DatabaseSchema = {
  settings: {
    general: { language: 'tr', autoStartMinimized: false, saveProjectOnExit: true, checkUpdatesOnStartup: true, setupCompleted: false },
    ui: { theme: 'dark', fontSize: 100, compactMode: false, showStatusBar: true, showTimecodeOverlay: false },
    stream: { enableAutoReconnect: true, reconnectDelay: 5, maxReconnectAttempts: 3, defaultPlatform: 'youtube', showStreamStatsOverlay: true },
    audio: { masterVolume: 80, microphoneVolume: 70, desktopVolume: 60, desktopAudioDevice: 'default', microphoneDevice: 'default', enableNoiseGate: false, noiseGateThreshold: -40, enableCompression: false, compressionRatio: 4 },
    video: { preferredResolution: '1080p', preferredFps: 60, enableVSync: true, gpuAcceleration: true, preferredEncoder: 'auto' },
    hotkeys: { startRecord: 'Ctrl+Alt+R', stopRecord: 'Ctrl+Alt+S', pauseRecord: 'Ctrl+Alt+P', startStream: 'Ctrl+Alt+L', stopStream: 'Ctrl+Alt+K', switchScene: {} },
    accessibility: { enableHighContrast: false, enableScreenReader: false, fontSize: 100, animationsReduced: false },
    advanced: { logLevel: 'info', enableDeveloperTools: false, autoSegmentDuration: 0, maxConcurrentCaptures: 4, cachePath: '' },
  },
  scenes: [
    {
      id: 'scene_default',
      name: 'Sahne 1',
      sources: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ]
}

// Persist local state back to JSON file
function persistToDisk(): void {
  try {
    if (!dbFilePath) return
    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, null, 2), 'utf-8')
  } catch (err) {
    console.error('[JSON DB] Dosyaya yazma hatası:', err)
  }
}

export function initializeDatabase(): void {
  try {
    const userDataPath = app.getPath('userData')
    dbFilePath = path.join(userDataPath, 'primerecorder_db.json')
    console.log('[JSON DB] Veritabanı dosyası yükleniyor:', dbFilePath)

    if (fs.existsSync(dbFilePath)) {
      const fileContent = fs.readFileSync(dbFilePath, 'utf-8')
      const parsed = JSON.parse(fileContent)

      // Merge values safely to handle future schema additions
      dbData = {
        settings: { ...dbData.settings, ...parsed.settings },
        scenes: parsed.scenes || dbData.scenes
      }
      console.log('[JSON DB] Veritabanı başarıyla belleğe yüklendi. ✓')
    } else {
      console.log('[JSON DB] Veritabanı dosyası bulunamadı, varsayılanlar oluşturuluyor...')
      persistToDisk()
    }
  } catch (err) {
    console.error('[JSON DB] Veritabanı başlatılamadı:', err)
  }
}

// 1. Get All Settings
export function getAppSettings(): AppSettings {
  return dbData.settings
}

// 2. Save App Setting Category
export function saveAppSettings(category: keyof AppSettings, data: any): void {
  dbData.settings = {
    ...dbData.settings,
    [category]: data
  }
  persistToDisk()
}

// 3. Get All Scenes
export function getScenes(): Scene[] {
  return dbData.scenes.map((s) => ({
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt)
  }))
}

// 4. Save / Create Scene
export function saveScene(scene: Scene): void {
  const index = dbData.scenes.findIndex((s) => s.id === scene.id)
  if (index !== -1) {
    dbData.scenes[index] = { ...scene, updatedAt: new Date() }
  } else {
    dbData.scenes.push({ ...scene, createdAt: new Date(), updatedAt: new Date() })
  }
  persistToDisk()
}

// 5. Delete Scene
export function deleteScene(sceneId: string): void {
  dbData.scenes = dbData.scenes.filter((s) => s.id !== sceneId)
  persistToDisk()
}
