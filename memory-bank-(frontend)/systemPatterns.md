# System Patterns (frontend)

## Mimari
- Feature-based klasörleme
- API katmanı (service/client) + UI bileşenleri ayrımı
- Route bazlı yetkilendirme

## Kritik Patternler
- Sayfa durumları: loading/empty/error/success
- Formlarda schema tabanlı validasyon
- Liste ekranlarında filtre + sayfalama + tablo detay akışı

## Entegrasyon
- Contract-first: `packages/contracts` uyumu zorunlu
- Confidence backendden `0..1` gelir, UI'da `%` formatlanır
