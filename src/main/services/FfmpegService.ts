import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import ffmpegPath from 'ffmpeg-static'

export class FfmpegService {
  private static activeFfmpegProcess: ChildProcess | null = null
  private static lastRecordingPath: string | null = null

  // 1. Spawns FFmpeg for local recording reading from standard input (stdin)
  static startRecording(outputName = 'record.mp4'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const outputFolder = app.getPath('videos')
        if (!fs.existsSync(outputFolder)) {
          fs.mkdirSync(outputFolder, { recursive: true })
        }
        const outputPath = path.join(outputFolder, outputName)
        this.lastRecordingPath = outputPath
        console.log('[FFmpeg Encoder] Yerel kayıt başlatılıyor, yer: ', outputPath)

        this.activeFfmpegProcess = spawn(
          ffmpegPath || 'ffmpeg',
          [
            '-y',
            '-i', 'pipe:0',  // Read from standard input stream
            '-c:v', 'libx264',  // Convert to standard H.264 video
            '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',  // Convert to standard AAC audio
            outputPath,
          ],
          { windowsHide: true }
        )

        this.bindEvents()
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }

  // 2. Spawns FFmpeg for live streaming, re-encoding standard input to YouTube RTMPS
  static startStreaming(rtmpUrl: string, streamKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const destination = `${rtmpUrl}/${streamKey}`
        console.log('[FFmpeg Encoder] Canlı yayın başlatılıyor, hedef:', destination)

        this.activeFfmpegProcess = spawn(
          ffmpegPath || 'ffmpeg',
          [
            '-y',
            '-i', 'pipe:0',
            '-c:v', 'libx264',                     // re-encode for stable broadcast
            '-preset', 'ultrafast',
            '-tune', 'zerolatency',
            '-b:v', '4500k',                      // Steady 4.5 Mbps bitrate
            '-maxrate', '4500k',
            '-bufsize', '9000k',
            '-pix_fmt', 'yuv420p',
            '-g', '60',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-f', 'flv',
            destination,
          ],
          { windowsHide: true }
        )

        this.bindEvents()
        resolve()
      } catch (err) {
        reject(err)
      }
    })
  }

  // 3. Write binary media chunks directly into FFmpeg process standard input
  static writeChunk(chunk: Buffer): void {
    if (this.activeFfmpegProcess && this.activeFfmpegProcess.stdin?.writable) {
      this.activeFfmpegProcess.stdin.write(chunk)
    }
  }

  private static bindEvents() {
    if (!this.activeFfmpegProcess) return

    this.activeFfmpegProcess.stderr?.on('data', (data) => {
      console.log(`[FFmpeg Engine Logs] ${data.toString().trim()}`)
    })

    this.activeFfmpegProcess.on('close', (code) => {
      console.log(`[FFmpeg Engine] FFmpeg süreci sonlandı. Kod: ${code}`)
      this.activeFfmpegProcess = null
    })

    this.activeFfmpegProcess.on('error', (err) => {
      console.error('[FFmpeg Engine] FFmpeg hatası:', err)
    })
  }

  // 4. Safely stops all active encoders and closes stdin pipes
  static stopAll(): void {
    console.log('[FFmpeg Service] Kayıt/Yayın durduruluyor, kodlayıcılar temizleniyor...')
    if (this.activeFfmpegProcess) {
      const proc = this.activeFfmpegProcess
      this.activeFfmpegProcess = null

      if (proc.stdin) {
        try {
          proc.stdin.end()
        } catch (e) {
          console.error('[FFmpeg Service] stdin kapatılamadı:', e)
        }
      }

      // 1.5 seconds grace period for FFmpeg to gracefully write MP4 header metadata
      const currentPath = this.lastRecordingPath
      this.lastRecordingPath = null

      setTimeout(() => {
        try {
          proc.kill('SIGINT')
        } catch (e) {
          // Process has already exited
        }

        if (currentPath && fs.existsSync(currentPath)) {
          console.log(`[FFmpeg Service] Kayıt tamamlandı! Dosya yolu açılıyor: ${currentPath}`)
          const { shell } = require('electron')
          shell.showItemInFolder(currentPath)
        }
      }, 1500)
    }
  }
}
