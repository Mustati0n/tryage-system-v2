# Proje Özeti (backend)

## Amaç
Akıllı Triage System için backend tarafında güvenli, test edilebilir ve üretime taşınabilir API/DB altyapısını geliştirmek.

## Kapsam
- JWT auth (`access + refresh`)
- Users, Patients, Triage, Dataset, System endpointleri
- Local STT (MVP batch) + model entegrasyon katmanı
- PostgreSQL + migration + audit log

## Topoloji
- Tek repo içinde backend modülü
- Sistem şu an local çalışacak, tasarım sonradan sunucuya taşınmaya uygun olacak

## Başarı Kriteri
- Tüm kritik endpointler kontrata uygun çalışır
- Personel ve admin ana akışları backend tarafında uçtan uca tamamlanır
