# Active Context (backend)

## Güncel Durum
- Analiz/tasarım kararları net
- API kontratı hazır (referans: `memory-bank/contracts/api-contract.md`)
- Spring Boot backend iskeleti oluşturuldu
- MVP auth + health endpointleri eklendi
- MVP patients endpointleri eklendi (`POST/GET/GET{id}/PUT`)
- MVP triage endpointleri eklendi (`/predict`, `/records`, `/records/{id}`, `PATCH override`, `stt` stub)
- MVP users endpointleri eklendi (`POST/GET/PUT/PATCH status`)
- MVP dataset ve system endpointleri eklendi (`/api/dataset/*`, `/api/system/*`)
- JPA entity/repository katmanı eklendi
- Flyway `V1__init_schema.sql` migration eklendi
- Flyway `V2__add_refresh_tokens.sql` migration eklendi
- `mvn -DskipTests compile` başarılı
- Integration test seti eklendi (`AuthIntegrationTest`, `PatientIntegrationTest`, `TriageDatasetIntegrationTest`)
- `mvn test` başarılı (H2 test profili ile)
- Auth refresh token persistence tamamlandı (`/api/auth/refresh`, DB token rotation)
- STT local batch entegrasyonu tamamlandı (`/api/triage/stt` multipart, `SttService`, `scripts/stt_faster_whisper.py`)
- Flyway PostgreSQL modülü eklendi (`flyway-database-postgresql`) - PostgreSQL 16.13 uyumluluğu için
- STT device parametresi eklendi; default `cpu` olarak ayarlandı (CUDA `libcublas` hatasını önlemek için)
- STT scriptine doğruluk ayarları eklendi: `--beam-size`, `--vad-filter`, `--vad-min-silence-ms`, `--temperature`, `--compute-type`
- `triage_records` tablosuna `created_by_kullanici_adi` kolonu eklendi (V3 migration)
- Personel için `GET /api/triage/records/me` endpointi eklendi
- Integration testte `records/me` için sahiplik ayrıştırması doğrulandı (personel/admin birbirinin kaydını görmüyor)
- `POST /api/triage/records` requestine `overrideEtiket/overrideNedeni` opsiyonel alanları eklendi (pre-save override desteği)
- `GET /api/triage/records` endpointine query parametreli filtreleme eklendi (`etiket`, `confidenceMin/Max`, `overrideVarMi`, `tarihBaslangic/Bitis`)
- `GET /api/dataset/items` endpointi eklendi (admin dataset kayitlarini listeleme)
- Integration test seti genisletildi: pre-save override saklama, admin filtreli kayit listeleme, dataset items RBAC kontrolu
- `infra/smoke-check.sh` eklendi (health + demo login kontrolu)

## Kesin Kararlar
- Auth: JWT access + refresh
- STT: local faster-whisper (MVP batch)
- Confidence: backend `0..1`
- Ses saklama: opsiyonel, saklanırsa 30 gün

## Sonraki Adımlar
1. PostgreSQL ile local runtime smoke testi + seed kullanıcı doğrulaması yap
2. Refresh token için logout/revoke stratejisini netleştir (tek token revoke vs tum tokenlar)
3. Model tahmin endpointini gerçek model servisi adapterına bağla
