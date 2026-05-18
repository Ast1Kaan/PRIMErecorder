











































import { useState, useEffect } from 'react'
import { useStudioStore } from './store/useStudioStore'
import SplashCalibrator from './components/SplashCalibrator'
import StudioLayout from './components/StudioLayout'
import SettingsModal from './components/SettingsModal'
import SetupWizard from './components/SetupWizard'

export default function App() {
  const {
    loadSettings,
    loadScenes,
    isRecording,
    setRecording,
    settings,
  } = useStudioStore()

  const [loading, setLoading] = useState(true)
  const [splashActive, setSplashActive] = useState(true)
  const [splashProgress, setSplashProgress] = useState(0)
  const [showSetupWizard, setShowSetupWizard] = useState(false)

  // Screen routing states
  const [screen, setScreen] = useState<'splash' | 'calibrator' | 'studio'>('splash')
  const [showSettings, setShowSettings] = useState(false)

  // Pre-load default settings and scenes
  useEffect(() => {
    const initialize = async () => {
      try {
        await loadSettings()
        await loadScenes()
      } catch (error) {
        console.error('[App] Başlangıç yüklemesi sırasında hata oluştu:', error)
      } finally {
        setLoading(false)
      }
    }
    initialize()
  }, [])

  // Splash Screen 4-Second Progress loader
  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        setSplashProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval)
            setTimeout(() => {
              setSplashActive(false)
              setScreen('calibrator') // transitions to deep hardware calibrator first!
            }, 300)
            return 100
          }
          return prev + 2.5
        })
      }, 100)
      return () => clearInterval(interval)
    }
  }, [loading])

  // Register Main Process Global Keyboard Hotkey listeners
  useEffect(() => {
    if ((window as any).api?.onStartRecordHotkey) {
      ;(window as any).api.onStartRecordHotkey(() => {
        console.log('[App Hotkey] Global Kayıt Başlat algılandı!')
        setRecording(true)
      })
    }
    if ((window as any).api?.onStopRecordHotkey) {
      ;(window as any).api.onStopRecordHotkey(() => {
        console.log('[App Hotkey] Global Kayıt Durdur algılandı!')
        setRecording(false)
      })
    }
  }, [])

  useEffect(() => {
    if (!loading && settings) {
      const savedComplete = localStorage.getItem('PRIME_SETUP_COMPLETED') === 'true'
      if (!savedComplete && settings.general?.setupCompleted !== true) {
        setShowSetupWizard(true)
      }
    }
  }, [loading, settings])

  // 1. Loading Splash state
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#070708', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', color: '#fff' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em', color: '#8b5cf6', margin: 0 }}>PRIME</h1>
          <p style={{ opacity: 0.5, fontSize: '0.9rem', marginTop: '10px' }}>Donanım Katmanları Hazırlanıyor...</p>
        </div>
      </div>
    )
  }

  if (showSetupWizard && settings) {
    return (
      <SetupWizard onComplete={() => {
        localStorage.setItem('PRIME_SETUP_COMPLETED', 'true')
        setShowSetupWizard(false)
      }} />
    )
  }

  // 2. Welcome Splash Screen (4 Seconds fills)
  if (splashActive) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #070708 0%, #110d1c 100%)',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Glowing Background Ambience */}
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.14)', filter: 'blur(80px)', top: '15%', left: '10%' }} />
        <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.08)', filter: 'blur(80px)', bottom: '15%', right: '10%' }} />

        <div style={{ zIndex: 10, textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
          <h1 style={{
            fontSize: '4.5rem',
            fontWeight: 900,
            margin: 0,
            letterSpacing: '-0.06em',
            background: 'linear-gradient(to right, #a78bfa, #22c55e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.35))'
          }}>
            PRIMErecorder
          </h1>
          <p style={{
            fontSize: '1.2rem',
            opacity: 0.8,
            fontWeight: 400,
            marginTop: '12px',
            color: '#cbd5e1',
            letterSpacing: '0.04em'
          }}>
            Profesyonel Masaüstü Kayıt ve Yayın Stüdyosu
          </p>

          {/* 4-Second filling Progress Bar */}
          <div style={{
            width: '100%',
            height: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '10px',
            marginTop: '50px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{
              width: `${splashProgress}%`,
              height: '100%',
              background: 'linear-gradient(to right, #8b5cf6, #22c55e)',
              borderRadius: '10px',
              transition: 'width 0.1s linear',
              boxShadow: '0 0 12px rgba(139, 92, 246, 0.6)'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.85rem', opacity: 0.5 }}>
            <span>Sistem Hazırlanıyor... {Math.round(splashProgress)}%</span>
            <span>v0.1.0</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#070708', minHeight: '100vh', color: '#fff' }}>
      {/* 3. Deep Hardware Stress Calibrator Route */}
      {screen === 'calibrator' && (
        <SplashCalibrator onComplete={() => setScreen('studio')} />
      )}

      {/* 4. Glassmorphic Studio Layout Route */}
      {screen === 'studio' && (
        <StudioLayout onOpenSettings={() => setShowSettings(true)} />
      )}

      {/* 5. Settings Modal access overlay */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
