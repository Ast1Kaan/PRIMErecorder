export interface GPUInfo {
  name: string
  vram: number // MB
  encoder: 'nvenc' | 'amf' | 'quicksync' | 'none'
  available: boolean
}

export interface CPUInfo {
  model: string
  cores: number
  threads: number
  baseFreq: number // GHz
  maxFreq: number // GHz
}

export interface MemoryInfo {
  total: number // MB
  available: number // MB
  usagePercent: number
}

export interface DisplayInfo {
  id: string
  name: string
  width: number
  height: number
  refreshRate: number
  primary: boolean
}

export interface AudioDeviceInfo {
  id: string
  name: string
  type: 'input' | 'output'
  isDefault: boolean
  channels: number
  sampleRate: number
  isVirtual: boolean
  vendor?: string
}

export interface SystemInfo {
  cpu: CPUInfo
  gpu: GPUInfo[]
  memory: MemoryInfo
  displays: DisplayInfo[]
  audioDevices: AudioDeviceInfo[]
  platform: 'win32' | 'darwin' | 'linux'
  osVersion: string
}

export interface ScanResult {
  recommendedProfile: 'balanced' | 'streaming-only' | 'recording-only' | 'performance'
  recommendations: {
    encoder: 'h264' | 'h265' | 'av1'
    videoBitrate: number
    videoResolution: { width: number; height: number }
    videoFps: number
    audioCodec: 'aac' | 'opus'
    cpuPreset: 'ultrafast' | 'superfast' | 'veryfast' | 'fast' | 'medium'
  }
  analysis: {
    gpuScore: number // 0-100
    cpuScore: number // 0-100
    ramScore: number // 0-100
    bottleneck: string // GPU/CPU/RAM
  }
}
