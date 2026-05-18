import { useEffect, useRef, useState } from 'react'
import { useStudioStore } from '../store/useStudioStore'
import { Scene, Source } from '../../shared/types/scene.types'

interface AssetCache {
  videos: Record<string, HTMLVideoElement>
  images: Record<string, HTMLImageElement>
}

export default function CanvasViewport({ onEditSource }: { onEditSource?: (source: Source) => void } = {}) {
  const {
    scenes,
    activeSceneId,
    previewSceneId,
    studioMode,
    updateSourceTransform,
    isRecording,
    isStreaming,
    transitionTrigger,
  } = useStudioStore()

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Transition state managers for cross-fade animations
  const lastTransitionTimeRef = useRef<number>(0)
  const transitionRef = useRef<{
    active: boolean
    fromScene: Scene | null
    toScene: Scene | null
    startTime: number
    duration: number
    type: 'cut' | 'fade' | 'slide'
  }>({
    active: false,
    fromScene: null,
    toScene: null,
    startTime: 0,
    duration: 0,
    type: 'fade'
  })

  // Asset cache to prevent recreating video/image nodes every frame
  const cacheRef = useRef<AssetCache>({ videos: {}, images: {} })

  // Active Scene States
  const activeScene = scenes.find((s) => s.id === activeSceneId)
  const previewScene = scenes.find((s) => s.id === previewSceneId)

  // Drag & Resize Interactive States
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragStartPos = useRef({ x: 0, y: 0 })
  const sourceStartTransform = useRef({ x: 0, y: 0, width: 0, height: 0 })

  // Animation frame ticks
  const animationFrameId = useRef<number | null>(null)

  // Text ticker positions
  const tickerOffsets = useRef<Record<string, number>>({})

  // Image Slideshow indexes
  const slideshowStates = useRef<Record<string, { index: number; opacity: number; lastChange: number }>>({})

  // Master Canvas Dimensions
  const canvasWidth = 1920
  const canvasHeight = 1080

  // MediaRecorder for pushing canvas stream to FFmpeg Main process
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    const handleStreamPiping = async () => {
      if ((isRecording || isStreaming) && liveCanvasRef.current) {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          return
        }

        console.log('[Media Streamer] Başlatılıyor...')
        try {
          const fps = 30
          const canvasStream = liveCanvasRef.current.captureStream(fps)

          try {
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            micStream.getAudioTracks().forEach((track) => {
              canvasStream.addTrack(track)
            })
          } catch (e) {
            console.log('[Media Streamer] Ses kanalı eklenemedi:', e)
          }

          let options = { mimeType: 'video/webm; codecs=vp9', videoBitsPerSecond: 4500000 }
          if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = { mimeType: 'video/webm; codecs=vp8', videoBitsPerSecond: 4500000 }
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
              options = { mimeType: 'video/webm', videoBitsPerSecond: 4500000 }
            }
          }

          const recorder = new MediaRecorder(canvasStream, options)

          recorder.ondataavailable = async (e) => {
            if (e.data && e.data.size > 0) {
              const arrayBuffer = await e.data.arrayBuffer()
              if ((window as any).api?.writeStreamChunk) {
                await (window as any).api.writeStreamChunk(arrayBuffer)
              }
            }
          }

          recorder.onstop = async () => {
            console.log('[Media Streamer] MediaRecorder durduruldu, sunucu/yerel FFmpeg süreci kapatılıyor...')
            try {
              if ((window as any).api?.stopRecord) {
                await (window as any).api.stopRecord()
              }
              if ((window as any).api?.stopStream) {
                await (window as any).api.stopStream()
              }
            } catch (e) {
              console.error('[Media Streamer] Süreç sonlandırma hatası:', e)
            }
          }

          recorder.start(1000)
          mediaRecorderRef.current = recorder
        } catch (err) {
          console.error('[Media Streamer] Hata oluştu:', err)
        }
      } else {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          console.log('[Media Streamer] Sonlandırılıyor...')
          mediaRecorderRef.current.stop()
          mediaRecorderRef.current = null
        }
      }
    }

    handleStreamPiping()
  }, [isRecording, isStreaming])

  useEffect(() => {
    if (transitionTrigger && transitionTrigger.timestamp !== lastTransitionTimeRef.current) {
      lastTransitionTimeRef.current = transitionTrigger.timestamp
      if (transitionTrigger.type === 'fade') {
        transitionRef.current = {
          active: true,
          fromScene: scenes.find((s) => s.id === transitionTrigger.fromSceneId) || null,
          toScene: scenes.find((s) => s.id === activeSceneId) || null,
          startTime: transitionTrigger.timestamp,
          duration: transitionTrigger.duration,
          type: 'fade',
        }
      } else {
        transitionRef.current.active = false
      }
    }
  }, [transitionTrigger, scenes, activeSceneId])

  useEffect(() => {
    // Canvas compositor render loop
    const render = () => {
      if (previewCanvasRef.current) {
        renderSceneToCanvas(previewCanvasRef.current, previewScene, true, 1)
      }
      if (liveCanvasRef.current) {
        const trans = transitionRef.current
        if (trans.active) {
          const elapsed = Date.now() - trans.startTime
          const progress = Math.min(1, elapsed / trans.duration)

          if (progress >= 1) {
            trans.active = false
            renderSceneToCanvas(liveCanvasRef.current, activeScene, true, 1)
          } else {
            // Perfect cross-fade transition
            const ctx = liveCanvasRef.current.getContext('2d')
            if (ctx) {
              // 1. Clear background once
              ctx.fillStyle = '#070708'
              ctx.fillRect(0, 0, canvasWidth, canvasHeight)

              // 2. Draw old scene sources with fading opacity multiplier
              if (trans.fromScene) {
                renderSceneToCanvas(liveCanvasRef.current, trans.fromScene, false, 1 - progress)
              }
              // 3. Draw new scene sources with rising opacity multiplier
              if (trans.toScene) {
                renderSceneToCanvas(liveCanvasRef.current, trans.toScene, false, progress)
              }
            }
          }
        } else {
          renderSceneToCanvas(liveCanvasRef.current, activeScene, true, 1)
        }
      }
      animationFrameId.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
    }
  }, [scenes, activeSceneId, previewSceneId, studioMode])

  // Core Compositor Renderer
  const renderSceneToCanvas = (canvas: HTMLCanvasElement, scene?: Scene, clear: boolean = true, opacityMultiplier: number = 1) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear Tuval
    if (clear) {
      ctx.fillStyle = '#070708'
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    }

    if (!scene) {
      if (clear) {
        // Empty Scene state
        ctx.fillStyle = '#64748b'
        ctx.font = 'bold 36px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('HİÇBİR SAHNE BULUNAMADI', canvasWidth / 2, canvasHeight / 2)
      }
      return
    }

    // Render each source sequentially (reverse order so index 0 is rendered last/on top)
    const reversedRenderSources = [...scene.sources].reverse()
    reversedRenderSources.forEach((source) => {
      if (!source.enabled) return

      const tf = source.transform
      ctx.save()

      // Apply transformations
      ctx.translate(tf.x + tf.width / 2, tf.y + tf.height / 2)
      ctx.rotate((tf.rotation * Math.PI) / 180)
      ctx.scale(tf.scaleX, tf.scaleY)
      ctx.globalAlpha = tf.opacity * opacityMultiplier

      // Render based on source type
      switch (source.type) {
        case 'image':
          renderImage(ctx, source, tf.width, tf.height)
          break
        case 'image-slideshow':
          renderSlideshow(ctx, source, tf.width, tf.height)
          break
        case 'text':
          renderText(ctx, source, tf.width, tf.height)
          break
        case 'advanced-text':
          renderAdvancedText(ctx, source, tf.width, tf.height)
          break
        case 'timer':
          renderTimer(ctx, source, tf.width, tf.height)
          break
        case 'media-file':
        case 'screen-capture':
        case 'window-capture':
          renderVideo(ctx, source, tf.width, tf.height)
          break
        case 'web-view':
          renderWebViewPlaceholder(ctx, source, tf.width, tf.height)
          break
        default:
          // Placeholder fallback
          ctx.fillStyle = 'rgba(139, 92, 246, 0.2)'
          ctx.strokeStyle = '#8b5cf6'
          ctx.lineWidth = 4
          ctx.fillRect(-tf.width / 2, -tf.height / 2, tf.width, tf.height)
          ctx.strokeRect(-tf.width / 2, -tf.height / 2, tf.width, tf.height)
          ctx.fillStyle = '#fff'
          ctx.font = '24px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(source.name, 0, 0)
      }

      ctx.restore()
    })

    // If a source is selected on the Preview Canvas, draw neon editing boundaries & handles
    if (canvas === previewCanvasRef.current && selectedSourceId && previewScene) {
      const selectedSource = previewScene.sources.find((s) => s.id === selectedSourceId)
      if (selectedSource) {
        drawEditingBoundaries(ctx, selectedSource)
      }
    }
  }

  // Render Image
  const renderImage = (ctx: CanvasRenderingContext2D, source: Source, w: number, h: number) => {
    const url = (source.properties.url as string) || ''
    if (!url) return

    let img = cacheRef.current.images[source.id]
    if (!img) {
      img = new Image()
      img.src = url
      cacheRef.current.images[source.id] = img
    }

    if (img.complete) {
      ctx.drawImage(img, -w / 2, -h / 2, w, h)
    }
  }

  // Render Slideshow
  const renderSlideshow = (ctx: CanvasRenderingContext2D, source: Source, w: number, h: number) => {
    const urls = (source.properties.urls as string[]) || []
    if (urls.length === 0) return

    let state = slideshowStates.current[source.id]
    if (!state) {
      state = { index: 0, opacity: 1, lastChange: Date.now() }
      slideshowStates.current[source.id] = state
    }

    const interval = (source.properties.interval as number) || 4000
    const now = Date.now()

    if (now - state.lastChange > interval) {
      state.index = (state.index + 1) % urls.length
      state.lastChange = now
    }

    const url = urls[state.index]
    let img = cacheRef.current.images[`${source.id}_${state.index}`]
    if (!img) {
      img = new Image()
      img.src = url
      cacheRef.current.images[`${source.id}_${state.index}`] = img
    }

    if (img.complete) {
      ctx.drawImage(img, -w / 2, -h / 2, w, h)
    }
  }

  // Render Text
  const renderText = (ctx: CanvasRenderingContext2D, source: Source, w: number, h: number) => {
    const text = (source.properties.text as string) || 'PRIMErecorder'
    const color = (source.properties.color as string) || '#ffffff'
    const size = (source.properties.fontSize as number) || 48
    const font = (source.properties.fontFamily as string) || 'sans-serif'
    const style = (source.properties.fontStyle as string) || 'normal'

    ctx.fillStyle = color
    ctx.font = `${style} ${size}px ${font}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 0, 0)
  }

  // Render Advanced Text (with gradients, shadows, and scrolling horizontal marquee ticker)
  const renderAdvancedText = (ctx: CanvasRenderingContext2D, source: Source, w: number, h: number) => {
    const text = (source.properties.text as string) || 'PRIMErecorder Profesyonel Canlı Yayın Motoru'
    const isTicker = !!source.properties.scrollSpeed
    const speed = (source.properties.scrollSpeed as number) || 2
    const size = (source.properties.fontSize as number) || 40
    const font = (source.properties.fontFamily as string) || 'monospace'
    const style = (source.properties.fontStyle as string) || 'bold'

    ctx.font = `${style} ${size}px ${font}`
    ctx.textBaseline = 'middle'

    // Multi-color dynamic gradient setup
    const gradient = ctx.createLinearGradient(-w / 2, 0, w / 2, 0)
    gradient.addColorStop(0, '#a78bfa') // Violet
    gradient.addColorStop(0.5, '#22c55e') // Toxic Green
    gradient.addColorStop(1, '#a78bfa')
    ctx.fillStyle = gradient

    // Professional glow shadow
    ctx.shadowColor = 'rgba(139, 92, 246, 0.4)'
    ctx.shadowBlur = 10

    if (isTicker) {
      let offset = tickerOffsets.current[source.id] || 0
      offset -= speed
      const textWidth = ctx.measureText(text).width

      if (offset < -textWidth - w / 2) {
        offset = w / 2
      }
      tickerOffsets.current[source.id] = offset
      ctx.textAlign = 'left'
      ctx.fillText(text, offset, 0)
    } else {
      ctx.textAlign = 'center'
      ctx.fillText(text, 0, 0)
    }
  }

  // Render Timer (Countdown)
  const renderTimer = (ctx: CanvasRenderingContext2D, source: Source, w: number, h: number) => {
    const duration = (source.properties.duration as number) || 300 // default 5 minutes
    const start = (source.properties.startTime as number) || Date.now()
    const elapsed = Math.floor((Date.now() - start) / 1000)
    const remaining = Math.max(0, duration - elapsed)

    const mins = Math.floor(remaining / 60).toString().padStart(2, '0')
    const secs = (remaining % 60).toString().padStart(2, '0')
    const timeStr = `${mins}:${secs}`

    ctx.fillStyle = '#22c55e'
    ctx.font = `bold 72px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(timeStr, 0, 0)
  }

  // Render Video / Captures (Screen/Window/Camera)
  const renderVideo = (ctx: CanvasRenderingContext2D, source: Source, w: number, h: number) => {
    const stream = source.properties.stream
    const videoUrl = source.properties.videoUrl as string | null

    const isValidStream = stream && stream instanceof MediaStream

    if (!isValidStream && !videoUrl) {
      // Draw a beautiful glassmorphic streaming placeholder
      ctx.fillStyle = 'rgba(124, 58, 237, 0.15)' // Violet glow
      ctx.fillRect(-w / 2, -h / 2, w, h)
      
      // Dashed style frame borders
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)'
      ctx.lineWidth = 3
      ctx.setLineDash([10, 10])
      ctx.strokeRect(-w / 2, -h / 2, w, h)
      ctx.setLineDash([]) // Reset dash

      ctx.fillStyle = '#c084fc'
      ctx.font = 'bold 22px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(source.name, 0, -10)
      
      ctx.fillStyle = '#a78bfa'
      ctx.font = '14px sans-serif'
      ctx.fillText('(Ekran/Kamera seçmek için çift tıklayın)', 0, 20)
      return
    }

    let video = cacheRef.current.videos[source.id]

    if (!video) {
      video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.loop = true

      if (isValidStream) {
        video.srcObject = stream as MediaStream
      } else if (videoUrl) {
        video.src = videoUrl
      }

      video.play().catch((e) => console.log('Video oynatılamadı:', e))
      cacheRef.current.videos[source.id] = video
    }

    // Draw active running video frames
    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      ctx.drawImage(video, -w / 2, -h / 2, w, h)
    } else {
      // Loading state
      ctx.fillStyle = 'rgba(255,255,255,0.05)'
      ctx.fillRect(-w / 2, -h / 2, w, h)
      ctx.fillStyle = '#64748b'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Medya Yükleniyor...', 0, 0)
    }
  }

  // Web View placeholder in Compositor
  const renderWebViewPlaceholder = (ctx: CanvasRenderingContext2D, source: Source, w: number, h: number) => {
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)'
    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 3
    ctx.fillRect(-w / 2, -h / 2, w, h)
    ctx.strokeRect(-w / 2, -h / 2, w, h)
    ctx.fillStyle = '#4ade80'
    ctx.font = 'bold 20px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('🌐 BROWSER SOURCE ACTIVE', 0, -10)
    ctx.fillStyle = '#fff'
    ctx.font = '14px sans-serif'
    ctx.fillText((source.properties.url as string) || 'N/A', 0, 20)
  }

  // Draw editing handles
  const drawEditingBoundaries = (ctx: CanvasRenderingContext2D, source: Source) => {
    const tf = source.transform
    ctx.save()
    ctx.translate(tf.x + tf.width / 2, tf.y + tf.height / 2)
    ctx.rotate((tf.rotation * Math.PI) / 180)

    ctx.strokeStyle = '#22c55e'
    ctx.lineWidth = 2
    ctx.strokeRect(-tf.width / 2, -tf.height / 2, tf.width, tf.height)

    // Corner handle nodes
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = '#15803d'
    ctx.lineWidth = 2

    const size = 8
    const corners = [
      { x: -tf.width / 2, y: -tf.height / 2 }, // Top-Left
      { x: tf.width / 2, y: -tf.height / 2 },  // Top-Right
      { x: -tf.width / 2, y: tf.height / 2 },  // Bottom-Left
      { x: tf.width / 2, y: tf.height / 2 },   // Bottom-Right
    ]

    corners.forEach((c) => {
      ctx.fillRect(c.x - size / 2, c.y - size / 2, size, size)
      ctx.strokeRect(c.x - size / 2, c.y - size / 2, size, size)
    })

    ctx.restore()
  }

  // Click & Resize hit tests
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!previewCanvasRef.current || !previewScene) return

    const rect = previewCanvasRef.current.getBoundingClientRect()
    // Calculate click coordinates mapped relative to the 1920x1080 base compositor dimensions
    const scaleX = canvasWidth / rect.width
    const scaleY = canvasHeight / rect.height
    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    // Search sources from top to bottom (index 0 is checked first since it renders on top)
    const hitSources = previewScene.sources
    let hitSourceId: string | null = null
    let resizeClicked = false

    for (const src of hitSources) {
      if (!src.enabled) continue
      const tf = src.transform

      // Check Corner Resize Click (Bottom Right corner)
      const brX = tf.x + tf.width
      const brY = tf.y + tf.height
      const distToBR = Math.hypot(clickX - brX, clickY - brY)

      if (distToBR < 20) {
        hitSourceId = src.id
        resizeClicked = true
        break
      }

      // Check Inside Drag Click
      if (clickX >= tf.x && clickX <= tf.x + tf.width && clickY >= tf.y && clickY <= tf.y + tf.height) {
        hitSourceId = src.id
        break
      }
    }

    setSelectedSourceId(hitSourceId)

    if (hitSourceId) {
      const src = previewScene.sources.find((s) => s.id === hitSourceId)!
      dragStartPos.current = { x: clickX, y: clickY }
      sourceStartTransform.current = {
        x: src.transform.x,
        y: src.transform.y,
        width: src.transform.width,
        height: src.transform.height,
      }

      if (resizeClicked) {
        setIsResizing(true)
      } else {
        setIsDragging(true)
      }
    }
  }

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!previewCanvasRef.current || !previewScene || !onEditSource) return

    const rect = previewCanvasRef.current.getBoundingClientRect()
    const scaleX = canvasWidth / rect.width
    const scaleY = canvasHeight / rect.height
    const clickX = (e.clientX - rect.left) * scaleX
    const clickY = (e.clientY - rect.top) * scaleY

    for (const src of previewScene.sources) {
      if (!src.enabled) continue
      const tf = src.transform

      if (clickX >= tf.x && clickX <= tf.x + tf.width && clickY >= tf.y && clickY <= tf.y + tf.height) {
        onEditSource(src)
        break
      }
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!previewCanvasRef.current || !selectedSourceId || !previewScene) return

    const rect = previewCanvasRef.current.getBoundingClientRect()
    const scaleX = canvasWidth / rect.width
    const scaleY = canvasHeight / rect.height
    const currentX = (e.clientX - rect.left) * scaleX
    const currentY = (e.clientY - rect.top) * scaleY

    const dx = currentX - dragStartPos.current.x
    const dy = currentY - dragStartPos.current.y

    if (isDragging) {
      updateSourceTransform(previewSceneId!, selectedSourceId, {
        x: Math.round(sourceStartTransform.current.x + dx),
        y: Math.round(sourceStartTransform.current.y + dy),
      })
    } else if (isResizing) {
      updateSourceTransform(previewSceneId!, selectedSourceId, {
        width: Math.max(20, Math.round(sourceStartTransform.current.width + dx)),
        height: Math.max(20, Math.round(sourceStartTransform.current.height + dy)),
      })
    }
  }

  const handleCanvasMouseUpOrLeave = () => {
    setIsDragging(false)
    setIsResizing(false)
  }

  const renderIframeOverlay = (source: Source, isPreview: boolean) => {
    const tf = source.transform
    const xPercent = (tf.x / canvasWidth) * 100
    const yPercent = (tf.y / canvasHeight) * 100
    const wPercent = (tf.width / canvasWidth) * 100
    const hPercent = (tf.height / canvasHeight) * 100
    
    return (
      <iframe
        key={`${isPreview ? 'prev' : 'live'}-${source.id}`}
        src={(source.properties.url as string) || ''}
        onLoad={(e) => {
          const iframe = e.currentTarget
          const customCss = source.properties.customCss as string
          if (customCss && iframe.contentWindow?.document) {
            try {
              const styleTag = iframe.contentWindow.document.createElement('style')
              styleTag.innerHTML = customCss
              iframe.contentWindow.document.head.appendChild(styleTag)
            } catch (err) {
              console.warn('CSS Injection Blocked (Cross-Origin)', err)
            }
          }
        }}
        style={{
          position: 'absolute',
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          width: `${wPercent}%`,
          height: `${hPercent}%`,
          transform: `rotate(${tf.rotation}deg)`,
          opacity: tf.opacity,
          border: 'none',
          pointerEvents: isPreview ? 'none' : 'auto',
          zIndex: 10
        }}
      />
    )
  }

  return (
    <div style={{
      width: '100%',
      display: 'grid',
      gridTemplateColumns: studioMode ? '1fr 1fr' : '1fr',
      gap: '24px',
      marginBottom: '24px',
      boxSizing: 'border-box'
    }}>
      {/* 1. Preview Screen (Studio Mode Edit Area) */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a78bfa', letterSpacing: '0.05em' }}>◀ ÖNİZLEME (PREVIEW)</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Düzenle, Çek ve Bırak</span>
        </div>
        <div style={{
          position: 'relative',
          maxWidth: '100%',
          maxHeight: '40vh',
          aspectRatio: '16/9',
          borderRadius: '6px',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          display: 'flex'
        }}>
          <canvas
            ref={previewCanvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onMouseDown={handleCanvasMouseDown}
            onDoubleClick={handleCanvasDoubleClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUpOrLeave}
            onMouseLeave={handleCanvasMouseUpOrLeave}
            style={{
              width: '100%',
              height: '100%',
              background: '#000',
              cursor: isDragging ? 'grabbing' : isResizing ? 'se-resize' : 'default',
            }}
          />
          {previewScene && previewScene.sources.filter(s => s.type === 'web-view' && s.enabled).map(source => renderIframeOverlay(source, true))}
        </div>
      </div>
 
      {/* 2. Program Screen (Active Live Output) */}
      {studioMode && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444', letterSpacing: '0.05em' }}>● YAYIN / PROGRAM (LIVE)</span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isRecording && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite' }} />}
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {isRecording && isStreaming ? 'KAYDEDİLİYOR + YAYINDA' : isRecording ? 'KAYDEDİLİYOR' : isStreaming ? 'YAYINDA' : 'Çevrimdışı'}
              </span>
            </div>
          </div>
          <div style={{
            position: 'relative',
            maxWidth: '100%',
            maxHeight: '40vh',
            aspectRatio: '16/9',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            border: isRecording || isStreaming ? '1.5px solid #ef4444' : 'none',
            display: 'flex'
          }}>
            <canvas
              ref={liveCanvasRef}
              width={canvasWidth}
              height={canvasHeight}
              style={{
                width: '100%',
                height: '100%',
                background: '#000'
              }}
            />
            {activeScene && activeScene.sources.filter(s => s.type === 'web-view' && s.enabled).map(source => renderIframeOverlay(source, false))}
          </div>
        </div>
      )}
    </div>
  )
}
