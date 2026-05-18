import { create } from 'zustand'
import { Scene, Source, SourceType, SourceTransform } from '../../shared/types/scene.types'
import { AppSettings } from '../../shared/types/settings.types'

interface StudioState {
  settings: AppSettings | null
  scenes: Scene[]
  activeSceneId: string | null
  previewSceneId: string | null
  studioMode: boolean
  isRecording: boolean
  isStreaming: boolean
  streamPlatform: 'youtube' | 'twitch' | 'custom'
  streamKey: string
  streamUrl: string
  transitionTrigger: { timestamp: number; type: 'cut' | 'fade' | 'slide'; duration: number; fromSceneId: string | null } | null

  // Actions
  loadSettings: () => Promise<void>
  updateSettings: (category: keyof AppSettings, data: any) => Promise<void>
  loadScenes: () => Promise<void>
  selectActiveScene: (sceneId: string) => void
  selectPreviewScene: (sceneId: string) => void
  setStudioMode: (enabled: boolean) => void

  // Scene CRUD
  createScene: (name: string) => Promise<void>
  deleteScene: (sceneId: string) => Promise<void>

  // Source CRUD
  addSource: (sceneId: string, name: string, type: SourceType, properties?: any) => Promise<void>
  removeSource: (sceneId: string, sourceId: string) => Promise<void>
  updateSource: (sceneId: string, sourceId: string, updates: Partial<Source>) => Promise<void>
  updateSourceTransform: (sceneId: string, sourceId: string, transform: Partial<SourceTransform>) => Promise<void>
  reorderSource: (sceneId: string, sourceId: string, direction: 'up' | 'down') => Promise<void>

  // Recording & Streaming Actions
  setRecording: (active: boolean) => void
  setStreaming: (active: boolean) => void
  setStreamDetails: (platform: 'youtube' | 'twitch' | 'custom', key: string, url?: string) => void

  // Studio Mode Transition
  transition: (type?: 'cut' | 'fade' | 'slide', duration?: number) => void
}

export const useStudioStore = create<StudioState>((set, get) => ({
  settings: null,
  scenes: [],
  activeSceneId: null,
  previewSceneId: null,
  studioMode: true,
  isRecording: false,
  isStreaming: false,
  streamPlatform: 'youtube',
  streamKey: '',
  streamUrl: 'rtmp://a.rtmp.youtube.com/live2',
  transitionTrigger: null,

  loadSettings: async () => {
    try {
      if ((window as any).api?.getSettings) {
        const settings = await (window as any).api.getSettings()
        set({ settings })
      }
    } catch (error) {
      console.error('[Store] Ayarları yüklerken hata oluştu:', error)
    }
  },

  updateSettings: async (category, data) => {
    const currentSettings = get().settings
    if (currentSettings) {
      const updated = { ...currentSettings, [category]: data }
      set({ settings: updated })

      if ((window as any).api?.setSetting) {
        await (window as any).api.setSetting(category, data)
      }
    }
  },

  loadScenes: async () => {
    try {
      if ((window as any).api?.getAllScenes) {
        const scenes = await (window as any).api.getAllScenes()
        set({
          scenes,
          activeSceneId: scenes.length > 0 ? scenes[0].id : null,
          previewSceneId: scenes.length > 0 ? scenes[0].id : null,
        })
      }
    } catch (error) {
      console.error('[Store] Sahneleri yüklerken hata oluştu:', error)
    }
  },

  selectActiveScene: (sceneId) => {
    set({ activeSceneId: sceneId })
  },

  selectPreviewScene: (sceneId) => {
    set({ previewSceneId: sceneId })
  },

  setStudioMode: (enabled) => {
    set({ studioMode: enabled })
  },

  createScene: async (name) => {
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      name,
      sources: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const updatedScenes = [...get().scenes, newScene]
    set({ scenes: updatedScenes })

    if (!get().activeSceneId) {
      set({ activeSceneId: newScene.id, previewSceneId: newScene.id })
    }

    if ((window as any).api?.saveScene) {
      await (window as any).api.saveScene(newScene)
    }
  },

  deleteScene: async (sceneId) => {
    const updatedScenes = get().scenes.filter((s) => s.id !== sceneId)
    set({ scenes: updatedScenes })

    if (get().activeSceneId === sceneId) {
      set({ activeSceneId: updatedScenes.length > 0 ? updatedScenes[0].id : null })
    }
    if (get().previewSceneId === sceneId) {
      set({ previewSceneId: updatedScenes.length > 0 ? updatedScenes[0].id : null })
    }

    if ((window as any).api?.deleteScene) {
      await (window as any).api.deleteScene(sceneId)
    }
  },

  addSource: async (sceneId, name, type, properties = {}) => {
    const defaultTransform: SourceTransform = {
      x: 0,
      y: 0,
      width: 640,
      height: 480,
      rotation: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
    }

    const newSource: Source = {
      id: `source_${Date.now()}`,
      name,
      type,
      enabled: true,
      transform: defaultTransform,
      properties,
    }

    const updatedScenes = get().scenes.map((scene) => {
      if (scene.id === sceneId) {
        const updatedScene = {
          ...scene,
          sources: [...scene.sources, newSource],
          updatedAt: new Date(),
        }
        // Save scene state to DB
        if ((window as any).api?.saveScene) {
          (window as any).api.saveScene(updatedScene)
        }
        return updatedScene
      }
      return scene
    })

    set({ scenes: updatedScenes })
  },

  removeSource: async (sceneId, sourceId) => {
    const updatedScenes = get().scenes.map((scene) => {
      if (scene.id === sceneId) {
        const updatedScene = {
          ...scene,
          sources: scene.sources.filter((src) => src.id !== sourceId),
          updatedAt: new Date(),
        }
        // Save scene state to DB
        if ((window as any).api?.saveScene) {
          (window as any).api.saveScene(updatedScene)
        }
        return updatedScene
      }
      return scene
    })

    set({ scenes: updatedScenes })
  },

  updateSource: async (sceneId, sourceId, updates) => {
    const updatedScenes = get().scenes.map((scene) => {
      if (scene.id === sceneId) {
        const updatedScene = {
          ...scene,
          sources: scene.sources.map((src) => {
            if (src.id === sourceId) {
              return { ...src, ...updates }
            }
            return src
          }),
          updatedAt: new Date(),
        }
        if ((window as any).api?.saveScene) {
          (window as any).api.saveScene(updatedScene)
        }
        return updatedScene
      }
      return scene
    })

    set({ scenes: updatedScenes })
  },

  updateSourceTransform: async (sceneId, sourceId, transformUpdates) => {
    const updatedScenes = get().scenes.map((scene) => {
      if (scene.id === sceneId) {
        const updatedScene = {
          ...scene,
          sources: scene.sources.map((src) => {
            if (src.id === sourceId) {
              return { ...src, transform: { ...src.transform, ...transformUpdates } }
            }
            return src
          }),
          updatedAt: new Date(),
        }
        if ((window as any).api?.saveScene) {
          (window as any).api.saveScene(updatedScene)
        }
        return updatedScene
      }
      return scene
    })

    set({ scenes: updatedScenes })
  },

  reorderSource: async (sceneId, sourceId, direction) => {
    const updatedScenes = get().scenes.map((scene) => {
      if (scene.id === sceneId) {
        const index = scene.sources.findIndex((src) => src.id === sourceId)
        if (index === -1) return scene

        const newSources = [...scene.sources]
        if (direction === 'up' && index > 0) {
          // Swap with the item above it (index - 1)
          const temp = newSources[index]
          newSources[index] = newSources[index - 1]
          newSources[index - 1] = temp
        } else if (direction === 'down' && index < newSources.length - 1) {
          // Swap with the item below it (index + 1)
          const temp = newSources[index]
          newSources[index] = newSources[index + 1]
          newSources[index + 1] = temp
        }

        const updatedScene = {
          ...scene,
          sources: newSources,
          updatedAt: new Date(),
        }

        if ((window as any).api?.saveScene) {
          (window as any).api.saveScene(updatedScene)
        }
        return updatedScene
      }
      return scene
    })

    set({ scenes: updatedScenes })
  },

  setRecording: async (active) => {
    set({ isRecording: active })
    if (active) {
      if ((window as any).api?.startRecord) {
        await (window as any).api.startRecord()
      }
    }
  },

  setStreaming: async (active) => {
    set({ isStreaming: active })
    if (active) {
      if ((window as any).api?.startStream) {
        const { streamUrl, streamKey } = get()
        await (window as any).api.startStream({ url: streamUrl, key: streamKey })
      }
    }
  },

  setStreamDetails: (platform, key, url = '') => {
    let resolvedUrl = url
    if (platform === 'youtube') {
      resolvedUrl = 'rtmp://a.rtmp.youtube.com/live2'
    } else if (platform === 'twitch') {
      resolvedUrl = 'rtmp://live.twitch.tv/app/'
    }
    set({ streamPlatform: platform, streamKey: key, streamUrl: resolvedUrl })
  },

  transition: (type = 'fade', duration = 300) => {
    const preview = get().previewSceneId
    const currentActive = get().activeSceneId
    if (preview) {
      set({
        transitionTrigger: {
          timestamp: Date.now(),
          type,
          duration,
          fromSceneId: currentActive,
        },
        activeSceneId: preview,
      })
      console.log(`[Studio Transition] Transitioning to Scene: ${preview} using ${type} (${duration}ms)`)
    }
  },
}))
