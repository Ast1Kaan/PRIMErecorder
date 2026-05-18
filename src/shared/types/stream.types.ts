export type StreamPlatform = 'youtube' | 'twitch' | 'custom-rtmp' | 'custom-srt'
export type VideoCodec = 'h264' | 'h265' | 'av1'
export type AudioCodec = 'aac' | 'opus' | 'flac'

export interface StreamProfile {
  id: string
  name: string
  platform: StreamPlatform
  rtmpUrl: string
  streamKey: string // encrypted in database
  customProperties: Record<string, unknown>
}

export interface StreamStats {
  bitrate: number // kbps
  fps: number
  droppedFrames: number
  totalFrames: number
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error'
  latency: number // ms
  bytesOut: number
}

export interface RecordSettings {
  outputDir: string
  filename: string // template with {date}, {time}, etc
  videoCodec: VideoCodec
  videoBitrate: number // kbps
  videoResolution: {
    width: number
    height: number
  }
  videoFps: number
  audioCodec: AudioCodec
  audioBitrate: number // kbps
  audioSampleRate: number // Hz
  useHardwareEncoder: boolean
  enableAudioOnly: boolean
}

export interface RecordStats {
  duration: number // ms
  fileSize: number // bytes
  fps: number
  cpuUsage: number // percent
  droppedFrames: number
}
