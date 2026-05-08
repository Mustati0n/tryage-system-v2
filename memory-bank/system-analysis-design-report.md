# Akıllı Triage System - Sistem Analiz ve Tasarım Raporu (v1)

## 1) Amaç ve Kapsam
Bu doküman, projenin kod yazımına doğrudan temel olacak analiz ve teknik tasarım kararlarını içerir. Sistem; personelin hasta şikayetini ses/metin ile alıp triyaj tahmini üretir, admin tarafı ise kayıtları denetler, dataset’e etiketli örnek ekler ve dışa aktarım yapar.

## 2) Topoloji ve Organizasyon
- Repo yapısı: tek repo (monorepo)
- Ekip: 2 kişi
  - Backend sorumlusu: API, DB, model/stt entegrasyonu, güvenlik, logging
  - Frontend sorumlusu: Login + Personel + Admin ekranları, state, API entegrasyonu
- Entegrasyon noktası: `packages/contracts` (ortak DTO/enum sözleşmesi)

Kesinleşen kararlar:
- Auth: JWT `access + refresh`
- STT: local Whisper/faster-whisper (MVP batch)
- Ses dosyası saklama: opsiyonel
- Confidence: backend `0..1`, frontend `%`
- Admin kalite puanı: MVP dışı

## 3) Fonksiyonel Gereksinimler
1. Rol bazlı login ve yönlendirme
2. TC ile hasta arama, bulunamazsa hasta oluşturma
3. Triyaj kaydı açma (yaş, cinsiyet, şikayet metni/ses)
4. Canlı transcript görüntüleme ve son metin düzenleme
5. Tahmin al ve kaydet (etiket + confidence + modelVersiyon)
6. Override (etiket değiştir + neden)
7. Personelin kendi kayıtlarını listeleme/detay
8. Admin kayıt listesi + filtreleme
9. Dataset’e ekleme/gerçek etiketleme + tekilleştirme kontrolü
10. CSV/JSON export

## 4) Non-Functional Gereksinimler
- Güvenlik: RBAC, JWT/session, audit log
- Performans: listeleme endpointlerinde sayfalama + indeks
- İzlenebilirlik: traceId, olay logları
- Erişilebilirlik: form validasyon ve anlaşılır hata mesajları
- Veri bütünlüğü: FK ve unique kısıtları

## 5) Domain Model
UML’den çıkan ana varlıklar:
- `Kullanici(kullaniciId, kullaniciAdi, sifreHash, aktifMi, rol)`
- `Hasta(hastaId, ad, soyad, tcKimlikNo, dogumTarihi, cinsiyet)`
- `TriyajKayit(kayitId, basvuruZamani, durum, yas, cinsiyet, sikayetMetni, sesDosyaYolu, override*)`
- `TahminSonucu(sonucId, etiket, guven, transkript, modelVersiyonu, tahminZamani)`
- `VeriSetiOgesi(veriId, triageKayitId, gercekEtiket, not, kaynak, eklenmeZamani)`
- `LogKaydi(logId, kullaniciId, zaman, olay, detay)`

Enum’lar:
- `Cinsiyet`: ERKEK, KADIN, DIGER
- `TriyajEtiketi`: KIRMIZI, SARI, YESIL
- `KayitDurumu`: OLUSTURULDU, TAHMIN_EDILDI, HATA
- `KaynakTipi`: KAYITLI_VAKA, ADMIN_DENEME

## 6) Veri Tabanı Tasarımı (Öneri: PostgreSQL)
Önerilen kritik kısıtlar:
- `hasta.tc_kimlik_no` unique
- `veri_seti_ogesi.triyaj_kayit_id` unique (aynı kayıt dataset’e 1 kez)
- `triyaj_kayit.hasta_id` FK
- `tahmin_sonucu.kayit_id` unique FK (her kayda 0..1 tahmin)

Önerilen indeksler:
- `triyaj_kayit(basvuru_zamani desc)`
- `tahmin_sonucu(etiket, guven)`
- `triyaj_kayit(override_etiket)` (filtrelerde kullanılacaksa)

## 7) API Tasarımı (Özet)
Detay kontrat: `memory-bank/contracts/api-contract.md`

Ana endpoint grupları:
- `/api/auth/*`
- `/api/users/*` (admin)
- `/api/patients/*`
- `/api/triage/*`
- `/api/dataset/*` (admin)
- `/api/system/*`
- `/api/health`

`bitirme_api_analiz.docx` ile uyumlu çekirdek endpointler:
- Auth: `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`, `POST /api/auth/logout`
- Users: `POST/GET/PUT/PATCH /api/users...`
- Patients: `POST/GET/GET{id}/GET{id}/records/PUT`
- Triage: `POST /api/triage/stt`, `POST /api/triage/predict`, `POST /api/triage/records`, `GET /api/triage/records`, `GET /api/triage/records/{id}`, `PATCH /api/triage/records/{id}`
- Personel kayıtları: `GET /api/triage/records/me`
- Dataset (proje gereksinimi): `POST /api/dataset/items`, `GET /api/dataset/export?format=csv|json`
- System: `GET /api/health`, `GET /api/system/stats`, `GET /api/system/models`

## 8) UI Tasarımı (Senden Gelen Kapsama Göre)
### 8.1 Login
- kullanıcı adı, şifre, giriş butonu, hata mesajı
- başarıda role göre yönlendirme

### 8.2 Personel Panel
- Sekme A: Hasta bul/oluştur
- Sekme B: Triyaj kaydı + transcript + tahmin kartı
- Sekme C: Override (opsiyonel)
- Sekme D: Kendi kayıtlarım + detay

MVP notu:
- Canlı transcript teknik risk nedeniyle ilk sürümde zorunlu değildir.
- İlk sürümde ses yükleme -> batch STT -> metin düzeltme akışı yeterlidir.

### 8.3 Admin Panel
- Kayıt tablosu + filtreler (confidence dahil)
- Kayıt detayı
- Dataset’e ekle/etiketle
- Export (CSV/JSON)
- Sistem logları (opsiyonel)

## 9) Geliştirme Akışı (Pratik)
1. Sözleşmeleri dondur (entity/DTO/endpoint)
2. Backend minimal API’leri çıkar (mock model)
3. Frontend ekran iskeletlerini gerçek endpointlerle bağla
4. STT + model entegrasyonunu devreye al
5. E2E senaryoları test et

## 9.1 Faz Bazlı İş Sırası (Baştan Sona)
Faz-0: Analiz ve tasarım
- Kapsam, roller, ekranlar, domain, API tasarımı netleştirilir.
- Memory Bank oluşturulur ve dondurulur.

Faz-1: Monorepo ve altyapı
- `apps/backend`, `apps/frontend`, `packages/contracts`, `infra` iskeleti açılır.
- Docker compose, environment ve temel CI hazırlanır.

Faz-2: Ortak sözleşme ve backend çekirdek
- Enum/DTO sözleşmeleri sabitlenir.
- Auth + Users + Patients + Triage temel endpointleri çıkar.
- DB migration + temel loglama eklenir.

Faz-3: Frontend temel ekranlar
- Login, Personel paneli, Admin paneli çalışır hale getirilir.
- API entegrasyonları yapılır (kontrat uyumlu).

Faz-4: STT + model entegrasyonu
- MVP: local batch STT (`/api/triage/stt`)
- Predict + record akışı canlıya yakın şekilde bağlanır.

Faz-5: Kalite, test ve yayın
- Unit/integration/E2E testleri
- Hata yönetimi ve audit kontrolü
- Manuel deployment (frontend build + backend run + nginx)

Branch önerisi:
- `main` (stabil)
- `dev` (entegrasyon)
- `feat/backend-*`, `feat/frontend-*`

## 10) Deployment/Güncelleme Mantığı (Manuel)
Manuel deployment için önerilen model:
1. Frontend build alınır (`dist`)
2. Backend jar/container çalıştırılır
3. Frontend `Nginx` ile statik sunulur
4. API reverse proxy ile backend’e yönlenir
5. DB migration startup’ta Flyway ile çalışır

Kısa cevap: Evet, frontend build alınıp sunulmalı. Prod’da Vite dev server değil, derlenmiş statik dosya sunumu tercih edilir.

## 11) Linux ve Veritabanı
- Linux üzerinde PostgreSQL operasyonel olarak çok iyi desteklenir.
- Veritabanı seçimi “çok fark etmez” seviyesinde değildir; veri bütünlüğü, indeks, transaction ve raporlama gereksinimi için PostgreSQL daha güvenli seçimdir.
- Eğer ileride JSON ağırlıklı esneklik gerekirse PostgreSQL JSONB zaten yeterli alan sağlar.

## 12) Kritik Riskler ve Azaltma
- STT gecikmesi: MVP batch transcribe; sonraki fazda chunk + async
- Model unavailable: retry + fallback hata durumu
- Dataset kirliliği: admin doğrulama kuralı + duplicate önleme
- KVKK: veri saklama süresi ve silme politikası

Retention politikası:
- Ses dosyası: 30 gün (saklanıyorsa)
- Loglar: 30 gün
- Transkript + kayıt verisi: manuel silinene kadar

## 13) Test Stratejisi
- Unit: service + validation + mapper
- Integration: repository + migration + API
- Contract test: frontend-backend DTO uyumu
- E2E: iki ana sequence senaryosu

## 14) Açık Sorular (Karar Gerekli)
1. Model servisi tek endpoint mi, model versiyonlama ayrı mı?
2. Canlı transcript fazı için hedef tarih/sürüm nedir?
