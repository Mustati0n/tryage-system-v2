# Product Context

## Neden Bu Proje Var?
Acil triyaj sürecinde karar süresini kısaltmak, kayıt standardını artırmak ve model destekli karar önerisi sunmak için.

## Çözdüğü Problem
- Personel şikayet bilgisini farklı kalitede/topluyor; standardizasyon düşük.
- Sesli anlatımın metne çevrilmesi ve kayıt altına alınması manuel süreçlerde zor.
- Admin tarafında eğitim verisi (dataset) oluşturma ve dışa aktarma tek yerden yönetilemiyor.

## Hedef Kullanıcılar
- `PERSONEL`: hasta kayıt + triyaj + tahmin + override
- `ADMIN`: tüm kayıtları izleme, kalite/dataset yönetimi, export

## UX Hedefleri
- Basit, hızlı, az tıklama ile iş akışı
- Personel ekranında minimum bilişsel yük
- Admin ekranında güçlü filtreleme ve denetlenebilir kayıt detayları
- Hata durumlarında net ve eyleme dönük mesajlar

## Ürün Sınırları (MVP)
- Hastane HBYS entegrasyonu yok (şimdilik bağımsız sistem)
- Gerçek zamanlı model eğitim/pipeline yok (manuel veya ayrı süreç)
- Mobil native uygulama yok (responsive web yeterli)
