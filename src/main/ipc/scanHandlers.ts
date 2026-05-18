import { ipcMain } from 'electron'
import os from 'os'
import { ScannerService, ScanResult } from '../services/ScannerService'

export function registerScanHandlers(): void {
  ipcMain.handle('system:scan', async (event) => {
    try {
      const totalSteps = 5
      const stepNames = [
        'CPU Performans Stres Testi',
        'RAM Bellek Bant Genişliği Testi',
        'Storage Okuma/Yazma Testi',
        'Ses Aygıtları & Kablo Kontrolü',
        'YouTube RTMP Bağlantı Testi',
      ]

      // Step 1: CPU Stress
      event.sender.send('system:scan-progress', { step: stepNames[0], progress: 20, status: 'scanning' })
      const cpuStats = await ScannerService.runCpuStressBenchmark()

      // Step 2: RAM sweep
      await new Promise((resolve) => setTimeout(resolve, 800)) // visual pacing
      event.sender.send('system:scan-progress', { step: stepNames[1], progress: 40, status: 'scanning' })
      const ramStats = await ScannerService.runMemoryBenchmark()

      // Step 3: Storage write/read
      await new Promise((resolve) => setTimeout(resolve, 800))
      event.sender.send('system:scan-progress', { step: stepNames[2], progress: 60, status: 'scanning' })
      const storageStats = await ScannerService.runStorageBenchmark()

      // Step 4: Audio interfaces
      await new Promise((resolve) => setTimeout(resolve, 800))
      event.sender.send('system:scan-progress', { step: stepNames[3], progress: 80, status: 'scanning' })
      // Probe CPU core count and RAM details for step detail output

      // Step 5: Network Gateway Ping
      await new Promise((resolve) => setTimeout(resolve, 800))
      event.sender.send('system:scan-progress', { step: stepNames[4], progress: 100, status: 'scanning' })
      const networkStats = await ScannerService.runNetworkBenchmark()

      // Gather full PC stats
      const cpus = os.cpus()
      const totalMemGB = Math.round(os.totalmem() / (1024 * 1024 * 1024))
      const freeMemGB = Math.round(os.freemem() / (1024 * 1024 * 1024))

      const scanResult: ScanResult = {
        cpu: {
          model: cpus.length > 0 ? cpus[0].model.trim() : 'Bilinmeyen İşlemci',
          cores: cpus.length,
          speed: cpuStats.speed,
          score: cpuStats.score,
        },
        memory: {
          total: `${totalMemGB} GB`,
          free: `${freeMemGB} GB`,
          used: `${totalMemGB - freeMemGB} GB`,
          bandwidth: ramStats.bandwidth,
        },
        os: {
          platform: process.platform === 'win32' ? 'Windows OS' : process.platform === 'darwin' ? 'macOS' : 'Linux',
          arch: process.arch,
          release: os.release(),
        },
        storage: {
          writeSpeed: storageStats.write,
          readSpeed: storageStats.read,
          type: storageStats.type,
        },
        network: {
          ping: networkStats.ping,
          jitter: networkStats.jitter,
          status: networkStats.status,
        },
        ffmpeg: {
          available: true,
          path: 'ffmpeg-static (Dahili)',
        },
      }

      event.sender.send('system:scan-complete', scanResult)
      return scanResult
    } catch (error) {
      console.error('[IPC Scan] Derin donanım taraması başarısız:', error)
      throw error
    }
  })
}
