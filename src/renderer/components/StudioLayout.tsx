























import { useState, useEffect } from 'react'
import { useStudioStore } from '../store/useStudioStore'
import CanvasViewport from './CanvasViewport'
import MixerPanel from './MixerPanel'
import { SourceType, Source } from '../../shared/types/scene.types'

interface StudioLayoutProps {
  onOpenSettings: () => void
}

export default function StudioLayout({ onOpenSettings }: StudioLayoutProps) {
  const {
    scenes,
    activeSceneId,
    previewSceneId,
    studioMode,
    isRecording,
    isStreaming,
    selectPreviewScene,
    selectActiveScene,
    createScene,
    deleteScene,
    addSource,
    removeSource,
    updateSource,
    reorderSource,
    setRecording,
    setStreaming,
    setStudioMode,
    transition,
  } = useStudioStore()

  // Selected Scene (Preview in Studio Mode, Active in regular mode)
  const currentEditingSceneId = studioMode ? previewSceneId : activeSceneId
  const currentEditingScene = scenes.find((s) => s.id === currentEditingSceneId)

  // Transition animation selectors
  const [transitionStyle, setTransitionStyle] = useState<'fade' | 'cut'>('fade')
  const [transitionDur, setTransitionDur] = useState<number>(300)

  // Image source upload tab selection
  const [imageUploadMode, setImageUploadMode] = useState<'url' | 'file'>('url')
  const [videoUploadMode, setVideoUploadMode] = useState<'url' | 'file'>('url')

  // Screen capturer sources (native list from Electron Main process)
  const [screenSources, setScreenSources] = useState<any[]>([])
  const [selectedScreenSourceId, setSelectedScreenSourceId] = useState<string>('')

  // Modals for adding scenes/sources
  const [showAddSceneModal, setShowAddSceneModal] = useState(false)
  const [newSceneName, setNewSceneName] = useState('')
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null)

  const [showAddSourceModal, setShowAddSourceModal] = useState(false)
  const [newSourceName, setNewSourceName] = useState('')
  const [newSourceType, setNewSourceType] = useState<SourceType>('text')
  const [newSourceProps, setNewSourceProps] = useState<Record<string, any>>({
    text: 'Yeni Yazı',
    color: '#ffffff',
    fontSize: 48,
  })

  useEffect(() => {
    if (showAddSourceModal && newSourceType === 'screen-capture') {
      const fetchScreenSources = async () => {
        if ((window as any).api?.getScreenSources) {
          try {
            const sources = await (window as any).api.getScreenSources()
            setScreenSources(sources)
            if (sources.length > 0) {
              setSelectedScreenSourceId(sources[0].id)
            }
          } catch (e) {
            console.error('Ekran kaynakları listelenemedi:', e)
          }
        }
      }
      fetchScreenSources()
    } else {
      setScreenSources([])
      setSelectedScreenSourceId('')
    }
  }, [showAddSourceModal, newSourceType])

  const handleCreateScene = async () => {
    if (!newSceneName.trim()) return
    await createScene(newSceneName.trim())
    setNewSceneName('')
    setShowAddSceneModal(false)
  }

  const handleOpenEditSource = (src: Source) => {
    setEditingSourceId(src.id)
    setNewSourceName(src.name)
    setNewSourceType(src.type)
    setNewSourceProps({ ...src.properties })
    setShowAddSourceModal(true)
  }

  const handleSelectVideoFile = async () => {
    if ((window as any).api?.selectVideoFile) {
      const filePath = await (window as any).api.selectVideoFile()
      if (filePath) {
        setNewSourceProps({ ...newSourceProps, videoUrl: `local-video://${filePath}` })
      }
    }
  }

  const handleAddSource = async () => {
    if (!newSourceName.trim() || !currentEditingSceneId) return

    let finalProps = { ...newSourceProps }

    // If Screen Capture, get the actual stream from the browser
    if (newSourceType === 'screen-capture') {
      try {
        if (!selectedScreenSourceId) {
          if (editingSourceId) {
            const currentSrc = currentEditingScene?.sources.find(s => s.id === editingSourceId)
            if (currentSrc && currentSrc.properties.chromeMediaSourceId && currentSrc.properties.stream) {
              finalProps.chromeMediaSourceId = currentSrc.properties.chromeMediaSourceId
              finalProps.stream = currentSrc.properties.stream
            }
          }
          if (!finalProps.chromeMediaSourceId) {
            alert('Lütfen yakalamak istediğiniz ekranı veya pencereyi seçin.')
            return
          }
        } else {
          let needsNewStream = true
          if (editingSourceId) {
            const currentSrc = currentEditingScene?.sources.find(s => s.id === editingSourceId)
            if (currentSrc && currentSrc.properties.chromeMediaSourceId === selectedScreenSourceId && currentSrc.properties.stream) {
              needsNewStream = false
              finalProps.chromeMediaSourceId = currentSrc.properties.chromeMediaSourceId
              finalProps.stream = currentSrc.properties.stream
            }
          }

          if (needsNewStream) {
            const stream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                mandatory: {
                  chromeMediaSource: 'desktop',
                  chromeMediaSourceId: selectedScreenSourceId,
                  minWidth: 1280,
                  maxWidth: 1920,
                  minHeight: 720,
                  maxHeight: 1080
                }
              } as any
            })
            finalProps.stream = stream
            finalProps.chromeMediaSourceId = selectedScreenSourceId
          }
        }
      } catch (err) {
        console.error('Ekran yakalama başlatılamadı:', err)
        alert('Ekran yakalama başlatılamadı: ' + err)
        return
      }
    }

    if (editingSourceId) {
      await updateSource(currentEditingSceneId, editingSourceId, {
        name: newSourceName.trim(),
        type: newSourceType,
        properties: finalProps
      })
    } else {
      await addSource(currentEditingSceneId, newSourceName.trim(), newSourceType, finalProps)
    }

    // Reset Form
    setNewSourceName('')
    setShowAddSourceModal(false)
    setEditingSourceId(null)
    setNewSourceProps({
      text: 'Yeni Yazı',
      color: '#ffffff',
      fontSize: 48,
    })
  }

  const handleSourceTypeChange = (type: SourceType) => {
    setNewSourceType(type)
    // Map initial template properties
    switch (type) {
      case 'text':
        setNewSourceProps({ text: 'Yeni Yazı', color: '#ffffff', fontSize: 48 })
        break
      case 'advanced-text':
        setNewSourceProps({ text: 'PRIMErecorder Degrade Kayan Yazı', scrollSpeed: 3, fontSize: 40 })
        break
      case 'image':
        setNewSourceProps({ url: 'https://picsum.photos/1920/1080' })
        break
      case 'image-slideshow':
        setNewSourceProps({
          urls: ['https://picsum.photos/1920/1080?sig=1', 'https://picsum.photos/1920/1080?sig=2'],
          interval: 3000,
        })
        break
      case 'timer':
        setNewSourceProps({ duration: 300, startTime: Date.now() })
        break
      case 'media-file':
        setNewSourceProps({ videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-background-1611-large.mp4' })
        break
      default:
        setNewSourceProps({})
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070708',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      {/* 1. Header Area */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '18px', border: '2px solid rgba(139,92,246,0.9)', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 900, color: 'transparent', WebkitTextStroke: '1.8px #22c55e', textShadow: '0 0 18px rgba(34,197,94,0.25)' }}>PR</span>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
              PRIME<span style={{ color: '#22c55e' }}>recorder</span>
            </h1>
            <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px', opacity: 0.6 }}>v0.1.0 (PRO)</span>
          </div>
        </div>

        {/* Live Badges */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {isStreaming && (
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ef4444', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />
              YAYINDA
            </div>
          )}
          {isRecording && (
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22c55e', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(34, 197, 94, 0.1)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 1s infinite' }} />
              KAYDEDİLİYOR
            </div>
          )}

          {/* Studio Mode Toggle */}
          <button
            onClick={() => setStudioMode(!studioMode)}
            style={{
              background: studioMode ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${studioMode ? '#8b5cf6' : 'rgba(255,255,255,0.06)'}`,
              color: studioMode ? '#a78bfa' : '#fff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {studioMode ? 'STÜDYO MODU AKTİF' : 'STÜDYO MODUNA GEÇ'}
          </button>
        </div>
      </header>

      {/* 2. Compositor Canvas Section */}
      <CanvasViewport onEditSource={handleOpenEditSource} />

      {/* 3. Studio Mode Transition Bar */}
      {studioMode && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          gap: '24px',
          marginBottom: '24px',
          padding: '16px 24px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          boxSizing: 'border-box',
          flexWrap: 'wrap'
        }}>
          {/* Transition Style Selector */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.6, marginRight: '8px' }}>GEÇİŞ TİPİ:</span>
            <button
              onClick={() => setTransitionStyle('fade')}
              style={{
                background: transitionStyle === 'fade' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${transitionStyle === 'fade' ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}`,
                color: transitionStyle === 'fade' ? '#a78bfa' : '#94a3b8',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🎬 SOLMA (FADE)
            </button>
            <button
              onClick={() => setTransitionStyle('cut')}
              style={{
                background: transitionStyle === 'cut' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${transitionStyle === 'cut' ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}`,
                color: transitionStyle === 'cut' ? '#a78bfa' : '#94a3b8',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ⚡ KESME (CUT)
            </button>
          </div>

          {/* Transition Duration input */}
          {transitionStyle === 'fade' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: '20px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, opacity: 0.6 }}>SÜRE (MS):</span>
              <input
                type="number"
                min="50"
                max="5000"
                step="50"
                value={transitionDur}
                onChange={(e) => setTransitionDur(Math.max(50, parseInt(e.target.value) || 0))}
                style={{
                  background: '#070708',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '6px 12px',
                  width: '80px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textAlign: 'center'
                }}
              />
            </div>
          )}

          {/* Trigger Transition Button */}
          <button
            onClick={() => transition(transitionStyle, transitionStyle === 'cut' ? 0 : transitionDur)}
            style={{
              background: 'linear-gradient(to right, #8b5cf6, #22c55e)',
              border: 'none',
              color: '#fff',
              padding: '12px 36px',
              borderRadius: '8px',
              fontWeight: 900,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(139,92,246,0.3)',
              letterSpacing: '0.05em',
              transition: 'all 0.2s ease',
              marginLeft: 'auto'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            YAYINA AKTAR (TRANSITION) ⚡
          </button>
        </div>
      )}

      {/* 4. Bottom Control Deck (Responsive Grid Layout) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        boxSizing: 'border-box'
      }}>
        {/* A. Scenes Panel */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          height: '350px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Sahneler</h3>
            <button
              onClick={() => setShowAddSceneModal(true)}
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Sahne Ekle +
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {scenes.map((scene) => {
              const isSelected = studioMode ? scene.id === previewSceneId : scene.id === activeSceneId
              return (
                <div
                  key={scene.id}
                  onClick={() => studioMode ? selectPreviewScene(scene.id) : selectActiveScene(scene.id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255,255,255,0.01)',
                    border: `1px solid ${isSelected ? '#8b5cf6' : 'rgba(255,255,255,0.04)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontWeight: isSelected ? 700 : 500, color: isSelected ? '#a78bfa' : '#fff' }}>🎬 {scene.name}</span>
                  {scenes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteScene(scene.id)
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
                    >
                      Sil
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* B. Sources Panel */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          height: '350px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>İçerik (Kaynaklar)</h3>
            <button
              onClick={() => setShowAddSourceModal(true)}
              disabled={!currentEditingSceneId}
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                color: '#22c55e',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: currentEditingSceneId ? 1 : 0.5
              }}
            >
              Kaynak Ekle +
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentEditingScene?.sources.map((src) => (
              <div
                key={src.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.01)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{src.name}</span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.5, textTransform: 'uppercase' }}>{src.type}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {/* Up / Down Order Toggles */}
                  <button
                    onClick={() => reorderSource(currentEditingSceneId!, src.id, 'up')}
                    title="Yukarı Taşı (Katmanı Üste Al)"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      color: '#fff',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => reorderSource(currentEditingSceneId!, src.id, 'down')}
                    title="Aşağı Taşı (Katmanı Alta Al)"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: 'none',
                      color: '#fff',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ▼
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleOpenEditSource(src)}
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      color: '#60a5fa',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Düzenle
                  </button>

                  <button
                    onClick={() => updateSource(currentEditingSceneId!, src.id, { enabled: !src.enabled })}
                    style={{
                      background: src.enabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                      border: 'none',
                      color: src.enabled ? '#22c55e' : '#64748b',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    {src.enabled ? 'Açık' : 'Gizli'}
                  </button>
                  <button
                    onClick={() => removeSource(currentEditingSceneId!, src.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: 'none',
                      color: '#ef4444',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}

            {(!currentEditingScene || currentEditingScene.sources.length === 0) && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', opacity: 0.4, fontSize: '0.85rem' }}>
                Henüz kaynak eklenmemiş.
              </div>
            )}
          </div>
        </div>

        {/* C. Virtual Mixer */}
        <MixerPanel />

        {/* D. Studio Control Deck (Large Neon Buttons) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '350px',
          boxSizing: 'border-box'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
            Stüdyo Kontrol Paneli
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {/* Record Trigger Button */}
            <button
              onClick={() => setRecording(!isRecording)}
              style={{
                background: isRecording ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                border: `1px solid ${isRecording ? '#ef4444' : '#22c55e'}`,
                color: isRecording ? '#f87171' : '#4ade80',
                padding: '16px',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isRecording ? '0 0 10px rgba(239, 68, 68, 0.2)' : '0 0 10px rgba(34, 197, 94, 0.1)'
              }}
            >
              {isRecording ? '⏹ KAYDI DURDUR' : '⏺ KAYDI BAŞLAT'}
            </button>

            {/* Stream Trigger Button */}
            <button
              onClick={() => setStreaming(!isStreaming)}
              style={{
                background: isStreaming ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                border: `1px solid ${isStreaming ? '#ef4444' : '#8b5cf6'}`,
                color: isStreaming ? '#f87171' : '#a78bfa',
                padding: '16px',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 800,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isStreaming ? '0 0 10px rgba(239, 68, 68, 0.2)' : '0 0 10px rgba(139, 92, 246, 0.1)'
              }}
            >
              {isStreaming ? '⏹ YAYINI BİTİR' : '📡 YAYINI BAŞLAT'}
            </button>
          </div>

          {/* Advanced settings access */}
          <button
            onClick={onOpenSettings}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#fff',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            ⚙ AYARLARI YAPILANDIR
          </button>
        </div>
      </div>

      {/* Modal 1: Add Scene Overlay */}
      {showAddSceneModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#110d1c', border: '1px solid rgba(139,92,246,0.2)', padding: '30px', borderRadius: '16px', width: '400px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 800 }}>Yeni Sahne Ekle</h3>
            <input
              type="text"
              placeholder="Sahne İsmi (örn: Oyun Sahnesi)"
              value={newSceneName}
              onChange={(e) => setNewSceneName(e.target.value)}
              style={{ width: '100%', background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: '#fff', marginBottom: '20px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddSceneModal(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>İptal</button>
              <button onClick={handleCreateScene} style={{ background: '#22c55e', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add Source Overlay */}
      {showAddSourceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: '#110d1c', border: '1px solid rgba(139,92,246,0.2)', padding: '30px', borderRadius: '16px', width: '460px' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: 800 }}>
              {editingSourceId ? 'Kaynağı Düzenle' : 'Yeni Kaynak Ekle'}
            </h3>

            {/* Input Name */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginBottom: '6px' }}>KAYNAK İSMİ</label>
              <input
                type="text"
                placeholder="Örn: Logo Görseli"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                style={{ width: '100%', background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
              />
            </div>

            {/* Select Source Type */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginBottom: '6px' }}>KAYNAK TİPİ</label>
              <select
                value={newSourceType}
                onChange={(e) => handleSourceTypeChange(e.target.value as SourceType)}
                style={{ width: '100%', background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
              >
                <option value="text">Yazı Ekle (Text)</option>
                <option value="advanced-text">Degrade Kayan Yazı (Ticker)</option>
                <option value="image">Resim Ekle (Image)</option>
                <option value="image-slideshow">Resim Slayt Gösterisi</option>
                <option value="timer">Saatli Sayaç (Countdown)</option>
                <option value="media-file">Video Dosyası (Video)</option>
                <option value="web-view">Tarayıcı Kaynağı (Browser Source)</option>
                <option value="screen-capture">Ekran Yakala (Screen Share)</option>
              </select>
            </div>

            {/* Dynamic Custom Property Forms based on active selected source type */}
            {(newSourceType === 'text' || newSourceType === 'advanced-text') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <input
                  type="text"
                  placeholder={newSourceType === 'text' ? "Görüntülenecek Metin" : "Kayan Metin"}
                  value={newSourceProps.text || ''}
                  onChange={(e) => setNewSourceProps({ ...newSourceProps, text: e.target.value })}
                  style={{ width: '100%', background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                />

                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginBottom: '4px' }}>YAZI TİPİ</label>
                    <select
                      value={newSourceProps.fontFamily || (newSourceType === 'text' ? 'sans-serif' : 'monospace')}
                      onChange={(e) => setNewSourceProps({ ...newSourceProps, fontFamily: e.target.value })}
                      style={{ width: '100%', background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                    >
                      <option value="sans-serif">Sans-Serif (Standard)</option>
                      <option value="monospace">Monospace (Terminal)</option>
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Impact">Impact</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Comic Sans MS">Comic Sans MS</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginBottom: '4px' }}>YAZI STİLİ</label>
                    <select
                      value={newSourceProps.fontStyle || (newSourceType === 'text' ? 'normal' : 'bold')}
                      onChange={(e) => setNewSourceProps({ ...newSourceProps, fontStyle: e.target.value })}
                      style={{ width: '100%', background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                    >
                      <option value="normal">Normal</option>
                      <option value="bold">Kalın (Bold)</option>
                      <option value="italic">İtalik</option>
                      <option value="italic bold">Kalın İtalik</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>BOYUT (PX):</span>
                    <input
                      type="number"
                      min="12"
                      max="200"
                      value={newSourceProps.fontSize || (newSourceType === 'text' ? 48 : 40)}
                      onChange={(e) => setNewSourceProps({ ...newSourceProps, fontSize: parseInt(e.target.value) || 48 })}
                      style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', color: '#fff', width: '80px' }}
                    />
                  </div>

                  {newSourceType === 'text' && (
                    <input
                      type="color"
                      value={newSourceProps.color || '#ffffff'}
                      onChange={(e) => setNewSourceProps({ ...newSourceProps, color: e.target.value })}
                      style={{ width: '60px', height: '40px', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    />
                  )}

                  {newSourceType === 'advanced-text' && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>HIZ:</span>
                      <input
                        type="number"
                        value={newSourceProps.scrollSpeed || 2}
                        onChange={(e) => setNewSourceProps({ ...newSourceProps, scrollSpeed: parseInt(e.target.value) })}
                        style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', color: '#fff', width: '80px' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {newSourceType === 'image' && (
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Mode Selector Tabs */}
                <div style={{ display: 'flex', gap: '6px', background: '#070708', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    type="button"
                    onClick={() => setImageUploadMode('url')}
                    style={{
                      flex: 1,
                      background: imageUploadMode === 'url' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                      border: `1px solid ${imageUploadMode === 'url' ? '#8b5cf6' : 'transparent'}`,
                      color: imageUploadMode === 'url' ? '#a78bfa' : '#64748b',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    🔗 URL İLE EKLE
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUploadMode('file')}
                    style={{
                      flex: 1,
                      background: imageUploadMode === 'file' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                      border: `1px solid ${imageUploadMode === 'file' ? '#8b5cf6' : 'transparent'}`,
                      color: imageUploadMode === 'file' ? '#a78bfa' : '#64748b',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    💻 CİHAZDAN YÜKLE
                  </button>
                </div>

                {/* URL INPUT */}
                {imageUploadMode === 'url' ? (
                  <input
                    type="text"
                    placeholder="Görsel URL'si girin (örn: https://picsum.photos/800)"
                    value={newSourceProps.url || ''}
                    onChange={(e) => setNewSourceProps({ ...newSourceProps, url: e.target.value })}
                    style={{ width: '100%', background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  />
                ) : (
                  /* FILE LOADER */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label
                      htmlFor="image-file-input"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100px',
                        border: '2px dashed rgba(139, 92, 246, 0.3)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: 'rgba(139, 92, 246, 0.02)',
                        transition: 'border 0.2s ease',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)'}
                    >
                      <span style={{ fontSize: '1.2rem' }}>📁</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a78bfa' }}>Görsel Dosyası Seç</span>
                      <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>PNG, JPG, JPEG, GIF, WEBP</span>
                    </label>
                    <input
                      id="image-file-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            const base64Url = event.target?.result as string
                            setNewSourceProps({ ...newSourceProps, url: base64Url })
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />

                    {/* Image Preview Thumbnail */}
                    {newSourceProps.url && newSourceProps.url.startsWith('data:') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '8px' }}>
                        <img
                          src={newSourceProps.url}
                          alt="Önizleme"
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e' }}>Dosya Başarıyla Yüklendi!</span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.4, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            Base64 Verisi Hazır
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {newSourceType === 'screen-capture' && (
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block' }}>YAKALANACAK EKRAN / PENCERE SEÇİN</span>
                {screenSources.length === 0 ? (
                  <div style={{ padding: '16px', background: '#070708', borderRadius: '8px', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                    Ekran listesi yükleniyor...
                  </div>
                ) : (
                  <div style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '10px',
                    padding: '4px',
                    boxSizing: 'border-box'
                  }}>
                    {screenSources.map((src) => {
                      const isSelected = selectedScreenSourceId === src.id
                      return (
                        <div
                          key={src.id}
                          onClick={() => setSelectedScreenSourceId(src.id)}
                          style={{
                            background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255,255,255,0.02)',
                            border: `2px solid ${isSelected ? '#8b5cf6' : 'rgba(255,255,255,0.06)'}`,
                            borderRadius: '8px',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.15s ease',
                            boxSizing: 'border-box'
                          }}
                        >
                          <img
                            src={src.thumbnail}
                            alt={src.name}
                            style={{
                              width: '100%',
                              aspectRatio: '16/10',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              background: '#000'
                            }}
                          />
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: isSelected ? 800 : 500,
                            color: isSelected ? '#a78bfa' : '#94a3b8',
                            textAlign: 'center',
                            width: '100%',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {src.name}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {newSourceType === 'timer' && (
              <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Saniye (Duration):</span>
                <input
                  type="number"
                  value={newSourceProps.duration}
                  onChange={(e) => setNewSourceProps({ ...newSourceProps, duration: parseInt(e.target.value), startTime: Date.now() })}
                  style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', color: '#fff', width: '100px' }}
                />
              </div>
            )}

            {newSourceType === 'media-file' && (
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '6px', background: '#070708', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <button
                    type="button"
                    onClick={() => setVideoUploadMode('url')}
                    style={{ flex: 1, background: videoUploadMode === 'url' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', border: `1px solid ${videoUploadMode === 'url' ? '#8b5cf6' : 'transparent'}`, color: videoUploadMode === 'url' ? '#a78bfa' : '#64748b', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease' }}
                  >
                    🔗 URL İLE EKLE
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoUploadMode('file')}
                    style={{ flex: 1, background: videoUploadMode === 'file' ? 'rgba(139, 92, 246, 0.15)' : 'transparent', border: `1px solid ${videoUploadMode === 'file' ? '#8b5cf6' : 'transparent'}`, color: videoUploadMode === 'file' ? '#a78bfa' : '#64748b', padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease' }}
                  >
                    💻 CİHAZDAN YÜKLE
                  </button>
                </div>

                {videoUploadMode === 'url' ? (
                  <input
                    type="text"
                    placeholder="Video Dosyası URL (.mp4)"
                    value={newSourceProps.videoUrl || ''}
                    onChange={(e) => setNewSourceProps({ ...newSourceProps, videoUrl: e.target.value })}
                    style={{ width: '100%', background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={handleSelectVideoFile}
                      style={{ height: '80px', border: '2px dashed rgba(139, 92, 246, 0.3)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(139, 92, 246, 0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}
                    >
                      <span style={{ fontSize: '1.2rem', marginBottom: '4px' }}>🎬</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Bilgisayardan Video Seç</span>
                    </button>
                    {newSourceProps.videoUrl && newSourceProps.videoUrl.startsWith('local-video://') && (
                      <span style={{ fontSize: '0.7rem', color: '#22c55e', textAlign: 'center' }}>✓ Yerel video dosyası eklendi</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {newSourceType === 'web-view' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginBottom: '6px' }}>TARAYICI URL'Sİ</label>
                  <input
                    type="text"
                    placeholder="Örn: https://obsproject.com"
                    value={newSourceProps.url || ''}
                    onChange={(e) => setNewSourceProps({ ...newSourceProps, url: e.target.value })}
                    style={{ width: '100%', background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', opacity: 0.6, display: 'block', marginBottom: '6px' }}>ÖZEL CSS ENJEKSİYONU</label>
                  <textarea
                    placeholder="Örn: body { background: transparent !important; }"
                    value={newSourceProps.customCss || ''}
                    onChange={(e) => setNewSourceProps({ ...newSourceProps, customCss: e.target.value })}
                    style={{ width: '100%', height: '80px', background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff', boxSizing: 'border-box', fontFamily: 'monospace', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setShowAddSourceModal(false); setEditingSourceId(null); setNewSourceName(''); }} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>İptal</button>
              <button onClick={handleAddSource} style={{ background: '#22c55e', border: 'none', color: '#fff', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>
                {editingSourceId ? 'Değişiklikleri Kaydet' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
