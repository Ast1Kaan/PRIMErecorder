import { ipcMain } from 'electron'
import { FfmpegService } from '../services/FfmpegService'

export function registerStreamHandlers(): void {
  // 1. Yerel Kaydı Başlat
  ipcMain.handle('record:start', async () => {
    try {
      const outputName = `PRIME_${Date.now()}.mp4`
      await FfmpegService.startRecording(outputName)
      return { success: true, fileName: outputName }
    } catch (error) {
      console.error('[IPC Stream] Kayıt başlatılamadı:', error)
      throw error
    }
  })

  // 2. Yerel Kaydı Durdur
  ipcMain.handle('record:stop', async () => {
    try {
      FfmpegService.stopAll()
      return { success: true }
    } catch (error) {
      console.error('[IPC Stream] Kayıt durdurulamadı:', error)
      throw error
    }
  })

  // 3. Canlı Yayını Başlat
  ipcMain.handle('stream:start', async (_, { url, key }: { url: string; key: string }) => {
    try {
      await FfmpegService.startStreaming(url, key)
      return { success: true }
    } catch (error) {
      console.error('[IPC Stream] Canlı yayın başlatılamadı:', error)
      throw error
    }
  })

  // 4. Canlı Yayını Bitir
  ipcMain.handle('stream:stop', async () => {
    try {
      FfmpegService.stopAll()
      return { success: true }
    } catch (error) {
      console.error('[IPC Stream] Canlı yayın durdurulamadı:', error)
      throw error
    }
  })

  // 5. Medya Parçası Gönder (Write Chunk)
  ipcMain.handle('stream:writeChunk', async (_, chunkArrayBuffer: ArrayBuffer) => {
    try {
      const buffer = Buffer.from(chunkArrayBuffer)
      FfmpegService.writeChunk(buffer)
      return { success: true }
    } catch (error) {
      console.error('[IPC Stream] Medya parçası yazılamadı:', error)
      throw error
    }
  })
}
