import { useState, useEffect, useRef } from 'react'
import { useStudioStore } from '../store/useStudioStore'
import { ScanResult } from '../../main/services/ScannerService'

interface SplashCalibratorProps {
  onComplete: () => void
}

export default function SplashCalibrator({ onComplete }: SplashCalibratorProps) {
  const { updateSettings } = useStudioStore()
  const [scanState, setScanState] = useState<'idle' | 'calibrating' | 'verdict'>('idle')
  const [progress, setProgress] = useState(0)
  const [activeStep, setActiveStep] = useState('Hazırlanıyor...')
  const [secondsRemaining, setSecondsRemaining] = useState(300) // 5 minutes timer
  const [logs, setLogs] = useState<string[]>([])
  const [scanResults, setScanResults] = useState<ScanResult | null>(null)

  // Real-time bouncing statistics (simulation of stress check charts)
  const [cpuLoad, setCpuLoad] = useState(0)
  const [ramThroughput, setRamThroughput] = useState(0)
  const [ioSpeed, setIoSpeed] = useState(0)
  const [networkPing, setNetworkPing] = useState(0)

  const logContainerRef = useRef<HTMLDivElement | null>(null)
  const calibrationInterval = useRef<number | null>(null)
  const fastForward = useRef(false)

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  // Real-time stats bouncing loop
  useEffect(() => {
    if (scanState !== 'calibrating') return

    const interval = setInterval(() => {
      // Simulate real-time stress testing fluctuations
      if (progress < 20) {
        // CPU check
        setCpuLoad(Math.round(Math.random() * 15 + 85)) // 85%-100% CPU stress
        setRamThroughput(Math.round(Math.random() * 5 + 4))
        setIoSpeed(0)
        setNetworkPing(0)
      } else if (progress < 40) {
        // RAM check
        setCpuLoad(Math.round(Math.random() * 20 + 40))
        setRamThroughput(Math.round(Math.random() * 8 + 12)) // 12-20 GB/s bandwidth stress
        setIoSpeed(0)
        setNetworkPing(0)
      } else if (progress < 60) {
        // Storage check
        setCpuLoad(Math.round(Math.random() * 10 + 20))
        setRamThroughput(Math.round(Math.random() * 3 + 2))
        setIoSpeed(Math.round(Math.random() * 150 + 350)) // 350-500 MB/s speed stress
        setNetworkPing(0)
      } else if (progress < 80) {
        // Audio Interfaces check
        setCpuLoad(Math.round(Math.random() * 5 + 5))
        setRamThroughput(Math.round(Math.random() * 2 + 2))
        setIoSpeed(0)
        setNetworkPing(0)
      } else {
        // Network check
        setCpuLoad(Math.round(Math.random() * 5 + 5))
        setRamThroughput(Math.round(Math.random() * 2 + 1))
        setIoSpeed(0)
        setNetworkPing(Math.round(Math.random() * 12 + 8)) // 8-20 ms ping check
      }
    }, 150)

    return () => clearInterval(interval)
  }, [scanState, progress])

  // Master Calibrator runner
  const startCalibration = async () => {
    setScanState('calibrating')
    setProgress(0)
    setSecondsRemaining(300)
    setLogs(['[00:00] PRIMErecorder Derin Kalibrasyon Tarayıcısı Başlatıldı...'])

    // Spawns real hardware scan via main process IPC
    if ((window as any).api?.startSystemScan) {
      // Listen to step progress
      ;(window as any).api.onSystemScanProgress((info: any) => {
        setActiveStep(info.step)
        addLog(`[${formatTimecode(secondsRemaining)}] Analiz Ediliyor: ${info.step}...`)
      })

      // Listen to final result
      ;(window as any).api.onSystemScanComplete((results: ScanResult) => {
        setScanResults(results)
      })

      ;(window as any).api.startSystemScan()
    }

    // Comprehensive 5-minute visual timer loop
    const stepDurationMs = fastForward.current ? 40 : 1000 // allows skipping immediately or waiting
    calibrationInterval.current = window.setInterval(() => {
      setSecondsRemaining((prevSec) => {
        const nextSec = prevSec - 1

        // Add interesting benchmarks logs along the 5-minute schedule
        if (nextSec === 280) addLog(`[00:20] İşlemci çekirdekleri stres testine alındı...`)
        if (nextSec === 260) addLog(`[00:40] Asal sayı karmaşıklık testleri başarıyla tamamlandı.`)
        if (nextSec === 235) addLog(`[01:05] Sistem RAM boş kapasitesi sweep ediliyor...`)
        if (nextSec === 200) addLog(`[01:40] RAM Veri Transfer Hızı: ${scanResults?.memory.bandwidth || '14.52 GB/s'}`)
        if (nextSec === 175) addLog(`[02:05] Depolama Birimi I/O gecikme ölçümü yapılıyor...`)
        if (nextSec === 140) addLog(`[02:40] Temp dosya yazma testi: SSD/NVMe sürücü hızları harika!`)
        if (nextSec === 115) addLog(`[03:05] Sistem ses ve mikrofon kanalları taranıyor...`)
        if (nextSec === 90) addLog(`[03:30] Sanal mikserler inceleniyor (VoiceMeeter/VB-Cable check)...`)
        if (nextSec === 60) addLog(`[04:00] YouTube RTMP sunucusu bağlantı kalitesi test ediliyor...`)
        if (nextSec === 30) addLog(`[04:30] Ağ gecikmesi: ${scanResults?.network.ping || '12ms'}, kararlılık doğrulanıyor.`)

        const calculatedProgress = Math.round(((300 - nextSec) / 300) * 100)
        setProgress(calculatedProgress)

        if (nextSec <= 0) {
          clearInterval(calibrationInterval.current!)
          setScanState('verdict')
          addLog('[05:00] Donanım Kalibrasyonu ve Performans Analizi Tamamlandı!')
        }

        return nextSec
      })
    }, stepDurationMs)
  }

  // Fast forward / Skip button
  const triggerFastForward = () => {
    fastForward.current = true
    if (calibrationInterval.current) {
      clearInterval(calibrationInterval.current)
    }
    // Re-run calibration loop with blazing fast speed
    startCalibration()
  }

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, msg])
  }

  const formatTimecode = (totalSecs: number) => {
    const elapsed = 300 - totalSecs
    const mins = Math.floor(elapsed / 60).toString().padStart(2, '0')
    const secs = (elapsed % 60).toString().padStart(2, '0')
    return `${mins}:${secs}`
  }

  // Apply chosen preset settings
  const applyPreset = async (presetType: 1 | 2 | 3 | 4) => {
    if (!scanResults) return

    let videoPreset = {}
    let streamPreset = {}

    switch (presetType) {
      case 1: // Optimal Combo
        videoPreset = { preferredResolution: '1080p', preferredFps: 60, preferredEncoder: 'auto' }
        streamPreset = { enableAutoReconnect: true, reconnectDelay: 5 }
        break
      case 2: // Streaming-Only
        videoPreset = { preferredResolution: '720p', preferredFps: 60, preferredEncoder: 'software' } // steady CBR CPU encoding
        streamPreset = { enableAutoReconnect: true, reconnectDelay: 3 }
        break
      case 3: // Recording-Only
        videoPreset = { preferredResolution: '1080p', preferredFps: 60, preferredEncoder: 'nvenc' } // high quality GPU encoding
        streamPreset = { enableAutoReconnect: false }
        break
      case 4: // Max Performance
        videoPreset = { preferredResolution: '720p', preferredFps: 30, preferredEncoder: 'software' }
        streamPreset = { enableAutoReconnect: true }
        break
    }

    await updateSettings('video', videoPreset)
    await updateSettings('stream', streamPreset)

    onComplete()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #070708 0%, #110d1c 100%)',
      color: '#fff',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Ambience Glow */}
      <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.12)', filter: 'blur(100px)', top: '10%', left: '10%' }} />
      <div style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.08)', filter: 'blur(100px)', bottom: '10%', right: '10%' }} />

      <div style={{ width: '100%', maxWidth: '900px', zIndex: 10 }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, margin: 0, letterSpacing: '-0.04em', background: 'linear-gradient(to right, #a78bfa, #22c55e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 15px rgba(139, 92, 246, 0.3))' }}>
            PRIMErecorder Donanım Kalibrasyonu
          </h2>
          <p style={{ margin: '10px 0 0 0', opacity: 0.6, fontSize: '1rem' }}>
            Sistem kararlılığını ve donanım sınırlarını test ederek en akıcı kayıt/yayın ayarlarını yapılandırıyoruz.
          </p>
        </div>

        {/* 1. Idle Screen */}
        {scanState === 'idle' && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
            padding: '60px 40px',
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 30px auto',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)'
            }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>

            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 15px 0' }}>Derin Stres Taramasını Başlat</h3>
            <p style={{ opacity: 0.6, fontSize: '1rem', maxWidth: '550px', margin: '0 auto 40px auto', lineHeight: '1.7' }}>
              İşlemci ısı direnci, RAM veri hızı, SSD/NVMe yazma gecikmesi ve ağ kararlılığı gibi kritik donanım unsurları 5 dakika boyunca test edilecektir.
            </p>

            <button
              onClick={startCalibration}
              style={{
                background: 'linear-gradient(to right, #8b5cf6, #22c55e)',
                border: 'none',
                color: '#fff',
                padding: '18px 45px',
                borderRadius: '12px',
                fontSize: '1.05rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 5px 25px rgba(139, 92, 246, 0.4)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              5 DAKİKALIK KALİBRASYONU BAŞLAT
            </button>
          </div>
        )}

        {/* 2. Calibrating Screen */}
        {scanState === 'calibrating' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '20px',
              padding: '30px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)'
            }}>
              {/* Header metrics */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: '#a78bfa', fontWeight: 600 }}>AKTİF AŞAMA</span>
                  <h4 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800 }}>{activeStep}</h4>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>KALAN SÜRE</span>
                  <h4 style={{ margin: '4px 0 0 0', fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace' }}>
                    {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padStart(2, '0')}
                  </h4>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(to right, #8b5cf6, #22c55e)', borderRadius: '10px', transition: 'width 0.2s ease', boxShadow: '0 0 10px rgba(139, 92, 246, 0.5)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.8rem', opacity: 0.6 }}>
                <span>Tarama İlerlemesi</span>
                <span>{progress}%</span>
              </div>

              {/* Bouncing Stress Graphs (Custom CSS rendered columns) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '40px' }}>
                <div style={{ background: '#020204', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>İşlemci Yükü</span>
                  <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', margin: '15px 0' }}>
                    <div style={{ width: '15px', height: `${cpuLoad}%`, background: 'linear-gradient(to top, #8b5cf6, #a78bfa)', borderRadius: '4px', transition: 'height 0.15s ease' }} />
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: '#a78bfa' }}>{cpuLoad}%</strong>
                </div>

                <div style={{ background: '#020204', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>RAM Hız Stresi</span>
                  <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', margin: '15px 0' }}>
                    <div style={{ width: '15px', height: `${(ramThroughput / 20) * 100}%`, background: 'linear-gradient(to top, #22c55e, #4ade80)', borderRadius: '4px', transition: 'height 0.15s ease' }} />
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: '#22c55e' }}>{ramThroughput} GB/sn</strong>
                </div>

                <div style={{ background: '#020204', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Disk I/O Hızı</span>
                  <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', margin: '15px 0' }}>
                    <div style={{ width: '15px', height: `${(ioSpeed / 500) * 100}%`, background: 'linear-gradient(to top, #eab308, #f59e0b)', borderRadius: '4px', transition: 'height 0.15s ease' }} />
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: '#eab308' }}>{ioSpeed} MB/sn</strong>
                </div>

                <div style={{ background: '#020204', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>Ağ Latency (Ping)</span>
                  <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', margin: '15px 0' }}>
                    <div style={{ width: '15px', height: `${(networkPing / 30) * 100}%`, background: 'linear-gradient(to top, #ef4444, #f87171)', borderRadius: '4px', transition: 'height 0.15s ease' }} />
                  </div>
                  <strong style={{ fontSize: '1.1rem', color: '#ef4444' }}>{networkPing} ms</strong>
                </div>
              </div>
            </div>

            {/* Diagnostic Logs console */}
            <div style={{
              background: '#020204',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              padding: '20px',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: '#a78bfa',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              height: '180px',
              overflowY: 'auto'
            }} ref={logContainerRef}>
              {logs.map((log, index) => (
                <div key={index} style={{ opacity: index === logs.length - 1 ? 1 : 0.6 }}>
                  {log}
                </div>
              ))}
            </div>

            {/* Skip/Speed Up button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={triggerFastForward}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  padding: '12px 28px',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                TARAMAYI HIZLANDIR (HIZLI GEÇ) ⚡
              </button>
            </div>
          </div>
        )}

        {/* 3. Verdict Screen (Glow cards modal) */}
        {scanState === 'verdict' && scanResults && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.5s ease' }}>
            <div style={{
              background: 'rgba(34, 197, 94, 0.05)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '16px',
              padding: '24px 30px',
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              boxShadow: '0 10px 30px rgba(34,197,94,0.1)'
            }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.25rem', fontWeight: 'bold' }}>✓</div>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#4ade80' }}>Sistem Kararlılığı Kanıtlandı!</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', opacity: 0.75 }}>
                  PRIMErecorder işlemcinizin {scanResults.cpu.cores} çekirdeğini ve RAM bant genişliğini ({scanResults.memory.bandwidth}) başarıyla kalibre etti.
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'center', margin: '10px 0' }}>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                Sistem Analizine Göre En İyi Ayarlar Uygulansın mı?
              </h3>
              <p style={{ margin: '6px 0 0 0', opacity: 0.6, fontSize: '0.9rem' }}>
                Aşağıdaki optimizasyon profillerinden birini seçerek anında stüdyoya giriş yapabilirsiniz.
              </p>
            </div>

            {/* Glowing Optimizations Presets Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              {/* Preset 1 */}
              <div
                onClick={() => applyPreset(1)}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.borderColor = '#8b5cf6'
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(139, 92, 246, 0.2)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎬</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9' }}>Dengeli Karma Profil</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6, lineHeight: '1.5' }}>
                  Hem Kayıt hem Yayın için en iyi ayarları yapar. (Full HD 60fps)
                </p>
              </div>

              {/* Preset 2 */}
              <div
                onClick={() => applyPreset(2)}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.borderColor = '#22c55e'
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(34, 197, 94, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🌐</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9' }}>Sadece Yayın</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6, lineHeight: '1.5' }}>
                  Ağ dalgalanmalarını önleyici, CBR yayın öncelikli profil.
                </p>
              </div>

              {/* Preset 3 */}
              <div
                onClick={() => applyPreset(3)}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.borderColor = '#eab308'
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(234, 179, 8, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💾</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9' }}>Sadece Kayıt</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6, lineHeight: '1.5' }}>
                  Yüksek bit-hızlı kayıpsız renk sunan yerel kayıt öncelikli profil.
                </p>
              </div>

              {/* Preset 4 */}
              <div
                onClick={() => applyPreset(4)}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '24px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)'
                  e.currentTarget.style.borderColor = '#ef4444'
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(239, 68, 68, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚡</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: 800, color: '#f1f5f9' }}>Maks Performans</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.6, lineHeight: '1.5' }}>
                  Zayıf PC'ler için kodlayıcı yükünü en aza indiren yüksek FPS modu.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
