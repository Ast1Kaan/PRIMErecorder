export type SourceType = 
  | 'screen-capture'
  | 'window-capture'
  | 'audio-capture'
  | 'media-file'
  | 'text'
  | 'advanced-text'
  | 'web-view'
  | 'image'
  | 'image-slideshow'
  | 'microphone'
  | 'timer'

export interface SourceTransform {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  scaleX: number
  scaleY: number
}

export interface Source {
  id: string
  name: string
  type: SourceType
  enabled: boolean
  transform: SourceTransform
  properties: Record<string, unknown>
  audioTrack?: {
    deviceId: string
    volume: number
  }
}

export interface Scene {
  id: string
  name: string
  sources: Source[]
  createdAt: Date
  updatedAt: Date
}

export interface SceneTransition {
  type: 'cut' | 'fade' | 'slide' | 'zoom'
  duration: number // milliseconds
}

export interface TransitionSettings {
  default: SceneTransition
  custom: Record<string, SceneTransition>
}
