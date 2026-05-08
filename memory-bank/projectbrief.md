# Proje Özeti (Akıllı Triage System)

## Proje Amacı
Acil başvuru sürecinde personelin hasta şikayetini metin/ses olarak alıp, yapay zeka ile triyaj etiketi (KIRMIZI/SARI/YESIL) tahmini üreten, gerektiğinde override destekleyen ve admin tarafında dataset yönetimi + export yapılabilen bir sistem geliştirmek.

## Kapsam
- Rol bazlı giriş: `PERSONEL`, `ADMIN`
- Kullanıcı yönetimi (admin tarafından kullanıcı açma/aktif-pasif)
- Hasta bulma/oluşturma (TC kimlik no ile)
- Triyaj kaydı oluşturma (metin veya ses->metin; MVP'de batch STT)
- Model tahmini + confidence + model versiyonu saklama
- Override ve neden saklama
- Admin kayıt filtreleme, dataset’e ekleme, export (CSV/JSON)
- Manuel deployment ve güncelleme

## Çalışma Topolojisi
- Tek repo (monorepo): frontend + backend + ortak sözleşme + dokümantasyon
- 2 kişi geliştirme:
  - Backend geliştirici: domain, API, DB, model entegrasyonu
  - Frontend geliştirici: ekranlar, form/akış, API entegrasyonu

## Başarı Kriterleri
- Personel 1 kaydı uçtan uca (hasta bul/oluştur -> triyaj -> tahmin -> opsiyonel override) tamamlayabilmeli
- Admin dataset iş akışı çalışmalı (listele -> etiketle -> export)
- Tüm kritik adımlar loglanmalı ve denetlenebilir olmalı
- Ortak veri sözleşmesi frontend/backend arasında tek kaynaktan yönetilmeli

## Varsayımlar
- `bitirme_api_analiz.docx` endpoint analizi temel alınmıştır.
- Kararlar, kullanıcı gereksinimleri + UML şema (`image (1).png`) + API analizi üzerinden çıkarıldı.
