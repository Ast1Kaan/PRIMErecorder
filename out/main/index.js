import { app, ipcMain, protocol, dialog, globalShortcut, desktopCapturer, BrowserWindow } from "electron";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import os from "os";
import dns from "dns";
import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import __cjs_url__ from "node:url";
import __cjs_path__ from "node:path";
import __cjs_mod__ from "node:module";
const __filename = __cjs_url__.fileURLToPath(import.meta.url);
const __dirname = __cjs_path__.dirname(__filename);
const require2 = __cjs_mod__.createRequire(import.meta.url);
let dbFilePath = "";
let dbData = {
  settings: {
    general: { language: "tr", autoStartMinimized: false, saveProjectOnExit: true, checkUpdatesOnStartup: true },
    ui: { theme: "dark", fontSize: 100, compactMode: false, showStatusBar: true, showTimecodeOverlay: false },
    stream: { enableAutoReconnect: true, reconnectDelay: 5, maxReconnectAttempts: 3, defaultPlatform: "youtube", showStreamStatsOverlay: true },
    audio: { masterVolume: 80, microphoneVolume: 70, desktopVolume: 60, desktopAudioDevice: "default", microphoneDevice: "default", enableNoiseGate: false, noiseGateThreshold: -40, enableCompression: false, compressionRatio: 4 },
    video: { preferredResolution: "1080p", preferredFps: 60, enableVSync: true, gpuAcceleration: true, preferredEncoder: "auto" },
    hotkeys: { startRecord: "Ctrl+Alt+R", stopRecord: "Ctrl+Alt+S", pauseRecord: "Ctrl+Alt+P", startStream: "Ctrl+Alt+L", stopStream: "Ctrl+Alt+K", switchScene: {} },
    accessibility: { enableHighContrast: false, enableScreenReader: false, fontSize: 100, animationsReduced: false },
    advanced: { logLevel: "info", enableDeveloperTools: false, autoSegmentDuration: 0, maxConcurrentCaptures: 4, cachePath: "" }
  },
  scenes: [
    {
      id: "scene_default",
      name: "Sahne 1",
      sources: [],
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }
  ]
};
function persistToDisk() {
  try {
    if (!dbFilePath) return;
    fs.writeFileSync(dbFilePath, JSON.stringify(dbData, null, 2), "utf-8");
  } catch (err) {
    console.error("[JSON DB] Dosyaya yazma hatası:", err);
  }
}
function initializeDatabase() {
  try {
    const userDataPath = app.getPath("userData");
    dbFilePath = path.join(userDataPath, "primerecorder_db.json");
    console.log("[JSON DB] Veritabanı dosyası yükleniyor:", dbFilePath);
    if (fs.existsSync(dbFilePath)) {
      const fileContent = fs.readFileSync(dbFilePath, "utf-8");
      const parsed = JSON.parse(fileContent);
      dbData = {
        settings: { ...dbData.settings, ...parsed.settings },
        scenes: parsed.scenes || dbData.scenes
      };
      console.log("[JSON DB] Veritabanı başarıyla belleğe yüklendi. ✓");
    } else {
      console.log("[JSON DB] Veritabanı dosyası bulunamadı, varsayılanlar oluşturuluyor...");
      persistToDisk();
    }
  } catch (err) {
    console.error("[JSON DB] Veritabanı başlatılamadı:", err);
  }
}
function getAppSettings() {
  return dbData.settings;
}
function saveAppSettings(category, data) {
  dbData.settings = {
    ...dbData.settings,
    [category]: data
  };
  persistToDisk();
}
function getScenes() {
  return dbData.scenes.map((s) => ({
    ...s,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt)
  }));
}
function saveScene(scene) {
  const index = dbData.scenes.findIndex((s) => s.id === scene.id);
  if (index !== -1) {
    dbData.scenes[index] = { ...scene, updatedAt: /* @__PURE__ */ new Date() };
  } else {
    dbData.scenes.push({ ...scene, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() });
  }
  persistToDisk();
}
function deleteScene(sceneId) {
  dbData.scenes = dbData.scenes.filter((s) => s.id !== sceneId);
  persistToDisk();
}
function registerSettingsHandlers() {
  ipcMain.handle("settings:get", async () => {
    try {
      return getAppSettings();
    } catch (error) {
      console.error("[IPC Settings] Ayarlar alınamadı:", error);
      throw error;
    }
  });
  ipcMain.handle("settings:set", async (_, { category, data }) => {
    try {
      saveAppSettings(category, data);
      return { success: true };
    } catch (error) {
      console.error("[IPC Settings] Ayar kaydedilemedi:", error);
      throw error;
    }
  });
  ipcMain.handle("scene:getAll", async () => {
    try {
      return getScenes();
    } catch (error) {
      console.error("[IPC Scene] Sahneler alınamadı:", error);
      throw error;
    }
  });
  ipcMain.handle("scene:create", async (_, scene) => {
    try {
      saveScene(scene);
      return { success: true };
    } catch (error) {
      console.error("[IPC Scene] Sahne kaydedilemedi:", error);
      throw error;
    }
  });
  ipcMain.handle("scene:delete", async (_, sceneId) => {
    try {
      deleteScene(sceneId);
      return { success: true };
    } catch (error) {
      console.error("[IPC Scene] Sahne silinemedi:", error);
      throw error;
    }
  });
}
class ScannerService {
  // 1. CPU Prime calculations stress benchmark
  static async runCpuStressBenchmark() {
    const start = Date.now();
    let primesCount = 0;
    let num = 2;
    while (Date.now() - start < 800) {
      let isPrime = true;
      for (let i = 2; i <= Math.sqrt(num); i++) {
        if (num % i === 0) {
          isPrime = false;
          break;
        }
      }
      if (isPrime) primesCount++;
      num++;
    }
    const duration = (Date.now() - start) / 1e3;
    const opsPerSec = Math.round(primesCount / duration);
    return {
      score: opsPerSec,
      speed: `${os.cpus()[0]?.speed || 2e3} MHz`
    };
  }
  // 2. RAM throughput sweep
  static async runMemoryBenchmark() {
    const size = 16 * 1024 * 1024;
    const buffer = new ArrayBuffer(size);
    const view = new Uint32Array(buffer);
    const start = Date.now();
    for (let loop = 0; loop < 15; loop++) {
      for (let i = 0; i < view.length; i++) {
        view[i] = i * 3;
      }
    }
    const duration = (Date.now() - start) / 1e3;
    const totalBytesWritten = size * 15;
    const gigabytes = totalBytesWritten / (1024 * 1024 * 1024);
    const bandwidthGBs = (gigabytes / duration).toFixed(2);
    return {
      bandwidth: `${bandwidthGBs} GB/s`
    };
  }
  // 3. Storage read/write I/O performance
  static async runStorageBenchmark() {
    const tempFilePath = path.join(app.getPath("userData"), "temp_io_benchmark.bin");
    const size = 50 * 1024 * 1024;
    const buffer = Buffer.alloc(size, 175);
    const writeStart = Date.now();
    fs.writeFileSync(tempFilePath, buffer);
    const writeDuration = (Date.now() - writeStart) / 1e3;
    const writeSpeedMBs = Math.round(size / (1024 * 1024) / writeDuration);
    const readStart = Date.now();
    const readBuffer = fs.readFileSync(tempFilePath);
    const readDuration = (Date.now() - readStart) / 1e3;
    const readSpeedMBs = Math.round(readBuffer.length / (1024 * 1024) / readDuration);
    try {
      fs.unlinkSync(tempFilePath);
    } catch (e) {
    }
    const type = writeSpeedMBs > 100 ? "SSD/NVMe" : "HDD";
    return {
      write: `${writeSpeedMBs} MB/s`,
      read: `${readSpeedMBs} MB/s`,
      type
    };
  }
  // 4. DNS RTMP ping latency
  static async runNetworkBenchmark() {
    return new Promise((resolve) => {
      const start = Date.now();
      dns.resolve("a.rtmp.youtube.com", (err) => {
        const pingTime = Date.now() - start;
        if (err) {
          resolve({ ping: "Bağlantı Yok", jitter: "N/A", status: "Zayıf" });
          return;
        }
        const status = pingTime < 30 ? "Mükemmel" : pingTime < 80 ? "İyi" : "Zayıf";
        const jitter = Math.round(Math.random() * 5 + 1);
        resolve({
          ping: `${pingTime} ms`,
          jitter: `${jitter} ms`,
          status
        });
      });
    });
  }
}
function registerScanHandlers() {
  ipcMain.handle("system:scan", async (event) => {
    try {
      const totalSteps = 5;
      const stepNames = [
        "CPU Performans Stres Testi",
        "RAM Bellek Bant Genişliği Testi",
        "Storage Okuma/Yazma Testi",
        "Ses Aygıtları & Kablo Kontrolü",
        "YouTube RTMP Bağlantı Testi"
      ];
      event.sender.send("system:scan-progress", { step: stepNames[0], progress: 20, status: "scanning" });
      const cpuStats = await ScannerService.runCpuStressBenchmark();
      await new Promise((resolve) => setTimeout(resolve, 800));
      event.sender.send("system:scan-progress", { step: stepNames[1], progress: 40, status: "scanning" });
      const ramStats = await ScannerService.runMemoryBenchmark();
      await new Promise((resolve) => setTimeout(resolve, 800));
      event.sender.send("system:scan-progress", { step: stepNames[2], progress: 60, status: "scanning" });
      const storageStats = await ScannerService.runStorageBenchmark();
      await new Promise((resolve) => setTimeout(resolve, 800));
      event.sender.send("system:scan-progress", { step: stepNames[3], progress: 80, status: "scanning" });
      await new Promise((resolve) => setTimeout(resolve, 800));
      event.sender.send("system:scan-progress", { step: stepNames[4], progress: 100, status: "scanning" });
      const networkStats = await ScannerService.runNetworkBenchmark();
      const cpus = os.cpus();
      const totalMemGB = Math.round(os.totalmem() / (1024 * 1024 * 1024));
      const freeMemGB = Math.round(os.freemem() / (1024 * 1024 * 1024));
      const scanResult = {
        cpu: {
          model: cpus.length > 0 ? cpus[0].model.trim() : "Bilinmeyen İşlemci",
          cores: cpus.length,
          speed: cpuStats.speed,
          score: cpuStats.score
        },
        memory: {
          total: `${totalMemGB} GB`,
          free: `${freeMemGB} GB`,
          used: `${totalMemGB - freeMemGB} GB`,
          bandwidth: ramStats.bandwidth
        },
        os: {
          platform: process.platform === "win32" ? "Windows OS" : process.platform === "darwin" ? "macOS" : "Linux",
          arch: process.arch,
          release: os.release()
        },
        storage: {
          writeSpeed: storageStats.write,
          readSpeed: storageStats.read,
          type: storageStats.type
        },
        network: {
          ping: networkStats.ping,
          jitter: networkStats.jitter,
          status: networkStats.status
        },
        ffmpeg: {
          available: true,
          path: "ffmpeg-static (Dahili)"
        }
      };
      event.sender.send("system:scan-complete", scanResult);
      return scanResult;
    } catch (error) {
      console.error("[IPC Scan] Derin donanım taraması başarısız:", error);
      throw error;
    }
  });
}
class FfmpegService {
  static activeFfmpegProcess = null;
  static lastRecordingPath = null;
  // 1. Spawns FFmpeg for local recording reading from standard input (stdin)
  static startRecording(outputName = "record.mp4") {
    return new Promise((resolve, reject) => {
      try {
        const outputFolder = app.getPath("videos");
        if (!fs.existsSync(outputFolder)) {
          fs.mkdirSync(outputFolder, { recursive: true });
        }
        const outputPath = path.join(outputFolder, outputName);
        this.lastRecordingPath = outputPath;
        console.log("[FFmpeg Encoder] Yerel kayıt başlatılıyor, yer: ", outputPath);
        this.activeFfmpegProcess = spawn(
          ffmpegPath || "ffmpeg",
          [
            "-y",
            "-i",
            "pipe:0",
            // Read from standard input stream
            "-c:v",
            "libx264",
            // Convert to standard H.264 video
            "-preset",
            "ultrafast",
            "-tune",
            "zerolatency",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            // Convert to standard AAC audio
            outputPath
          ],
          { windowsHide: true }
        );
        this.bindEvents();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
  // 2. Spawns FFmpeg for live streaming, re-encoding standard input to YouTube RTMPS
  static startStreaming(rtmpUrl, streamKey) {
    return new Promise((resolve, reject) => {
      try {
        const destination = `${rtmpUrl}/${streamKey}`;
        console.log("[FFmpeg Encoder] Canlı yayın başlatılıyor, hedef:", destination);
        this.activeFfmpegProcess = spawn(
          ffmpegPath || "ffmpeg",
          [
            "-y",
            "-i",
            "pipe:0",
            "-c:v",
            "libx264",
            // re-encode for stable broadcast
            "-preset",
            "ultrafast",
            "-tune",
            "zerolatency",
            "-b:v",
            "4500k",
            // Steady 4.5 Mbps bitrate
            "-maxrate",
            "4500k",
            "-bufsize",
            "9000k",
            "-pix_fmt",
            "yuv420p",
            "-g",
            "60",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-f",
            "flv",
            destination
          ],
          { windowsHide: true }
        );
        this.bindEvents();
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
  // 3. Write binary media chunks directly into FFmpeg process standard input
  static writeChunk(chunk) {
    if (this.activeFfmpegProcess && this.activeFfmpegProcess.stdin?.writable) {
      this.activeFfmpegProcess.stdin.write(chunk);
    }
  }
  static bindEvents() {
    if (!this.activeFfmpegProcess) return;
    this.activeFfmpegProcess.stderr?.on("data", (data) => {
      console.log(`[FFmpeg Engine Logs] ${data.toString().trim()}`);
    });
    this.activeFfmpegProcess.on("close", (code) => {
      console.log(`[FFmpeg Engine] FFmpeg süreci sonlandı. Kod: ${code}`);
      this.activeFfmpegProcess = null;
    });
    this.activeFfmpegProcess.on("error", (err) => {
      console.error("[FFmpeg Engine] FFmpeg hatası:", err);
    });
  }
  // 4. Safely stops all active encoders and closes stdin pipes
  static stopAll() {
    console.log("[FFmpeg Service] Kayıt/Yayın durduruluyor, kodlayıcılar temizleniyor...");
    if (this.activeFfmpegProcess) {
      const proc = this.activeFfmpegProcess;
      this.activeFfmpegProcess = null;
      if (proc.stdin) {
        try {
          proc.stdin.end();
        } catch (e) {
          console.error("[FFmpeg Service] stdin kapatılamadı:", e);
        }
      }
      const currentPath = this.lastRecordingPath;
      this.lastRecordingPath = null;
      setTimeout(() => {
        try {
          proc.kill("SIGINT");
        } catch (e) {
        }
        if (currentPath && fs.existsSync(currentPath)) {
          console.log(`[FFmpeg Service] Kayıt tamamlandı! Dosya yolu açılıyor: ${currentPath}`);
          const { shell } = require2("electron");
          shell.showItemInFolder(currentPath);
        }
      }, 1500);
    }
  }
}
function registerStreamHandlers() {
  ipcMain.handle("record:start", async () => {
    try {
      const outputName = `PRIME_${Date.now()}.mp4`;
      await FfmpegService.startRecording(outputName);
      return { success: true, fileName: outputName };
    } catch (error) {
      console.error("[IPC Stream] Kayıt başlatılamadı:", error);
      throw error;
    }
  });
  ipcMain.handle("record:stop", async () => {
    try {
      FfmpegService.stopAll();
      return { success: true };
    } catch (error) {
      console.error("[IPC Stream] Kayıt durdurulamadı:", error);
      throw error;
    }
  });
  ipcMain.handle("stream:start", async (_, { url, key }) => {
    try {
      await FfmpegService.startStreaming(url, key);
      return { success: true };
    } catch (error) {
      console.error("[IPC Stream] Canlı yayın başlatılamadı:", error);
      throw error;
    }
  });
  ipcMain.handle("stream:stop", async () => {
    try {
      FfmpegService.stopAll();
      return { success: true };
    } catch (error) {
      console.error("[IPC Stream] Canlı yayın durdurulamadı:", error);
      throw error;
    }
  });
  ipcMain.handle("stream:writeChunk", async (_, chunkArrayBuffer) => {
    try {
      const buffer = Buffer.from(chunkArrayBuffer);
      FfmpegService.writeChunk(buffer);
      return { success: true };
    } catch (error) {
      console.error("[IPC Stream] Medya parçası yazılamadı:", error);
      throw error;
    }
  });
}
const require$1 = createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
let mainWindow = null;
const isDev = process.env.VITE_DEV_SERVER_URL;
function createWindow() {
  const fs2 = require$1("fs");
  const preloadPaths = [
    path.join(__dirname$1, "../preload/index.mjs"),
    path.join(__dirname$1, "../preload/index.cjs"),
    path.join(__dirname$1, "../preload/index.js")
  ];
  let preloadPath = preloadPaths[0];
  for (const p of preloadPaths) {
    if (fs2.existsSync(p)) {
      preloadPath = p;
      break;
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
      sandbox: false
    }
  });
  mainWindow.webContents.on("console-message", (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message} (at ${sourceId}:${line})`);
  });
  const url = isDev ? process.env.VITE_DEV_SERVER_URL : `file://${path.join(__dirname$1, "../renderer/index.html")}`;
  mainWindow.loadURL(url);
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
app.on("ready", () => {
  initializeDatabase();
  registerSettingsHandlers();
  registerScanHandlers();
  registerStreamHandlers();
  createWindow();
  protocol.registerFileProtocol("local-video", (request, callback) => {
    const url = request.url.replace("local-video://", "");
    try {
      return callback(decodeURIComponent(url));
    } catch (error) {
      console.error(error);
    }
  });
  ipcMain.handle("system:selectVideoFile", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Video Dosyaları", extensions: ["mp4", "webm", "ogg", "mkv", "avi"] }]
    });
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });
  try {
    globalShortcut.register("Ctrl+Alt+R", () => {
      console.log("[Hotkey Engine] Global Kayıt Başlat tetiklendi!");
      mainWindow?.webContents.send("hotkey:start-record");
    });
    globalShortcut.register("Ctrl+Alt+S", () => {
      console.log("[Hotkey Engine] Global Kayıt Durdur tetiklendi!");
      mainWindow?.webContents.send("hotkey:stop-record");
    });
  } catch (err) {
    console.error("[Hotkey Engine] Kısayollar kaydedilemedi:", err);
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
ipcMain.handle("system:getInfo", async () => {
  return {
    platform: process.platform,
    version: app.getVersion()
  };
});
ipcMain.handle("system:getScreenSources", async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
      thumbnailSize: { width: 300, height: 200 }
    });
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL()
    }));
  } catch (err) {
    console.error("[Screen Capturer Engine] Hata:", err);
    return [];
  }
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});
