# AFAD Deprem Takip

Next.js + TypeScript ile geliştirilmiş, shadcn/ui + Tailwind tabanlı AFAD deprem takip web uygulaması.

## Özellikler

- AFAD verisi için güvenli proxy: `GET /api/earthquakes`
- Çok sayfalı sade arayüz: `Dashboard`, `Depremler`, `Harita`, `Risk`, `Bildirimler`
- Zaman, büyüklük, derinlik, kutusal coğrafi ve yarıçap filtreleri
- Liste + harita senkron etkileşim
- Haritada `Cluster` ve `Heatmap` yoğunluk katmanları (aç/kapat)
- İl bazlı risk radar (harita + en hareketli 10 il tablosu)
- Web Push alarm kuralı: `M >= X`, il/ilçe ve derinlik filtresine göre anlık bildirim
- 60 saniye auto-refresh + manuel yenileme
- `M >= 4.0` için kritik uyarı bannerı ve opsiyonel ses bildirimi
- Türkiye saat dilimi (`Europe/Istanbul`) ile zaman gösterimi

## Kurulum

```bash
npm install
npm run dev
```

Uygulama: [http://localhost:3000](http://localhost:3000)

## Sayfalar

- `/` - Dashboard özeti, kritik uyarı, risk radar, canlı liste
- `/depremler` - filtre paneli + detaylı deprem listesi
- `/depremler/[eventId]` - artçı zinciri, yakın depremler, paylaşılabilir detay ekranı
- `/harita` - canlı harita (cluster/heatmap) + senkron liste
- `/risk` - il bazlı risk yoğunluğu ve il filtresi
- `/bildirimler` - web push alarm kuralları ve bildirim yönetimi

## Testler

```bash
npm run test
npm run test:e2e
```

## API

### `GET /api/earthquakes`

Desteklenen query parametreleri:

- `start` (zorunlu, ISO datetime)
- `end` (zorunlu, ISO datetime)
- `limit`
- `orderby` (`timedesc` | `timeasc`)
- `eventid`
- `minmag`, `maxmag`
- `mindepth`, `maxdepth`
- `minlat`, `maxlat`, `minlon`, `maxlon`
- `lat`, `lon`, `minrad`, `maxrad`

Not: `lat/lon/maxrad` ile yarıçap filtresi aktifse kutusal alanlar (`minlat...`) otomatik olarak yok sayılır.

## Deploy

```bash
npm run build
```

Ardından proje doğrudan Vercel'e deploy edilebilir.
