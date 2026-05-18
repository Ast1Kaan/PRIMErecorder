import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("api", {
  getSystemInfo: () => ipcRenderer.invoke("system:getInfo"),
  getScreenSources: () => ipcRenderer.invoke("system:getScreenSources"),
  selectVideoFile: () => ipcRenderer.invoke("system:selectVideoFile"),
  // Capture
  getCaptureSourcesCommand: () => ipcRenderer.invoke("capture:getSources"),
  startCapture: (sourceId) => ipcRenderer.invoke("capture:start", sourceId),
  stopCapture: () => ipcRenderer.invoke("capture:stop"),
  onPreviewFrame: (callback) => {
    ipcRenderer.on("capture:preview-frame", (_, frame) => callback(frame));
  },
  // Record
  startRecord: (settings) => ipcRenderer.invoke("record:start", settings),
  stopRecord: () => ipcRenderer.invoke("record:stop"),
  pauseRecord: () => ipcRenderer.invoke("record:pause"),
  resumeRecord: () => ipcRenderer.invoke("record:resume"),
  onRecordStatus: (callback) => {
    ipcRenderer.on("record:status", (_, status) => callback(status));
  },
  // Stream
  startStream: (profile) => ipcRenderer.invoke("stream:start", profile),
  stopStream: () => ipcRenderer.invoke("stream:stop"),
  writeStreamChunk: (chunk) => ipcRenderer.invoke("stream:writeChunk", chunk),
  testStreamConnection: (url, key) => ipcRenderer.invoke("stream:test", { url, key }),
  onStreamStats: (callback) => {
    ipcRenderer.on("stream:stats", (_, stats) => callback(stats));
  },
  // Scene
  getAllScenes: () => ipcRenderer.invoke("scene:getAll"),
  saveScene: (scene) => ipcRenderer.invoke("scene:create", scene),
  deleteScene: (sceneId) => ipcRenderer.invoke("scene:delete", sceneId),
  activateScene: (sceneId) => ipcRenderer.invoke("scene:activate", sceneId),
  updateSource: (sceneId, sourceId, props) => ipcRenderer.invoke("scene:updateSource", { sceneId, sourceId, props }),
  // Settings
  getSettings: () => ipcRenderer.invoke("settings:get"),
  setSetting: (category, data) => ipcRenderer.invoke("settings:set", { category, data }),
  // System Scan
  startSystemScan: () => ipcRenderer.invoke("system:scan"),
  onSystemScanProgress: (callback) => {
    ipcRenderer.on("system:scan-progress", (_, progress) => callback(progress));
  },
  onSystemScanComplete: (callback) => {
    ipcRenderer.on("system:scan-complete", (_, result) => callback(result));
  },
  onStartRecordHotkey: (callback) => {
    ipcRenderer.on("hotkey:start-record", () => callback());
  },
  onStopRecordHotkey: (callback) => {
    ipcRenderer.on("hotkey:stop-record", () => callback());
  }
});
