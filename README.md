<p align="center">
  <h1 align="center">🔴 PRIMErecorder</h1>
  <p align="center">
    Açık kaynak, profesyonel kayıt ve yayın yazılımı.<br/>
    OBS'nin sade ve kullanıcı dostu alternatifi.
  </p>
</p>

<p align="center">
  <a href="https://github.com/Ast1Kaan/PRIMErecorder/releases"><img src="https://img.shields.io/github/v/release/Ast1Kaan/PRIMErecorder?style=flat-square&color=red" alt="Release"></a>
  <a href="https://github.com/Ast1Kaan/PRIMErecorder/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-GPL--v2-blue?style=flat-square" alt="License"></a>
  <a href="https://github.com/Ast1Kaan/PRIMErecorder"><img src="https://img.shields.io/github/stars/Ast1Kaan/PRIMErecorder?style=flat-square&color=yellow" alt="Stars"></a>
  <img src="https://img.shields.io/badge/platform-Windows-0078D6?style=flat-square&logo=windows" alt="Platform">
</p>

---

## ✨ Özellikler

| Özellik | Açıklama |
|---------|----------|
| 🔍 **Sistem Tarayıcı** | 5 dakika süren hardware analizi ve otomatik optimize edilmiş ayarlar |
| 🎨 **Sade Arayüz** | 3 bölmeli studio layout — karmaşıklık yok |
| 🎬 **Sahne Sistemi** | Çoklu sahne, sınırsız kaynak, sahne geçiş animasyonları |
| 📹 **Kayıt & Yayın** | H.264 / H.265 / AV1 codec, RTMP / SRT protokolleri |
| 🎚️ **Ses Mikseri** | Çoklu kanal, VU metre, kompresör, noise gate |
| 🖥️ **Studio Modu** | Preview ≠ Program — yayında ne gösterileceğini kontrol et |
| ⌨️ **Hotkey'ler** | Özelleştirilebilir kısayollar, global listener |
| 🌐 **Browser Source** | URL tabanlı web kaynakları, CSS injection desteği |
| 📝 **Metin Kaynağı** | Google Fonts entegrasyonu, gölge ve kontur efektleri |
| 📂 **Yerel Video** | Sahneye doğrudan video dosyası ekleme |

## 🛠️ Teknoloji

- **Electron 29** — Masaüstü çatısı
- **React 18 + TypeScript** — UI
- **FFmpeg** — Medya motoru
- **SQLite** — Ayarlar ve veri depolama
- **Vite** — Bundler
- **Zustand** — State management

## 📥 Kurulum

### Hazır İndir (Windows)

[📦 Son sürümü indir](https://github.com/Ast1Kaan/PRIMErecorder/releases/latest)

### Kaynak Koddan Derleme

**Ön Koşullar:**
- Node.js v20+ LTS
- pnpm
- Git

```bash
git clone https://github.com/Ast1Kaan/PRIMErecorder.git
cd PRIMErecorder
pnpm install
pnpm dev
```

## 🧑‍💻 Geliştirme

```bash
# Dev server
pnpm dev

# Production build
pnpm build

# Installer oluştur (.exe)
pnpm dist

# Lint
pnpm lint

# Format
pnpm format
```

## 📁 Proje Yapısı

```
PRIMErecorder/
├── src/
│   ├── main/              # Electron main process
│   │   ├── db/            # SQLite veritabanı
│   │   ├── ipc/           # IPC handler'ları
│   │   └── services/      # FFmpeg, Scanner servisleri
│   ├── preload/           # Preload bridge
│   ├── renderer/          # React UI
│   │   ├── components/    # UI bileşenleri
│   │   └── store/         # Zustand store
│   └── shared/            # Paylaşılan türler ve sabitler
├── resources/             # İkonlar, installer kaynakları
└── electron-vite.config.ts
```

## 📸 Ekran Görüntüleri

> Yakında eklenecek

## 📜 Lisans

[GPL v2](./LICENSE) — OBS ile uyumlu

## 🤝 Katkıda Bulunma

Pull request'ler hoş karşılanır! Issue açarak tartışma başlatabilirsiniz.

## 📬 İletişim

- GitHub Issues: [issues](https://github.com/Ast1Kaan/PRIMErecorder/issues)

---

<p align="center">
  <strong>PRIMErecorder</strong> — Profesyonel kayıt ve yayın, sade bir UI ile.
</p>
