# Ortak Veri Sozlesmesi (v0.1)

## Enumlar
- `Rol`: `ADMIN | PERSONEL`
- `Cinsiyet`: `ERKEK | KADIN | DIGER`
- `TriyajEtiketi`: `KIRMIZI | SARI | YESIL`
- `KayitDurumu`: `OLUSTURULDU | TAHMIN_EDILDI | HATA`
- `KaynakTipi`: `KAYITLI_VAKA | ADMIN_DENEME`

## DTO - Auth
- `LoginRequest { kullaniciAdi: string, sifre: string }`
- `RefreshRequest { refreshToken: string }`
- `LoginResponse { accessToken: string, refreshToken: string, rol: Rol, kullaniciId: number }`
- `MeResponse { kullaniciId: number, kullaniciAdi: string, rol: Rol, aktifMi: boolean }`

## DTO - Hasta
- `HastaCreateRequest { ad, soyad, tcKimlikNo, dogumTarihi, cinsiyet }`
- `HastaResponse { hastaId, ad, soyad, tcKimlikNo, dogumTarihi, cinsiyet, yas? }`

## DTO - Triyaj
- `SttRequest { audioFile }`
- `SttResponse { transcript: string }`
- `TriagePredictRequest { yas, cinsiyet, sikayetMetni }`
- `TriagePredictResponse { etiket, guven, modelVersiyonu }`
- `TriageRecordCreateRequest { hastaId, yas, cinsiyet, sikayetMetni, etiket, guven, modelVersiyonu, sesDosyaYolu?, overrideEtiket?, overrideNedeni? }`
- `TriageRecordResponse { kayitId, hastaId, etiket, guven, transcript, modelVersiyonu, durum, overrideEtiket?, overrideNedeni?, basvuruZamani }`
- `OverrideRequest { overrideEtiket, overrideNedeni }`
- `MyRecordListItem { kayitId, tarih, etiket, guven, overrideVarMi }`

## DTO - Admin
- `RecordListQuery { etiket?, confidenceMin?, confidenceMax?, overrideVarMi?, tarihBaslangic?, tarihBitis?, kaynak?, page, size }`
- `RecordListItem { kayitId, tarih, hastaRef, sikayetKisa, modelEtiket, confidence, overrideVarMi, kaynak, modelVersiyonu }`
- `DatasetCreateRequest { kayitId, gercekEtiket, not? }`
- `DatasetCreateResponse { veriId }`
- `ExportResponse { downloadUrl | token }`

## Endpoint Onerileri (`bitirme_api_analiz.docx` uyumlu)
1. `POST /api/auth/login`
2. `GET /api/auth/me`
3. `POST /api/auth/logout`
4. `POST /api/auth/refresh`
5. `POST /api/users` (admin)
6. `GET /api/users` (admin)
7. `PUT /api/users/{id}` (admin)
8. `PATCH /api/users/{id}/status` (admin)
9. `POST /api/patients`
10. `GET /api/patients`
11. `GET /api/patients/{id}`
12. `GET /api/patients/{id}/records`
13. `PUT /api/patients/{id}`
14. `POST /api/triage/stt`
15. `POST /api/triage/predict`
16. `POST /api/triage/records`
17. `GET /api/triage/records?etiket&confidenceMin&confidenceMax&overrideVarMi&tarihBaslangic&tarihBitis`
18. `GET /api/triage/records/me`
19. `GET /api/triage/records/{id}`
20. `PATCH /api/triage/records/{id}` (override/audit trail)
21. `GET /api/health`
22. `GET /api/system/stats`
23. `GET /api/system/models`
24. `POST /api/dataset/items` (admin, proje gereksinimi)
25. `GET /api/dataset/items` (admin, dataset kayitlari listesi)
26. `GET /api/dataset/export?format=csv|json` (admin, proje gereksinimi)

## Hata Modeli
```json
{
  "code": "VALIDATION_ERROR",
  "message": "Alan hatali",
  "details": ["tcKimlikNo 11 haneli olmalidir"],
  "traceId": "..."
}
```

## Is Kurallari
- `tcKimlikNo` benzersiz olmalı
- Ayni `kayitId` dataset'e ikinci kez eklenemez (`409 Conflict`)
- Override sadece yetkili kullanıcı tarafından ve tahmin sonrası yapılabilir
- `guven` aralığı `0..1`
- `GET /api/triage/records/me` yalnızca giriş yapan kullanıcının oluşturduğu kayıtları döner
- `GET /api/triage/records` filtre parametrelerini destekler (`confidenceMin/Max` backendde `0..1`)
- Kaydetme öncesi override yapılırsa modelin orijinal etiketi `etiket`, kullanıcı düzeltmesi `overrideEtiket` olarak birlikte saklanır
- Ses dosyası saklama opsiyoneldir; saklanırsa 30 gün retention
- Frontend'de `guven` yüzdeye çevrilerek gösterilir
