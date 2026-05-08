# System Patterns

## Mimari Yaklaşım
- Katmanlı mimari: `Controller -> Service -> Repository`
- Domain odaklı modelleme: triyaj süreçleri merkezde
- Ayrık sorumluluk: auth, hasta, triyaj, admin, dataset, export

## Bounded Contextler
1. `Auth`
2. `Hasta Yönetimi`
3. `Triyaj`
4. `Tahmin/Model`
5. `Dataset Yönetimi`
6. `Audit/Log`

## Temel Domain Patternleri
- Triyaj kaydı bir aggregate root:
  - `TriyajKayit`
  - ilişkili `TahminSonucu` (0..1)
  - opsiyonel override bilgileri
- `VeriSetiOgesi` yalnızca tek triyaj kaydından üretilebilir (tekilleştirme)
- `LogKaydi` tüm kritik aksiyonları append-only tutar

## Durum Akışı
- `TriyajKayit.durum`: `OLUSTURULDU -> TAHMIN_EDILDI` veya `HATA`
- Override, tahmin sonrası gelebilen ayrı bir aksiyondur

## API Patternleri
- REST + JSON
- Listeleme endpointlerinde filtre DTO + sayfalama
- Tutarlı hata modeli: `code`, `message`, `details`, `traceId`

## Entegrasyon Patternleri
- STT akışı için iki mod:
  - MVP: dosya yükle -> local STT transcription al (`faster-whisper`)
  - Sonraki faz: websocket stream + partial transcript
- Model çağrısı tek servis arayüzünden (`ModelService`) yapılır; sağlayıcı değişimi burada soyutlanır.
- Modelleme katmanında registry/factory yaklaşımı uygulanır; aynı preprocessing/split ile model karşılaştırması yapılır.
- Backend tahmin akışında provider pattern kullanılır:
  - `python-cli`: secili model artifact'ini dis script ile cagirir
  - `heuristic`: emniyetli fallback kural tabanli tahmin
- Klinik guardrail pattern:
  - `red` risk kelimeleri model etiketini `KIRMIZI`ya zorlayabilir
  - `yellow` risk kelimeleri `YESIL` etiketini `SARI`ya yukseltebilir
  - Davranis `app.model.guardrail.*` ile konfigure edilir
- Confidence policy pattern:
  - `YESIL` tahmini dusuk confidence altindaysa policy ile `SARI`ya yukseltilir
  - Davranis `app.model.policy.min-green-confidence` ile kontrol edilir
- Calibration pattern:
  - `tfidf_svm` icin `CalibratedClassifierCV` kullanilir
  - `sigmoid` ve `isotonic` secenekleri ayni splitte karsilastirilir
  - Extended karsilastirmada `temperature scaling` adayi da degerlendirilir
  - Klinik odakli secim metrikleri: once `KIRMIZI recall`, sonra genel F1
- Triyaj API akışı 3 adımda kurgulanır:
  - `/api/triage/stt` (opsiyonel ses->metin)
  - `/api/triage/predict` (etiket + guven)
  - `/api/triage/records` (kalıcı kayıt)

## Güvenlik Patternleri
- Rol bazlı yetki kontrolü (`PERSONEL`, `ADMIN`)
- Hassas veri maskeleme (TC no kısmi gösterim)
- Audit log zorunluluğu (override, dataset export, dataset ekleme)
- JWT access token + refresh token döngüsü
