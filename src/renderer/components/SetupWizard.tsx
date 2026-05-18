import { useState } from 'react'
import { useStudioStore } from '../store/useStudioStore'

interface SetupWizardProps {
  onComplete: () => void
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const { settings, updateSettings } = useStudioStore()
  const [step, setStep] = useState(1)
  const [theme, setTheme] = useState(settings?.ui.theme || 'dark')
  const [language, setLanguage] = useState(settings?.general.language || 'tr')
  const [autoStartMinimized, setAutoStartMinimized] = useState(settings?.general.autoStartMinimized || false)

  const wizardSteps = [
    'Karşılama',
    'Tema & Renk',
    'Arkaplan & Tepsi',
    'Tamamla'
  ]

  const handleFinish = async () => {
    if (settings) {
      await updateSettings('general', {
        ...settings.general,
        language,
        autoStartMinimized,
        setupCompleted: true,
      })
      await updateSettings('ui', {
        ...settings.ui,
        theme,
      })
    }
    onComplete()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at top left, rgba(139, 92, 246, 0.22), transparent 24%), radial-gradient(circle at bottom right, rgba(34, 197, 94, 0.18), transparent 24%), #070708', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif', padding: '26px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '26px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.8rem' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '999px', background: '#22c55e', boxShadow: '0 0 18px rgba(34,197,94,0.6)' }} />
                Kurulum Sihirbazı
              </span>
              <h1 style={{ margin: '12px 0 0', fontSize: '3.2rem', lineHeight: 1.05, letterSpacing: '-0.06em', maxWidth: '720px' }}>
                PRIMErecorder için parlak bir başlangıç yapın.
              </h1>
            </div>
            <div style={{ width: '120px', height: '120px', borderRadius: '30px', border: '2px solid rgba(139, 92, 246, 0.8)', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 900, color: 'transparent', WebkitTextStroke: '2px #22c55e', textShadow: '0 0 20px rgba(34,197,94,0.3)' }}>
                PR
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {wizardSteps.map((title, index) => {
              const active = step === index + 1
              return (
                <div key={title} style={{ flex: active ? '1.4' : '1', minWidth: '120px', padding: '16px 18px', borderRadius: '18px', border: active ? '1px solid rgba(34,197,94,0.8)' : '1px solid rgba(255,255,255,0.08)', background: active ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)', boxShadow: active ? '0 18px 60px rgba(34,197,94,0.08)' : 'none' }}>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginBottom: '6px' }}>Adım {index + 1}</div>
                  <div style={{ fontSize: '0.96rem', fontWeight: 700, color: active ? '#fff' : '#cbd5e1' }}>{title}</div>
                </div>
              )
            })}
          </div>

          <div style={{ padding: '32px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)' }}>
            {step === 1 && (
              <div style={{ display: 'grid', gap: '18px' }}>
                <h2 style={{ margin: 0, fontSize: '2rem' }}>Hoş Geldiniz, stüdyo hazır.</h2>
                <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.75 }}>
                  Bu sihirbaz, PRIMErecorder kurulumunu hızlı ve göz alıcı bir şekilde tamamlamanıza yardımcı olacak. Masaüstünüze otomatik kısayol oluşturulacak, uygulama AppData içinde güvenle saklanacak ve arka plan tepsisinde küçük bir ikonla çalışacak.
                </p>
                <div style={{ display: 'grid', gap: '12px', marginTop: '18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}>
                    <span style={{ fontSize: '1.3rem' }}>✨</span>
                    <span>Uygulama güvenli şekilde AppData altında saklanacak.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', borderRadius: '16px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                    <span style={{ fontSize: '1.3rem' }}>🖥️</span>
                    <span>Kurulum tamamlandığında masaüstü kısayolunuz otomatik oluşturulacak.</span>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '2rem' }}>Tema ve renk seçimi</h2>
                <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.75 }}>
                  PRIMErecorder arayüzünüzü kendi tarzınıza göre oluşturun. Gece modu, sistem modu veya neon yeşil bir tasarım seçebilirsiniz.
                </p>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  {['dark', 'system', 'light'].map((value) => (
                    <button
                      key={value}
                      onClick={() => setTheme(value)}
                      style={{
                        flex: '1',
                        minWidth: '140px',
                        borderRadius: '18px',
                        padding: '18px',
                        border: value === theme ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.12)',
                        background: value === theme ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {value === 'dark' ? 'Obsidian Dark' : value === 'system' ? 'Cosmic Violet' : 'Cyberpunk Green'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '2rem' }}>Arka plan uygulaması</h2>
                <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.75 }}>
                  Uygulamayı küçük bir tepsi simgesi olarak çalıştırın ve sağ tıklayınca gelişmiş seçenekler açılacak. Kayıtları hızlıca başlatıp durdurabilirsiniz.
                </p>
                <div style={{ display: 'grid', gap: '14px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span>Başlangıçta sistem tepsisinde başlat</span>
                    <input
                      type="checkbox"
                      checked={autoStartMinimized}
                      onChange={(e) => setAutoStartMinimized(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#22c55e' }}
                    />
                  </label>
                  <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
                    <strong>Not:</strong> Bu ayar, uygulamanın arka planda küçük bir ikon olarak görünmesini sağlar. Sağ tık menüsünde hızlı kayıt kontrolü ve ayarlar elde edeceksiniz.
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div style={{ display: 'grid', gap: '20px' }}>
                <h2 style={{ margin: 0, fontSize: '2rem' }}>Hazırsınız!</h2>
                <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.75 }}>
                  PRIMErecorder için ileri seviye bir kurulum tamamlanıyor. Aşağıdaki ayarlarla devam ediyorsunuz:
                </p>
                <div style={{ display: 'grid', gap: '12px', padding: '18px', borderRadius: '18px', background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>• Tema: {theme === 'dark' ? 'Obsidian Dark' : theme === 'system' ? 'Cosmic Violet' : 'Cyberpunk Green'}</div>
                  <div>• Başlangıçta minumum mod: {autoStartMinimized ? 'Açık' : 'Kapalı'}</div>
                  <div>• Masaüstü kısayolu: otomatik oluşturulacak</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '18px', marginTop: '20px' }}>
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              style={{
                padding: '14px 22px',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.03)',
                color: '#fff',
                cursor: step === 1 ? 'not-allowed' : 'pointer',
                opacity: step === 1 ? 0.4 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              Geri
            </button>
            <button
              onClick={() => {
                if (step < wizardSteps.length) {
                  setStep(step + 1)
                } else {
                  handleFinish()
                }
              }}
              style={{
                padding: '14px 22px',
                borderRadius: '16px',
                border: 'none',
                background: 'linear-gradient(135deg, #8b5cf6, #22c55e)',
                color: '#fff',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 18px 32px rgba(34,197,94,0.24)'
              }}
            >
              {step < wizardSteps.length ? 'İlerle' : 'Bitir ve Aç'}
            </button>
          </div>
        </div>

        <div style={{ borderRadius: '28px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '30px', display: 'grid', gap: '24px', alignContent: 'start' }}>
          <div style={{ display: 'grid', gap: '14px' }}>
            <span style={{ color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.77rem' }}>Gelişmiş Kurulum</span>
            <h3 style={{ margin: 0, fontSize: '1.65rem' }}>PR ikon tasarımı</h3>
            <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.75 }}>
              Uygulama içinde sadece dış çizgiden oluşan, içi dolgusuz "PR" simgesini kullanacağız. Duvar kağıdı gibi derin renklerle stüdyo havası yaratılıyor.
            </p>
          </div>

          <div style={{ padding: '20px', borderRadius: '22px', background: 'rgba(0,0,0,0.18)', border: '1px dashed rgba(139,92,246,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
              <span style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '-0.08em', color: 'transparent', WebkitTextStroke: '2px #8b5cf6', textShadow: '0 0 30px rgba(139,92,246,0.25)' }}>
                PR
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.15rem' }}>🎯</span>
              <span>Yükleme tamamlandığında uygulama renklerine uygun bir deneyim sunulacak.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.15rem' }}>⚙️</span>
              <span>Gelişmiş butonlar, modern geçişler ve arka plan stüdyosu arayüzü hazır olacak.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
