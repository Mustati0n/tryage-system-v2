# Is Paylasimi ve Gelistirme Akisi

## 1) Is Paylasimi (2 Kisi)

### Backend Sorumlusu
- Domain model + migration
- Auth + RBAC
- Hasta/Triyaj/Admin/Dataset API'leri
- STT + model entegrasyonu
- Logging/audit + export
- API dokumantasyonu + test

### Frontend Sorumlusu
- Login sayfasi
- Personel paneli (hasta + triyaj + override + kendi kayitlarim)
- Admin paneli (tablo/filtre/detay/dataset/export)
- Form validasyon + hata durumlari
- API entegrasyonu + UX iyilestirme

## 2) Entegrasyon Sozlesmesi
- Ortak enum/DTO tek kaynaktan: `packages/contracts` (hedef yapı)
- Frontend sadece kontrat dosyalarini referans almali
- Breaking change oldugunda versiyon notu zorunlu

## 3) Gelistirme Akisi
1. Kontrat onayi
2. Backend mock endpointler
3. Frontend ekran baglantilari
4. Gercek model/STT entegrasyonu
5. Uc uca test ve hata duzeltme

Karar notlari:
- Auth JWT (`access + refresh`)
- STT local model (MVP batch)
- Ses saklama opsiyonel
- Confidence backend `0..1`, UI `%`

## 4) Minimum Uc Uca Senaryolar
1. Personel: login -> hasta bul/olustur -> triyaj -> tahmin -> override
2. Admin: login -> kayit filtrele -> dataset'e ekle -> export al

## 5) Kod Kalitesi
- PR checklist: validasyon, hata modeli, loglama, test
- Her endpoint icin en az bir integration test
- UI'da kritik formlar icin smoke test
