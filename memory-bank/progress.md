# Progress

## Faz Bazlı Tikli İlerleme
### Faz-0: Analiz ve Tasarım
- [x] Sistem kapsamı (amaç, roller, ekranlar) netleştirildi
- [x] Domain model (UML bazlı) çıkarıldı
- [x] API analiz dokümanı (`bitirme_api_analiz.docx`) işlendi
- [x] Sistem analiz/tasarım raporu yazıldı
- [x] Memory Bank çekirdek dosyaları oluşturuldu
- [x] Ayrı ekip çalışması için iki Memory Bank klasörü oluşturuldu (`memory-bank-(backend)`, `memory-bank-(frontend)`)

### Faz-1: Monorepo ve Altyapı
- [x] Monorepo klasörleri açıldı (`apps/*`, `packages/*`, `infra/*`)
- [x] Docker compose ve `.env` şablonları hazır
- [x] Ortak çalışma scriptleri hazır (`dev`, `build`, `test`) (MVP)
- [x] DB başlatma scripti eklendi (`infra/start-db.sh`, docker/podman fallback)

### Faz-2: Backend Çekirdek
- [x] Auth yaklaşımı kesinleşti: JWT `access + refresh`
- [x] Auth endpointleri implement edildi (MVP+: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`, `/api/auth/refresh`)
- [x] Users (admin) endpointleri implement edildi
- [x] Patients endpointleri implement edildi (MVP: `POST/GET/GET{id}/PUT`, `GET {id}/records` placeholder)
- [x] Triage endpointleri implement edildi (MVP: `predict/records/override`, `stt` stub)
- [x] DB migration ve seed yapısı hazır (Flyway V1 + JPA entity/repository)
- [x] Refresh token kalıcılığı eklendi (V2 migration + repository + rotation)

### Faz-3: Frontend Çekirdek
- [x] Login ekranı implement edildi
- [x] Personel paneli implement edildi (iskelet)
- [x] Admin paneli implement edildi (MVP: kayıt listeleme + dataset + export)
- [x] API entegrasyonları tamamlandı (auth + refresh + patient + triage + admin dataset/export + admin server-side filtreler + personel my-records/override + admin simulasyon/sistem ozeti bağlı)
- [x] Tahmin kartında kaydetme öncesi override akışı eklendi (orijinal + override birlikte saklama)
- [x] Personel/Admin için temel loading-empty-error UX iyileştirmeleri eklendi (kayıt yükleniyor/boş durum/aksiyon ön koşulları)
- [x] Admin paneline kullanici yonetimi eklendi (kullanici listele/ekle/aktif-pasif)

### Faz-4: STT ve Model Entegrasyonu
- [x] STT kararı net: local Whisper/faster-whisper
- [x] `/api/triage/stt` local batch entegrasyonu tamamlandı (multipart + local CLI script + stub fallback)
- [x] Frontend personel ekranında ses upload + STT transcript akışı bağlandı
- [x] `/api/triage/predict` model entegrasyonu tamamlandı
- [x] Tahmin + kayıt zinciri uçtan uca doğrulandı

### Faz-4B: Ayrik Modelleme Katmani
- [x] Backend'e dokunmadan `packages/modeling` ayrik katmani acildi
- [x] Ortak preprocessing + stratified split altyapisi kuruldu
- [x] 3 model ayni arayuzde tanimlandi (`tfidf_logreg`, `tfidf_svm`, `berturk_gbdt`)
- [x] Train/evaluate/compare/predict scriptleri eklendi
- [x] Model artifact kaydet/yukle akisi eklendi
- [x] Gercek veriyle model karsilastirma ciktilari uretildi (`triage.csv`, 2239 satir)

### Faz-4C: Model Secimi ve Entegrasyon
- [x] Uc model adil karsilastirildi (ayni stratified split, `class_weight=balanced`)
- [x] Secilen model: `tfidf_svm` (KIRMIZI recall: `0.8151`)
- [x] Secim kaydi olusturuldu (`packages/modeling/artifacts/selected/model-selection.json`)
- [x] Backend'e model provider katmani eklendi (`python-cli` + `heuristic` fallback)
- [x] Model degisimi env/config ile tek noktadan yapilabilir hale getirildi

### Faz-4D: Klinik Guvenlik Guardrail
- [x] Backend model tahminine guardrail katmani eklendi (riskli kelimeye gore escalation)
- [x] Guardrail konfigleri `app.model.guardrail.*` altina tasindi
- [x] Guardrail davranisi integration test ile dogrulandi

### Faz-4E: Confidence Policy
- [x] Dusuk guvenli YESIL tahminleri SARI'ya cekebilen policy eklendi
- [x] Policy configi eklendi (`app.model.policy.min-green-confidence`)
- [x] Policy testi eklendi ve dogrulandi

### Faz-4F: Policy Tuning
- [x] Policy threshold tuning scripti eklendi (`packages/modeling/scripts/tune_policy.py`)
- [x] `tfidf_svm` predictions uzerinden tuning raporu uretildi
- [x] Onerilen default threshold `0.65` olarak guncellendi

### Faz-4G: Kalibrasyon Karsilastirmasi
- [x] SVM icin `sigmoid` vs `isotonic` kalibrasyon karsilastirmasi eklendi
- [x] Kalibrasyon raporu uretildi (`svm-calibration-comparison.csv`)
- [x] Ilk secim netlestirildi: `sigmoid` (extended fazda guncellendi)

### Faz-4H: Extended Kalibrasyon Karsilastirmasi
- [x] `compare_svm_calibration_extended.py` eklendi (`sigmoid` + `isotonic` + `temperature_scaled_sigmoid`)
- [x] Etiket/probability kolon sirasi hatasi duzeltilerek metrik hesabi stabil hale getirildi
- [x] Extended sonucuna gore secili artifact `tfidf_svm + isotonic` olarak guncellendi

### Faz-5: Test, Güvenlik, Yayın
- [x] Unit testler tamamlandı (ModelInferenceService + SystemLogService unit testleri eklendi)
- [x] Integration testler tamamlandı (backend auth/patient/triage/dataset + `records/me` + admin filtre + pre-save override + dataset-items RBAC; `mvn test` 13/13 geçti)
- [x] E2E ana senaryolar tamamlandı (Playwright mock 4/4 + real backend 4/4 geçti)
- [x] Model bagimli E2E/smoke altyapisi eklendi (`infra/model-smoke-check.sh` + model checklist)
- [x] Deployment adımları doğrulandı (runbook + smoke scriptleri + standart komut seti dokumante edildi)
- [x] Log retention nihai kararı verildi (30 gün)

## Son Eklenenler
- [x] `infra/smoke-check.sh` eklendi (health + admin/personel login kontrolu)
- [x] Model harici manuel kabul adimlari checklisti eklendi (`memory-bank/testing/e2e-checklist.md`)
- [x] Personel form grid responsive ayari iyilestirildi (`auto-fit/minmax`)
- [x] Playwright browser-level E2E altyapisi eklendi ve ilk 2 test calistirildi (`apps/frontend/e2e/auth-and-flow.spec.ts`)
- [x] Playwright gerçek backend E2E altyapisi eklendi (`apps/frontend/e2e-real/real-backend-flow.spec.ts`, `npm run e2e:real`)
- [x] Modelleme paketi eklendi (`packages/modeling`) ve modul yapisi tamamlandi
- [x] Modelleme workflow checklist dosyasi eklendi (`memory-bank/modeling/modeling-workflow.md`)
- [x] Model secim karsilastirmasi calistirildi ve secili model backend'e entegre edildi
- [x] Klinik guardrail eklendi ve README'ye env ayarlari dokumante edildi
- [x] Confidence policy eklendi ve integration testten gecirildi
- [x] Confidence policy tuning raporu uretildi ve backend default threshold guncellendi
- [x] Kalibrasyon karsilastirmasi yapildi ve secim dokumante edildi
- [x] Extended kalibrasyon karsilastirmasi calistirildi ve secili artifact isotonic olarak guncellendi
- [x] Model bagimli kabul checklist dosyasi eklendi (`memory-bank/testing/model-e2e-checklist.md`)
- [x] Model smoke scripti eklendi (`infra/model-smoke-check.sh`)
- [x] Admin kullanici yonetimi UI eklendi (`apps/frontend/src/pages/AdminPage.tsx`)
- [x] Admin kullanici yonetimi real-backend Playwright senaryosu eklendi (`apps/frontend/e2e-real/real-backend-flow.spec.ts`)
- [x] Real-backend E2E kirilgan tahmin assertioni duzeltildi (etiket enum regex)
- [x] `infra/model-smoke-check.sh` parse ve alan-adi bugfixleri yapildi, script tekrar yesil
- [x] Admin use-case kapsami genisletildi: "Deneme / Simulasyon Triyaj" ve "Sistem Loglari / Durum Ozeti" bolumleri eklendi
- [x] Admin yenile aksiyonu tum veri kaynaklarini birlikte yenileyecek sekilde birlestirildi
- [x] Frontend build yeni admin bolumleriyle tekrar dogrulandi (`npm run build`)
- [x] Zip kaynakli tasarim birlestirmesi yapildi (stack uyumsuzlugu nedeniyle UI/tema adaptasyonu ile)
- [x] Global frontend stil katmani eklendi (`apps/frontend/src/styles.css`)
- [x] Login + Personel + Admin sayfalari yeni stil sistemine baglandi
- [x] Tasarim birlestirmesi sonrasi frontend build tekrar dogrulandi (`npm run build`)
- [x] Role bazli sidebar/topbar dashboard shell eklendi (`src/components/AppShell.tsx`)
- [x] Korumali route'lar shell ile birlestirildi (`App.tsx`)
- [x] Personel/Admin bolumlerine sidebar anchor hedefleri eklendi
- [x] Shell entegrasyonu sonrasi frontend build tekrar dogrulandi (`npm run build`)
- [x] Triyaj etiketleri icin ortak badge stil sistemi eklendi (`red/yellow/green/neutral`)
- [x] Personel/Admin ekranlarinda kritik etiket alanlari badge formatina cevrildi
- [x] Badge UI iyilestirmesi sonrasi frontend build tekrar dogrulandi (`npm run build`)
- [x] Admin paneli screenshot referansina yakin profesyonel dashboard duzenine tasindi (sadece admin)
- [x] Admin ozet kartlari + hizli erisim + trend/donut + model izleme bloklari eklendi
- [x] Admin tablo/yonetim bolumleri yeni tasarim diline adapte edildi (fonksiyonlar korunarak)
- [x] Admin modernizasyonu sonrasi frontend build tekrar dogrulandi (`npm run build`)
- [x] Admin tek sayfa yapisi kaldirildi; sidebar kontrollu coklu route yapisina gecildi
- [x] Admin sayfalari ayrildi (`dashboard`, `records`, `personnel`, `logs`)
- [x] Ortak admin API katmani eklendi ve endpoint baglantilari merkezi hale getirildi
- [x] Coklu admin route entegrasyonu sonrasi frontend build tekrar dogrulandi (`npm run build`)
- [x] Kullanilmayan eski admin monolit dosyasi temizlendi (`apps/frontend/src/pages/AdminPage.tsx` silindi)
- [x] Cleanup sonrasi frontend build tekrar dogrulandi (`npm run build`)
- [x] Sidebar menu ikonlari + aktif/hover animasyonlari eklendi
- [x] Sidebar altina kullanici karti ve tekil cikis aksiyonu eklendi
- [x] Sidebar UX iyilestirmesi sonrasi frontend build tekrar dogrulandi (`npm run build`)
- [x] Personel sayfalari admin ile ayni yaklasima gecirildi (sidebar tabanli coklu route)
- [x] Personel route'lari ayrildi (`dashboard`, `patients`, `triage`, `records`)
- [x] Personel `records` sayfasi eklendi (listeleme + arama + override duzenleme)
- [x] Personel API katmanina `updateRecordOverride` eklendi
- [x] Personel coklu sayfa entegrasyonu sonrasi frontend build tekrar dogrulandi (`npm run build`)
- [x] Personel UI ikinci tur modernizasyonu yapildi (hero + KPI + quick-link + kart hiyerarsisi)
- [x] Personel records ekrani yeni kart/meta duzeni ile referansa yaklastirildi
- [x] Personel triage ses kontrol alani daha okunur grid duzene tasindi
- [x] Personel modernizasyonu sonrasi frontend build tekrar dogrulandi (`npm run build`)
- [x] Admin paneli final polish tamamlandi (`admin-pro` motion, kart hover iyilestirmesi, sticky/zebra table, inline style cleanup)
- [x] Admin final polish sonrasi frontend build tekrar dogrulandi (`npm run build --workspace=apps/frontend`)
- [x] Kalici sistem log altyapisi eklendi (`system_logs` table + endpoint + filtreleme)
- [x] Login/Logout ve triyaj create/override olaylari backend log kayitlarina baglandi
- [x] `/api/auth/me` adSoyad alanini doner hale getirildi; frontend AppShell ad-soyad + rol rozeti + son giris zamani gosteriyor
- [x] Admin log ekrani gercek sistem log endpointi ve secimli hizli filtrelerle guncellendi
- [x] Bu turda backend test + frontend build tekrar dogrulandi (`mvn test`, `npm run build --workspace=apps/frontend`)
- [x] Admin log ekraninda eski triage olaylarini da default gosteren geriye donuk birlestirme eklendi (`system_logs` + `triage_records` sentetik log merge + dedup)
- [x] Unit test kapsami genisletildi (`ModelInferenceServiceUnitTest`, `SystemLogServiceUnitTest`)
- [x] Operasyon runbook dosyasi eklendi (`memory-bank/deployment/operations-runbook.md`)
- [x] Final teslim raporu guncellendi (model + test + deploy durumu tek dokumanda toplandi)
- [x] DB backup/restore otomasyonu eklendi (`infra/db-backup.sh`, `infra/db-restore.sh`, `infra/setup-db-backup-cron.sh`)
- [x] Operasyon runbook'una backup/restore/cron adimlari eklendi
- [x] Crontab yetki kisitina alternatif `systemd --user` backup timer kurulumu eklendi (`infra/setup-db-backup-systemd-user.sh`)
- [x] Personel triage ekraninda "hasta bulunamadiysa olustur" akisi geri eklendi
- [x] Kaydedilmemis tahmin varken sayfa degisim/sekme kapatma uyarisi eklendi
- [x] Logout aksiyonuna kullanici onay penceresi eklendi
- [x] Personel triage: TC 11 hanede otomatik hasta sorgu + bulunamazsa otomatik hasta olusturma paneli akisi eklendi
- [x] Personel triage: arama hatasi olsa bile hasta olusturma paneli acik kalacak sekilde bloklayici davranis giderildi
- [x] Personel triage: hasta olusturma paneli `TC 11 hane + secili hasta yok` kuralina sabitlendi
- [x] Admin/personel sayfalarindaki ust mor bant (global shell stripe) kaldirildi
- [x] Personel triage altina `Kayıtlı Hastalar` bolumu eklendi (listele + duzenle)
- [x] `Kayıtlı Hastalar` konumu triage icinden sidebar'da ayri personel sayfasina tasindi (`/personel/patients`)
- [x] `Tahmini Kaydet` aksiyonu tahmin karti icine tasindi (override + kaydetme ayni blokta)

## Bekleyen Kısımlar
- STT canli stream fazi (MVP sonrasi iyilestirme)
- Merkezi log izleme (ELK/Grafana Loki) entegrasyonu (opsiyonel)
- Yeni model benchmark fazi (Transformer / BERT / LSTM)
  - [ ] Faz-1: Deney protokolu dondurulacak (split/seed/metric)
  - [ ] Faz-2: LSTM deneyi tamamlanacak
  - [ ] Faz-3: BERT deneyi tamamlanacak
  - [ ] Faz-4: BERT disi Transformer deneyi tamamlanacak
  - [ ] Faz-5: Klinik odakli nihai model secimi ve artifact guncellemesi

## Bilinen Riskler
- STT canlı akış karmaşıklığı geliştirme süresini uzatabilir
- Dataset etiket kalitesi model başarımını doğrudan etkiler
- Override süreçleri net kural seti olmadan veri kirlenmesi doğurabilir

## Dönüm Noktaları
1. Sistem analiz/tasarım dokümanını dondur
2. Monorepo iskeletini aç
3. Auth + Hasta + Triyaj minimal API
4. Personel ekranı uçtan uca
5. Admin dataset/export ekranı
6. UAT + raporlama

## Tik Sistemi Kullanımı
- Tamamlanan her maddeyi `[ ]` -> `[x]` olarak işaretle.
- Kısmi tamamlanan işler için madde sonuna kısa not düş: `(kısmi)`
- Bu dosya haftalık durum raporu olarak kullanılacak ana takip ekranıdır.
