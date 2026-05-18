import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),
  getScreenSources: () => ipcRenderer.invoke('system:getScreenSources'),
  selectVideoFile: () => ipcRenderer.invoke('system:selectVideoFile'),
  
  // Capture
  getCaptureSourcesCommand: () => ipcRenderer.invoke('capture:getSources'),
  startCapture: (sourceId: string) => ipcRenderer.invoke('capture:start', sourceId),
  stopCapture: () => ipcRenderer.invoke('capture:stop'),
  onPreviewFrame: (callback: (frame: string) => void) => {
    ipcRenderer.on('capture:preview-frame', (_, frame) => callback(frame))
  },

  // Record
  startRecord: (settings: any) => ipcRenderer.invoke('record:start', settings),
  stopRecord: () => ipcRenderer.invoke('record:stop'),
  pauseRecord: () => ipcRenderer.invoke('record:pause'),
  resumeRecord: () => ipcRenderer.invoke('record:resume'),
  onRecordStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('record:status', (_, status) => callback(status))
  },

  // Stream
  startStream: (profile: any) => ipcRenderer.invoke('stream:start', profile),
  stopStream: () => ipcRenderer.invoke('stream:stop'),
  writeStreamChunk: (chunk: ArrayBuffer) => ipcRenderer.invoke('stream:writeChunk', chunk),
  testStreamConnection: (url: string, key: string) => ipcRenderer.invoke('stream:test', { url, key }),
  onStreamStats: (callback: (stats: any) => void) => {
    ipcRenderer.on('stream:stats', (_, stats) => callback(stats))
  },

  // Scene
  getAllScenes: () => ipcRenderer.invoke('scene:getAll'),
  saveScene: (scene: any) => ipcRenderer.invoke('scene:create', scene),
  deleteScene: (sceneId: string) => ipcRenderer.invoke('scene:delete', sceneId),
  activateScene: (sceneId: string) => ipcRenderer.invoke('scene:activate', sceneId),
  updateSource: (sceneId: string, sourceId: string, props: any) =>
    ipcRenderer.invoke('scene:updateSource', { sceneId, sourceId, props }),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSetting: (category: string, data: any) => ipcRenderer.invoke('settings:set', { category, data }),

  // System Scan
  startSystemScan: () => ipcRenderer.invoke('system:scan'),
  onSystemScanProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('system:scan-progress', (_, progress) => callback(progress))
  },
  onSystemScanComplete: (callback: (result: any) => void) => {
    ipcRenderer.on('system:scan-complete', (_, result) => callback(result))
  },
  onStartRecordHotkey: (callback: () => void) => {
    ipcRenderer.on('hotkey:start-record', () => callback())
  },
  onStopRecordHotkey: (callback: () => void) => {
    ipcRenderer.on('hotkey:stop-record', () => callback())
  },
})
