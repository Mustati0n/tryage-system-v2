# Progress (backend)

## Faz Bazlı Tikli İlerleme
### Faz-0
- [x] Backend kapsamı netleşti
- [x] Auth/STT/retention kararları netleşti

### Faz-1
- [x] Backend klasör iskeleti açıldı
- [x] Build/run scriptleri hazır (`mvn compile`, `mvn spring-boot:run`)

### Faz-2
- [x] DB migrationlar yazıldı (Flyway V1)
- [x] Entity/Repository katmanı hazır (JPA)

### Faz-3
- [x] Auth endpointleri tamamlandı (MVP+: `login/me/logout/refresh`)
- [x] Patients endpointleri tamamlandı (MVP, records detayi placeholder)
- [x] Triage endpointleri tamamlandı (MVP+, STT local batch entegrasyonu)
- [x] Refresh token kalıcı tablo + rotation tamamlandı
- [x] Personel my-records endpointi eklendi (`GET /api/triage/records/me`)

### Faz-4
- [x] Dataset/System endpointleri tamamlandı (MVP)
- [x] Integration testler tamamlandı (`auth`, `patients`, `triage`, `dataset`, `triage/records/me`, `dataset/items`, admin filtre + pre-save override MockMvc)

### Faz-5
- [ ] Local deployment doğrulandı (kısmi: `mvn test` başarılı, PostgreSQL ile full runtime check bekliyor)
