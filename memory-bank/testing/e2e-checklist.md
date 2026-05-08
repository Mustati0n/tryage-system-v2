# E2E ve Kabul Test Checklist (Model Harici)

Not:
- Model bagimli kontroller icin ayri dosya kullanilir: `memory-bank/testing/model-e2e-checklist.md`

## Hazirlik
- [ ] PostgreSQL ayakta
- [ ] Backend ayakta
- [ ] Frontend ayakta
- [ ] Demo kullanicilar ile login olabiliyor (`admin/admin123`, `personel/personel123`)

## Senaryo-1 Personel Uc Uca
- [ ] Personel login basarili
- [ ] TC ile hasta arama calisiyor
- [ ] Hasta yoksa olusturma calisiyor
- [ ] Ses kaydi veya dosya upload ile STT transcript geliyor
- [ ] Tahmin aliniyor (etiket + confidence gorunuyor)
- [ ] Kaydetme oncesi override yapilabiliyor
- [ ] Kayit olustuktan sonra "Kendi Kayitlarim" listesinde gorunuyor
- [ ] Kayitta orijinal etiket ve override etiketi ayrik gorunuyor

## Senaryo-2 Admin Uc Uca
- [ ] Admin login basarili
- [ ] Kayit tablosu aciliyor
- [ ] Etiket/confidence/override/tarih filtreleri calisiyor
- [ ] Kayit secilip dataset'e eklenebiliyor
- [ ] Ayni kayit ikinci kez eklenmeye calisilinca UI bunu "zaten dataset'te" olarak gosteriyor
- [ ] Kullanici yonetimi ekranindan yeni personel eklenebiliyor
- [ ] Eklenen kullanici aktif/pasif yapilabiliyor
- [ ] Dataset export CSV calisiyor
- [ ] Dataset export JSON calisiyor

## Guvenlik/RBAC
- [ ] Personel `dataset` endpointlerine erisemiyor
- [ ] `records/me` yalnizca olusturan kullanicinin kayitlarini donuyor

## Smoke Sonucu
- [ ] `infra/smoke-check.sh` basarili
- [ ] Kritik hata yok
