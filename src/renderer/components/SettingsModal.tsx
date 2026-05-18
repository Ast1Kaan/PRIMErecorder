import { useState } from 'react'
import { useStudioStore } from '../store/useStudioStore'
import { AppSettings } from '../../shared/types/settings.types'

interface SettingsModalProps {
  onClose: () => void
}

type TabType = 'genel' | 'arayuz' | 'yayin' | 'ses' | 'video' | 'tuslar' | 'erisebilirlik' | 'gelismis'

export default function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings, setStreamDetails } = useStudioStore()
  const [activeTab, setActiveTab] = useState<TabType>('genel')

  // Local settings copy to mutate during editing
  const [localSettings, setLocalSettings] = useState<AppSettings>(
    settings || {
      general: { language: 'tr', autoStartMinimized: false, saveProjectOnExit: true, checkUpdatesOnStartup: true },
      ui: { theme: 'dark', fontSize: 100, compactMode: false, showStatusBar: true, showTimecodeOverlay: false },
      stream: { enableAutoReconnect: true, reconnectDelay: 5, maxReconnectAttempts: 3, defaultPlatform: 'youtube', showStreamStatsOverlay: true },
      audio: { masterVolume: 80, microphoneVolume: 80, desktopVolume: 80, desktopAudioDevice: 'default', microphoneDevice: 'default', enableNoiseGate: false, noiseGateThreshold: -40, enableCompression: false, compressionRatio: 4 },
      video: { preferredResolution: '1080p', preferredFps: 60, enableVSync: true, gpuAcceleration: true, preferredEncoder: 'auto' },
      hotkeys: { startRecord: 'Ctrl+Alt+R', stopRecord: 'Ctrl+Alt+S', pauseRecord: 'Ctrl+Alt+P', startStream: 'Ctrl+Alt+L', stopStream: 'Ctrl+Alt+K', switchScene: {} },
      accessibility: { enableHighContrast: false, enableScreenReader: false, fontSize: 100, animationsReduced: false },
      advanced: { logLevel: 'info', enableDeveloperTools: false, autoSegmentDuration: 0, maxConcurrentCaptures: 4, cachePath: '' },
    }
  )

  const [streamPlatform, setLocalPlatform] = useState<'youtube' | 'twitch' | 'custom'>('youtube')
  const [streamKey, setLocalStreamKey] = useState('')
  const [customRtmpUrl, setLocalRtmpUrl] = useState('rtmp://a.rtmp.youtube.com/live2')

  const updateLocalCategory = (category: keyof AppSettings, updates: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        ...updates,
      },
    }))
  }

  const handleSave = async () => {
    // Save category by category in Zustand store which syncs to SQLite DB
    Object.entries(localSettings).forEach(([category, data]) => {
      updateSettings(category as keyof AppSettings, data)
    })

    // Update streaming platform detail triggers
    setStreamDetails(streamPlatform, streamKey, customRtmpUrl)

    alert('Ayarlar Başarıyla Kaydedildi ve SQLite Veritabanına Yazıldı! ✓')
    onClose()
  }

  const tabs: { type: TabType; name: string }[] = [
    { type: 'genel', name: 'Genel' },
    { type: 'arayuz', name: 'Arayüz & Tema' },
    { type: 'yayin', name: 'Yayın Ayarları' },
    { type: 'ses', name: 'Ses Ayarları' },
    { type: 'video', name: 'Video Ayarları' },
    { type: 'tuslar', name: 'Tuş Atama' },
    { type: 'erisebilirlik', name: 'Erişilebilirlik' },
    { type: 'gelismis', name: 'Gelişmiş' },
  ]

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 500,
      backdropFilter: 'blur(10px)',
      boxSizing: 'border-box'
    }}>
      <div style={{
        background: '#110d1c',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        width: '900px',
        height: '600px',
        borderRadius: '24px',
        display: 'flex',
        overflow: 'hidden',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        boxSizing: 'border-box'
      }}>
        {/* Left Tabs Sidebar */}
        <div style={{
          width: '240px',
          background: '#070708',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#a78bfa', paddingLeft: '12px', marginBottom: '16px', letterSpacing: '0.05em' }}>⚙ AYARLAR</span>
            {tabs.map((t) => {
              const isSelected = activeTab === t.type
              return (
                <button
                  key={t.type}
                  onClick={() => setActiveTab(t.type)}
                  style={{
                    background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: isSelected ? '#a78bfa' : '#94a3b8',
                    textAlign: 'left',
                    padding: '12px 16px',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t.name}
                </button>
              )
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={handleSave}
              style={{
                background: 'linear-gradient(to right, #8b5cf6, #22c55e)',
                border: 'none',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(139,92,246,0.3)'
              }}
            >
              KAYDET
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#fff',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              KAPAT
            </button>
          </div>
        </div>

        {/* Right Active Panel Content */}
        <div style={{
          flex: 1,
          padding: '40px',
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}>
          {/* TAB 1: Genel */}
          {activeTab === 'genel' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Genel Ayarlar</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Sistem Dili (Language)</span>
                  <select
                    value={localSettings.general.language}
                    onChange={(e: any) => updateLocalCategory('general', { language: e.target.value })}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="tr">Türkçe (TR)</option>
                    <option value="en">English (EN)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Başlangıçta Sistem Tepsisinde (Minimized) Aç</span>
                  <input
                    type="checkbox"
                    checked={localSettings.general.autoStartMinimized}
                    onChange={(e) => updateLocalCategory('general', { autoStartMinimized: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#8b5cf6' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Çıkış Yaparken Projeyi Otomatik Kaydet</span>
                  <input
                    type="checkbox"
                    checked={localSettings.general.saveProjectOnExit}
                    onChange={(e) => updateLocalCategory('general', { saveProjectOnExit: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#8b5cf6' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Arayüz ve Tema */}
          {activeTab === 'arayuz' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Arayüz ve Tema</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Uygulama Teması (UI Theme)</span>
                  <select
                    value={localSettings.ui.theme}
                    onChange={(e: any) => updateLocalCategory('ui', { theme: e.target.value })}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="dark">Obsidian Dark (Koyu)</option>
                    <option value="system">Cosmic Violet (Degrade)</option>
                    <option value="light">Cyberpunk Green (Neon)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>GUI Ölçekleme (Font size)</span>
                  <input
                    type="number"
                    min="80"
                    max="120"
                    value={localSettings.ui.fontSize}
                    onChange={(e) => updateLocalCategory('ui', { fontSize: parseInt(e.target.value) })}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', color: '#fff', width: '80px' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Yayın Ayarları */}
          {activeTab === 'yayin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Canlı Yayın Ayarları</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span>Platform</span>
                  <select
                    value={streamPlatform}
                    onChange={(e: any) => setLocalPlatform(e.target.value)}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="youtube">YouTube (RTMPS)</option>
                    <option value="twitch">Twitch (RTMP)</option>
                    <option value="custom">Özel RTMP Sunucusu</option>
                  </select>
                </div>

                {streamPlatform === 'custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <span>Sunucu Adresi (Server URL)</span>
                    <input
                      type="text"
                      value={customRtmpUrl}
                      onChange={(e) => setLocalRtmpUrl(e.target.value)}
                      style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span>Yayın Anahtarı (Stream Key)</span>
                  <input
                    type="password"
                    placeholder="x-xxxx-xxxx-xxxx-xxxx"
                    value={streamKey}
                    onChange={(e) => setLocalStreamKey(e.target.value)}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Ses Ayarları */}
          {activeTab === 'ses' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Ses Yönlendirme</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Masaüstü Ses Kaynağı</span>
                  <select
                    value={localSettings.audio.desktopAudioDevice}
                    onChange={(e: any) => updateLocalCategory('audio', { desktopAudioDevice: e.target.value })}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="default">Varsayılan Hoparlör</option>
                    <option value="vb-cable">VB-Audio Virtual Cable</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Mikrofon Kaynağı</span>
                  <select
                    value={localSettings.audio.microphoneDevice}
                    onChange={(e: any) => updateLocalCategory('audio', { microphoneDevice: e.target.value })}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="default">Varsayılan Mikrofon</option>
                    <option value="voicemeeter">VoiceMeeter Virtual Mixer</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Video Ayarları */}
          {activeTab === 'video' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Video & Kodlayıcı Ayarları</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Tuval Çözünürlüğü (Canvas Size)</span>
                  <select
                    value={localSettings.video.preferredResolution}
                    onChange={(e: any) => updateLocalCategory('video', { preferredResolution: e.target.value })}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="1080p">1920 x 1080 (1080p Full HD)</option>
                    <option value="720p">1280 x 720 (720p HD)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Kare Hızı Sınırı (Target FPS)</span>
                  <select
                    value={localSettings.video.preferredFps}
                    onChange={(e: any) => updateLocalCategory('video', { preferredFps: parseInt(e.target.value) })}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="60">60 FPS (Akıcı)</option>
                    <option value="30">30 FPS (Standart)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Donanım İvmeli Video Kodlayıcı</span>
                  <select
                    value={localSettings.video.preferredEncoder}
                    onChange={(e: any) => updateLocalCategory('video', { preferredEncoder: e.target.value })}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="auto">Otomatik Seç (Önerilen)</option>
                    <option value="nvenc">Nvidia NVENC (Hızlı)</option>
                    <option value="amf">AMD AMF (Hızlı)</option>
                    <option value="software">x264 İşlemci Modu</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Tuş Atama */}
          {activeTab === 'tuslar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Klavye Kısayolları (Hotkeys)</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Kayıt Başlat</span>
                  <input
                    type="text"
                    value={localSettings.hotkeys.startRecord}
                    onChange={(e) => updateLocalCategory('hotkeys', { startRecord: e.target.value })}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff', width: '180px', textAlign: 'center' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Kayıt Durdur</span>
                  <input
                    type="text"
                    value={localSettings.hotkeys.stopRecord}
                    onChange={(e) => updateLocalCategory('hotkeys', { stopRecord: e.target.value })}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff', width: '180px', textAlign: 'center' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Yayın Başlat</span>
                  <input
                    type="text"
                    value={localSettings.hotkeys.startStream}
                    onChange={(e) => updateLocalCategory('hotkeys', { startStream: e.target.value })}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '6px', color: '#fff', width: '180px', textAlign: 'center' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: Erişilebilirlik */}
          {activeTab === 'erisebilirlik' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Erişilebilirlik Ayarları</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Yüksek Kontrastlı Kenarlıklar</span>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility.enableHighContrast}
                    onChange={(e) => updateLocalCategory('accessibility', { enableHighContrast: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#8b5cf6' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Animasyonları Azalt / Sınırla</span>
                  <input
                    type="checkbox"
                    checked={localSettings.accessibility.animationsReduced}
                    onChange={(e) => updateLocalCategory('accessibility', { animationsReduced: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#8b5cf6' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Gelişmiş */}
          {activeTab === 'gelismis' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Gelişmiş Geliştirici Ayarları</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Geliştirici Araçlarını (DevTools) Aktif Et</span>
                  <input
                    type="checkbox"
                    checked={localSettings.advanced.enableDeveloperTools}
                    onChange={(e) => updateLocalCategory('advanced', { enableDeveloperTools: e.target.checked })}
                    style={{ width: '20px', height: '20px', accentColor: '#8b5cf6' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Günlük Log Seviyesi (Level)</span>
                  <select
                    value={localSettings.advanced.logLevel}
                    onChange={(e: any) => updateLocalCategory('advanced', { logLevel: e.target.value })}
                    style={{ background: '#070708', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '8px', color: '#fff' }}
                  >
                    <option value="info">Bilgi (INFO)</option>
                    <option value="debug">Hata Ayıklama (DEBUG)</option>
                    <option value="warn">Uyarılar (WARN)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
