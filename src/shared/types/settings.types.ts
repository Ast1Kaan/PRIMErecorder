export interface GeneralSettings {
  language: 'en' | 'tr'
  autoStartMinimized: boolean
  saveProjectOnExit: boolean
  checkUpdatesOnStartup: boolean
  setupCompleted?: boolean
}

export interface UISettings {
  theme: 'light' | 'dark' | 'system'
  fontSize: number // percent, 80-120
  compactMode: boolean
  showStatusBar: boolean
  showTimecodeOverlay: boolean
}

export interface StreamSettings {
  enableAutoReconnect: boolean
  reconnectDelay: number // seconds
  maxReconnectAttempts: number
  defaultPlatform: 'youtube' | 'twitch'
  showStreamStatsOverlay: boolean
}

export interface AudioSettings {
  masterVolume: number // 0-100
  microphoneVolume: number // 0-100
  desktopVolume: number // 0-100
  desktopAudioDevice: string
  microphoneDevice: string
  enableNoiseGate: boolean
  noiseGateThreshold: number
  enableCompression: boolean
  compressionRatio: number
}

export interface VideoSettings {
  preferredResolution: '720p' | '1080p' | '1440p' | '2160p'
  preferredFps: 30 | 60 | 120
  enableVSync: boolean
  gpuAcceleration: boolean
  preferredEncoder: 'auto' | 'nvenc' | 'amf' | 'quicksync' | 'software'
}

export interface HotkeySettings {
  startRecord: string // e.g., 'Ctrl+Alt+R'
  stopRecord: string
  pauseRecord: string
  startStream: string
  stopStream: string
  switchScene: Record<string, string> // sceneId -> hotkey
}

export interface AccessibilitySettings {
  enableHighContrast: boolean
  enableScreenReader: boolean
  fontSize: number // percent
  animationsReduced: boolean
}

export interface AdvancedSettings {
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  enableDeveloperTools: boolean
  autoSegmentDuration: number // minutes
  maxConcurrentCaptures: number
  cachePath: string
}

export interface AppSettings {
  general: GeneralSettings
  ui: UISettings
  stream: StreamSettings
  audio: AudioSettings
  video: VideoSettings
  hotkeys: HotkeySettings
  accessibility: AccessibilitySettings
  advanced: AdvancedSettings
}
