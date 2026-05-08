# Progress (frontend)

## Faz Bazlı Tikli İlerleme
### Faz-0
- [x] Ekran kapsamı netleşti
- [x] API sözleşmesi referansı netleşti

### Faz-1
- [x] Frontend klasör iskeleti açıldı
- [x] Router + route guard yapısı kuruldu
- [x] Ortak layout ve tema yapısı hazır

### Faz-2
- [x] Login ekranı tamamlandı
- [x] Personel paneli iskeleti tamamlandı
- [x] Admin paneli iskeleti tamamlandı

### Faz-3
- [x] Patients/Triage akışları API ile bağlı (MVP: personel panelde arama/oluşturma + tahmin/kaydet)
- [x] Admin kayıt/dataset/export API ile bağlı (MVP)
- [x] Auth refresh token döngüsü bağlı (Axios response interceptor + retry)
- [x] Personel panelinde ses upload + STT transcript akışı bağlı
- [x] Personel panelinde tarayıcı içi ses kaydı (mikrofon) bağlı
- [x] Hata mesajları bölgesel ayrıştırıldı (Hasta / Triyaj-STT)
- [x] Personel "Kendi Kayıtlarım" + override düzenleme UI bağlı
- [x] Tahmin kartında kaydetme öncesi override UI bağlı
- [x] Admin filtreleri genişletildi (etiket + confidence aralığı + override + tarih)
- [x] Hata ve boş durum ekranları güçlendirildi (loading/empty/ön koşul aksiyonları)
- [x] Dataset'e ekle UX güçlendirildi (zaten dataset'te kontrolu + tekrar ekleme engeli + ayri bilgilendirme mesaji)
- [x] Admin panelinde kullanici yonetimi UI baglandi (kullanici listele/ekle/aktif-pasif)
- [x] Admin panelinde "Deneme / Simulasyon Triyaj" UI baglandi (`/api/triage/predict`)
- [x] Admin panelinde "Sistem Loglari / Durum Ozeti" UI baglandi (`/api/system/stats`, `/api/system/models`)
- [x] `a_tt.zip` tasarim kaynagi analiz edilip mevcut projeye uyarlanmis UI birlestirmesi yapildi
- [x] Global stil dosyasi eklendi (`src/styles.css`) ve uygulamaya baglandi
- [x] Login sayfasi yeni kart tabanli tasarima alindi
- [x] Personel/Admin sayfalari ortak tema sinifi (`triage-page`) ile modernize edildi
- [x] Role bazli sidebar/topbar shell eklendi (`src/components/AppShell.tsx`)
- [x] Router shell ile entegre edildi (login haric korumali sayfalar)
- [x] Sidebar hizli erisim icin bolum anchor id'leri eklendi (personel/admin)
- [x] Triyaj etiket badge sistemi eklendi (`styles.css`)
- [x] Personel/Admin kritik etiket alanlari badge UI'a cevrildi
- [x] Admin paneli referans screenshotlara daha yakin dashboard duzenine cekildi
- [x] Admin KPI/trend/donut/model/personel bloklari eklendi
- [x] Admin kayit/dataset/personel/log/simulasyon bolumleri yeni layouta tasindi (islev korunarak)
- [x] Admin tek sayfa yerine coklu route yapisina gecildi (sidebar fonksiyonel)
- [x] Yeni admin sayfalari eklendi (`dashboard`, `records`, `personnel`, `logs`)
- [x] Admin backend entegrasyonu ortak API katmaninda toplandi (`pages/admin/adminApi.ts`)
- [x] Eski `src/pages/AdminPage.tsx` monolit dosyasi kaldirildi (cleanup)
- [x] Sidebar menulerine ikon + aktif/hover animasyonlari eklendi
- [x] Sidebar altina kullanici karti ve cikis butonu eklendi
- [x] Personel tarafi da coklu route mimarisine tasindi (`dashboard`, `patients`, `triage`, `records`)
- [x] Personel `records` sayfasi eklendi (kendi kayitlari + arama + override duzenleme)
- [x] Personel sidebar linkleri hash yerine route bazli calisir hale getirildi
- [x] Personel sayfalari ikinci tur modernize edildi (hero + KPI + quick-link + kart hiyerarsisi)
- [x] Personel records ekrani yeni kart/meta duzeniyle referansa yaklastirildi
- [x] Personel triage ses kontrol alani daha okunur grid duzene alindi
- [x] Masaustu full-width layout guncellemesi yapildi (ortada dar kolon sorunu kaldirildi)
- [x] Global CSS tema referans dashboard diline daha yakin hale getirildi
- [x] Sidebar referansina yakin logo-baslik-kapatma satiri ve aktif ikon renk davranisi duzeltildi
- [x] Personel sayfalarindaki hizli secim link satirlari kaldirildi
- [x] Personel triage sayfasi referans kart bantlari + ses alani yapisina yaklastirildi
- [x] Sidebar ikonlari SVG tabanli daha mantikli setle guncellendi (hasta/triyaj dahil)
- [x] Kayitlarim sayfasina detay paneli eklendi (Turkce alanlar + Guven Skoru detayda)
- [x] Kayit listesinde `Confidence` metni kaldirildi, kayit detayina tasindi
- [x] Kayit detayi ekranina ayri `Final Karar` karti eklendi
- [x] Seviye terimleri Turkcelestirildi (`Acil / Orta / Dusuk`)
- [x] `Detayı Gör` akisi ortada acilan modal panel olarak yeniden tasarlandi
- [x] Sidebar `Cikis Yap` butonu tema ile uyumlu hale getirildi
- [x] Detay modalina `Esc` ve `X` ile kapatma eklendi
- [x] Admin dashboard yatay hizli kisayol satiri kaldirildi
- [x] Personel kayit listesinde model metni kaldirildi (detayda birakildi)
- [x] Kayit detay modalindeki `X` butonu daha duzgun ortali hizaya alindi
- [x] Personel kayit aramasina hizli etiket filtreleri eklendi (`Tum Etiketler/KIRMIZI/SARI/YESIL`)
- [x] Etiket aramasinda Turkce karakter normalize arama eklendi (`sari/sarı` gibi varyasyonlar)
- [x] Personel triage `Sikayet Bilgileri` blogu bastan modernize edildi (metin + ses akisi daha profesyonel/kolay kullanim)
- [x] Kayıt arama inputunda beyaz ekran bug'i giderildi (fonksiyon sirasi/runtime hata fix)
- [x] Personel `Hasta Islemleri` ekraninda gereksiz yeni-hasta paneli kaldirildi
- [x] Secili hasta karti kosullu gosterimle "takili kalma" davranisi iyilestirildi
- [x] Personel draft state'i (TC + triage form + auto-STT) sayfalar arasi korunur hale getirildi
- [x] Auto-STT checkbox hizasi ve gorunumu duzeltildi
- [x] Dashboard KPI kartlari 4'lu yatay ve daha profesyonel iconlu tasarima tasindi
- [x] Login ekrani bastan profesyonel tasarlandi (yeni layout + atmosferik arkaplan + giris animasyonlari)
- [x] Personel menuden ve route'tan `Hasta Islemleri` sayfasi kaldirildi
- [x] Login'de canli rol ipucu + input/button mikro etkileşim animasyonlari eklendi
- [x] Personel sayfalarina ortak motion/polish katmani eklendi (`personel-pro`)
- [x] Kayıtlarım kartinda override yoksa yalniz `Final`, override varsa `Orijinal + Final` gosterim mantigi uygulandi
- [x] Triyaj `Hasta Bilgileri` blogu bastan daha profesyonel yapida yeniden tasarlandi (yeni sorgu satiri + secili hasta ozet karti)
- [x] Admin paneli final polish uygulandi (`admin-pro` motion + hero/panel hover + sticky/zebra table + inline style cleanup)
- [x] Admin final polish sonrasi build tekrar dogrulandi (`npm run build --workspace=apps/frontend`)
- [x] Sidebar kullanici karti dinamiklestirildi (login username saklama + JWT `sub` fallback + logout temizleme)
- [x] Dinamik kullanici karti guncellemesi sonrasi build tekrar dogrulandi (`npm run build --workspace=apps/frontend`)
- [x] Sidebar kullanici karti `/api/auth/me` ile ad-soyad destekli hale getirildi (rol rozeti + son giris zamani)
- [x] Admin log ekrani `/api/system/logs` ile gercek sistem loglarina gecirildi
- [x] Admin log arama bolumune secimli filtreler eklendi (islem turu, rol, tarih araligi)
- [x] Bu turda backend test + frontend build tekrar dogrulandi (`mvn test`, `npm run build --workspace=apps/frontend`)
- [x] Admin Sistem Loglari varsayilan gorunumunde eski triage olaylari da listelenir hale getirildi (backend `system_logs + triage_records` merge)

### Faz-4
- [x] Uçtan uca kullanıcı akışları doğrulandı (Playwright mock 4/4 + real backend 4/4 geçti)
- [x] Responsive kontroller tamamlandı (personel form grid + login padding + admin filtre/dataset alanlari mobil uyumlu)
- [x] Real-backend Playwright testlerine kullanici yonetimi senaryosu eklendi (toplam 4 test listeleniyor)
- [x] Real-backend tahmin assertioni model-agnostic hale getirildi (etiket enum regex)

### Faz-5
- [x] Frontend production build doğrulandı
