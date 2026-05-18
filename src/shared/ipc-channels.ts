// Capture channels
export const CAPTURE_CHANNELS = {
  GET_SOURCES: 'capture:getSources',
  START: 'capture:start',
  STOP: 'capture:stop',
  PREVIEW_FRAME: 'capture:preview-frame',
} as const

// Record channels
export const RECORD_CHANNELS = {
  START: 'record:start',
  STOP: 'record:stop',
  PAUSE: 'record:pause',
  RESUME: 'record:resume',
  STATUS: 'record:status',
} as const

// Stream channels
export const STREAM_CHANNELS = {
  START: 'stream:start',
  STOP: 'stream:stop',
  TEST_CONNECTION: 'stream:test',
  STATS: 'stream:stats',
} as const

// Scene channels
export const SCENE_CHANNELS = {
  GET_ALL: 'scene:getAll',
  CREATE: 'scene:create',
  DELETE: 'scene:delete',
  ACTIVATE: 'scene:activate',
  UPDATE_SOURCE: 'scene:updateSource',
  ADD_SOURCE: 'scene:addSource',
  REMOVE_SOURCE: 'scene:removeSource',
} as const

// Settings channels
export const SETTINGS_CHANNELS = {
  GET: 'settings:get',
  SET: 'settings:set',
  RESET: 'settings:reset',
  EXPORT: 'settings:export',
  IMPORT: 'settings:import',
} as const

// System channels
export const SYSTEM_CHANNELS = {
  GET_INFO: 'system:getInfo',
  SCAN_START: 'system:scan',
  SCAN_PROGRESS: 'system:scan-progress',
  SCAN_COMPLETE: 'system:scan-complete',
} as const

// Audio channels
export const AUDIO_CHANNELS = {
  GET_DEVICES: 'audio:getDevices',
  SET_VOLUME: 'audio:setVolume',
  VU_METER: 'audio:vu-meter',
} as const

// Hotkey channels
export const HOTKEY_CHANNELS = {
  REGISTER: 'hotkey:register',
  FIRED: 'hotkey:fired',
} as const

// All channels
export const ALL_CHANNELS = {
  ...CAPTURE_CHANNELS,
  ...RECORD_CHANNELS,
  ...STREAM_CHANNELS,
  ...SCENE_CHANNELS,
  ...SETTINGS_CHANNELS,
  ...SYSTEM_CHANNELS,
  ...AUDIO_CHANNELS,
  ...HOTKEY_CHANNELS,
} as const

export type AllChannels = typeof ALL_CHANNELS[keyof typeof ALL_CHANNELS]
