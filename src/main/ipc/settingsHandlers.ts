import { ipcMain } from 'electron'
import {
  getAppSettings,
  saveAppSettings,
  getScenes,
  saveScene,
  deleteScene,
} from '../db/database'
import { AppSettings } from '../../shared/types/settings.types'
import { Scene } from '../../shared/types/scene.types'

export function registerSettingsHandlers(): void {
  // 1. Ayarları Getir
  ipcMain.handle('settings:get', async () => {
    try {
      return getAppSettings()
    } catch (error) {
      console.error('[IPC Settings] Ayarlar alınamadı:', error)
      throw error
    }
  })

  // 2. Ayarları Kaydet
  ipcMain.handle('settings:set', async (_, { category, data }: { category: keyof AppSettings; data: any }) => {
    try {
      saveAppSettings(category, data)
      return { success: true }
    } catch (error) {
      console.error('[IPC Settings] Ayar kaydedilemedi:', error)
      throw error
    }
  })

  // 3. Tüm Sahneleri Getir
  ipcMain.handle('scene:getAll', async () => {
    try {
      return getScenes()
    } catch (error) {
      console.error('[IPC Scene] Sahneler alınamadı:', error)
      throw error
    }
  })

  // 4. Sahne Oluştur / Güncelle
  ipcMain.handle('scene:create', async (_, scene: Scene) => {
    try {
      saveScene(scene)
      return { success: true }
    } catch (error) {
      console.error('[IPC Scene] Sahne kaydedilemedi:', error)
      throw error
    }
  })

  // 5. Sahne Sil
  ipcMain.handle('scene:delete', async (_, sceneId: string) => {
    try {
      deleteScene(sceneId)
      return { success: true }
    } catch (error) {
      console.error('[IPC Scene] Sahne silinemedi:', error)
      throw error
    }
  })
}
