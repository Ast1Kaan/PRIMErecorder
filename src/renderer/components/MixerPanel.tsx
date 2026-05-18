import { useEffect, useRef, useState } from 'react'
import { useStudioStore } from '../store/useStudioStore'

export default function MixerPanel() {
  const { settings, updateSettings } = useStudioStore()

  // Volume states (0-100) mapped to global persistent settings
  const masterVolume = settings?.audio?.masterVolume ?? 80
  const micVolume = settings?.audio?.microphoneVolume ?? 70
  const desktopVolume = settings?.audio?.desktopVolume ?? 60

  const setMasterVolume = (val: number) => {
    if (settings?.audio) {
      updateSettings('audio', { ...settings.audio, masterVolume: val })
    }
  }

  const setMicVolume = (val: number) => {
    if (settings?.audio) {
      updateSettings('audio', { ...settings.audio, microphoneVolume: val })
    }
  }

  const setDesktopVolume = (val: number) => {
    if (settings?.audio) {
      updateSettings('audio', { ...settings.audio, desktopVolume: val })
    }
  }

  // Mute states
  const [isMasterMuted, setIsMasterMuted] = useState(false)
  const [isMicMuted, setIsMicMuted] = useState(false)
  const [isDesktopMuted, setIsDesktopMuted] = useState(false)

  // Decibel levels state (0 to 100 representing meter percentage)
  const [masterLevel, setMasterLevel] = useState(0)
  const [micLevel, setMicLevel] = useState(0)
  const [desktopLevel, setDesktopLevel] = useState(0)

  const animationFrameId = useRef<number | null>(null)

  // Audio Context references for actual hardware hooks
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => {
    // Attempt to hook up actual microphone Analyser node
    const setupAudioAnalyser = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioContextClass()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)

        audioCtxRef.current = ctx
        analyserRef.current = analyser
      } catch (err) {
        console.log('[Mixer] Gerçek mikrofon analizörü bağlanamadı, simülasyon aktif.', err)
      }
    }

    setupAudioAnalyser()

    // Bouncing volume levels loop
    const updateVULevels = () => {
      if (analyserRef.current) {
        // Read actual hardware microphone volumes
        const bufferLength = analyserRef.current.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyserRef.current.getByteFrequencyData(dataArray)

        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const avg = sum / bufferLength
        // Convert to percentage
        const level = isMicMuted ? 0 : Math.min(100, Math.round((avg / 128) * 100 * (micVolume / 100)))
        setMicLevel(level)

        // Mock desktop and master based on active inputs
        const mockDesktop = isDesktopMuted ? 0 : Math.max(0, Math.round((Math.sin(Date.now() / 200) * 15 + 40) * (desktopVolume / 100)))
        setDesktopLevel(mockDesktop)

        const finalMaster = isMasterMuted ? 0 : Math.max(0, Math.round(((level + mockDesktop) / 2) * (masterVolume / 100)))
        setMasterLevel(finalMaster)
      } else {
        // Simulative VU meter bouncing for both Desktop and Web
        const time = Date.now()
        const mockMic = isMicMuted ? 0 : Math.max(0, Math.round((Math.sin(time / 150) * 20 + Math.cos(time / 400) * 15 + 50) * (micVolume / 100)))
        const mockDesktop = isDesktopMuted ? 0 : Math.max(0, Math.round((Math.cos(time / 200) * 25 + Math.sin(time / 600) * 10 + 45) * (desktopVolume / 100)))
        const mockMaster = isMasterMuted ? 0 : Math.max(0, Math.round(((mockMic + mockDesktop) / 2) * (masterVolume / 100)))

        setMicLevel(mockMic)
        setDesktopLevel(mockDesktop)
        setMasterLevel(mockMaster)
      }

      animationFrameId.current = requestAnimationFrame(updateVULevels)
    }

    updateVULevels()

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current)
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
      }
    }
  }, [micVolume, desktopVolume, masterVolume, isMicMuted, isDesktopMuted, isMasterMuted])

  // Custom function to render a VU meter progress bar
  const renderVUMeter = (level: number) => {
    const greenWidth = Math.min(level, 60)
    const yellowWidth = Math.max(0, Math.min(level - 60, 25))
    const redWidth = Math.max(0, level - 85)

    return (
      <div style={{
        width: '100%',
        height: '8px',
        background: '#0c0a0f',
        borderRadius: '4px',
        overflow: 'hidden',
        display: 'flex',
        border: '1px solid rgba(255,255,255,0.04)'
      }}>
        {/* Green Band (Safe / Low volume) */}
        <div style={{
          width: `${greenWidth}%`,
          height: '100%',
          background: '#22c55e',
          boxShadow: '0 0 6px #22c55e'
        }} />
        {/* Yellow Band (Mid Range) */}
        <div style={{
          width: `${yellowWidth}%`,
          height: '100%',
          background: '#eab308',
          boxShadow: '0 0 6px #eab308'
        }} />
        {/* Red Band (Peak Danger) */}
        <div style={{
          width: `${redWidth}%`,
          height: '100%',
          background: '#ef4444',
          boxShadow: '0 0 6px #ef4444',
          animation: redWidth > 0 ? 'pulse 0.2s infinite' : 'none'
        }} />
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.02)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: '16px',
      padding: '24px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      height: '100%'
    }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f1f5f9', letterSpacing: '-0.02em', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
        Sanal Audio Mikser ve Yönlendirme
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 1. Master Volume Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: '#a78bfa' }}>🎛️ ANA SES (MASTER)</span>
            <span style={{ opacity: 0.6 }}>{isMasterMuted ? 'Muted' : `${masterVolume}%`}</span>
          </div>
          {renderVUMeter(masterLevel)}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setIsMasterMuted(!isMasterMuted)}
              style={{
                background: isMasterMuted ? '#ef4444' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              {isMasterMuted ? 'SES AÇ' : 'SUSTUR'}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseInt(e.target.value))}
              disabled={isMasterMuted}
              style={{ flex: 1, height: '4px', accentColor: '#a78bfa', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* 2. Desktop Audio Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: '#f1f5f9' }}>🔊 MASAÜSTÜ SESİ</span>
            <span style={{ opacity: 0.6 }}>{isDesktopMuted ? 'Muted' : `${desktopVolume}%`}</span>
          </div>
          {renderVUMeter(desktopLevel)}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setIsDesktopMuted(!isDesktopMuted)}
              style={{
                background: isDesktopMuted ? '#ef4444' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              {isDesktopMuted ? 'SES AÇ' : 'SUSTUR'}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={desktopVolume}
              onChange={(e) => setDesktopVolume(parseInt(e.target.value))}
              disabled={isDesktopMuted}
              style={{ flex: 1, height: '4px', accentColor: '#22c55e', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* 3. Microphone Device Audio Control */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: '#22c55e' }}>🎤 MİKROFON SESİ</span>
            <span style={{ opacity: 0.6 }}>{isMicMuted ? 'Muted' : `${micVolume}%`}</span>
          </div>
          {renderVUMeter(micLevel)}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setIsMicMuted(!isMicMuted)}
              style={{
                background: isMicMuted ? '#ef4444' : 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                color: '#fff'
              }}
            >
              {isMicMuted ? 'SES AÇ' : 'SUSTUR'}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={micVolume}
              onChange={(e) => setMicVolume(parseInt(e.target.value))}
              disabled={isMicMuted}
              style={{ flex: 1, height: '4px', accentColor: '#22c55e', cursor: 'pointer' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
