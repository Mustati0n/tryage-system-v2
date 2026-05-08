# System Patterns (backend)

## Mimari
- Controller -> Service -> Repository
- DTO + validation + global exception handler

## Kritik Patternler
- RBAC: ADMIN/PERSONEL
- Audit trail: override, dataset ekleme, export
- Triage akışı: stt -> predict -> records

## Veri Kısıtları
- `tcKimlikNo` unique
- `dataset.triageKayitId` unique
- `guven` aralığı `0..1`
