# AFAD Deprem Takip

Next.js + TypeScript ile geliştirilmiş, AFAD deprem verisini filtreleyip harita ve listede gösteren web uygulaması.

## Özellikler

- AFAD verisi için güvenli proxy: `GET /api/earthquakes`
- Zaman, büyüklük, derinlik, kutusal coğrafi ve yarıçap filtreleri
- Liste + harita senkron etkileşim
- Haritada `Cluster` ve `Heatmap` yoğunluk katmanları (aç/kapat)
- İl bazlı risk radar (harita + en hareketli 10 il tablosu)
- 60 saniye auto-refresh + manuel yenileme
- `M >= 4.0` için kritik uyarı bannerı ve opsiyonel ses bildirimi
- Türkiye saat dilimi (`Europe/Istanbul`) ile zaman gösterimi

## Kurulum

```bash
npm install
npm run dev
```

Uygulama: [http://localhost:3000](http://localhost:3000)

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
