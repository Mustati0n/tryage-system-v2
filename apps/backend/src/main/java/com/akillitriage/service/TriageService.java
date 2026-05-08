package com.akillitriage.service;

import com.akillitriage.api.NotFoundException;
import com.akillitriage.dto.TriageDtos;
import com.akillitriage.entity.PatientEntity;
import com.akillitriage.entity.TriageRecordEntity;
import com.akillitriage.repository.PatientRepository;
import com.akillitriage.repository.TriageRecordRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.function.Predicate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class TriageService {
  private final TriageRecordRepository triageRecordRepository;
  private final PatientRepository patientRepository;
  private final ModelInferenceService modelInferenceService;
  private final SystemLogService systemLogService;

  public TriageService(
      TriageRecordRepository triageRecordRepository,
      PatientRepository patientRepository,
      ModelInferenceService modelInferenceService,
      SystemLogService systemLogService) {
    this.triageRecordRepository = triageRecordRepository;
    this.patientRepository = patientRepository;
    this.modelInferenceService = modelInferenceService;
    this.systemLogService = systemLogService;
  }

  public TriageDtos.TriagePredictResponse predict(TriageDtos.TriagePredictRequest request) {
    return modelInferenceService.predict(request);
  }

  public TriageDtos.TriageRecordResponse create(
      TriageDtos.TriageRecordCreateRequest request, String createdByKullaniciAdi) {
    PatientEntity patient =
        patientRepository
            .findById(request.hastaId())
            .orElseThrow(() -> new NotFoundException("Hasta bulunamadi"));
    TriageRecordEntity entity = new TriageRecordEntity();
    entity.setHasta(patient);
    entity.setYas(request.yas());
    entity.setCinsiyet(request.cinsiyet());
    entity.setSikayetMetni(request.sikayetMetni());
    entity.setEtiket(request.etiket());
    entity.setGuven(request.guven());
    entity.setModelVersiyonu(request.modelVersiyonu());
    entity.setSesDosyaYolu(request.sesDosyaYolu());
    if (StringUtils.hasText(request.overrideEtiket())) {
      entity.setOverrideEtiket(request.overrideEtiket());
      entity.setOverrideNedeni(request.overrideNedeni());
    }
    entity.setDurum("TAHMIN_EDILDI");
    entity.setBasvuruZamani(OffsetDateTime.now());
    entity.setCreatedByKullaniciAdi(createdByKullaniciAdi);
    TriageRecordEntity saved = triageRecordRepository.save(entity);
    systemLogService.log(
        "TRIAGE_CREATE",
        createdByKullaniciAdi,
        "PERSONEL",
        "Triyaj kaydi olusturuldu: kayitId=" + saved.getId() + ", hastaId=" + patient.getId());
    return toResponse(saved);
  }

  public List<TriageDtos.TriageRecordResponse> list() {
    return triageRecordRepository.findAllByOrderByBasvuruZamaniDesc().stream().map(this::toResponse).toList();
  }

  public List<TriageDtos.TriageRecordResponse> list(
      String etiket,
      Double confidenceMin,
      Double confidenceMax,
      Boolean overrideVarMi,
      String tarihBaslangic,
      String tarihBitis) {
    Predicate<TriageRecordEntity> byEtiket =
        r -> !StringUtils.hasText(etiket) || etiket.equalsIgnoreCase(r.getEtiket());
    Predicate<TriageRecordEntity> byConfidenceMin = r -> confidenceMin == null || r.getGuven() >= confidenceMin;
    Predicate<TriageRecordEntity> byConfidenceMax = r -> confidenceMax == null || r.getGuven() <= confidenceMax;
    Predicate<TriageRecordEntity> byOverride =
        r -> overrideVarMi == null || overrideVarMi.equals(StringUtils.hasText(r.getOverrideEtiket()));

    LocalDate from = parseDate(tarihBaslangic);
    LocalDate to = parseDate(tarihBitis);
    Predicate<TriageRecordEntity> byDate =
        r -> {
          LocalDate recordDate = r.getBasvuruZamani().toLocalDate();
          if (from != null && recordDate.isBefore(from)) {
            return false;
          }
          if (to != null && recordDate.isAfter(to)) {
            return false;
          }
          return true;
        };

    return triageRecordRepository.findAllByOrderByBasvuruZamaniDesc().stream()
        .filter(byEtiket.and(byConfidenceMin).and(byConfidenceMax).and(byOverride).and(byDate))
        .map(this::toResponse)
        .toList();
  }

  public List<TriageDtos.TriageRecordResponse> listMine(String username) {
    return triageRecordRepository.findAllByCreatedByKullaniciAdiIgnoreCaseOrderByBasvuruZamaniDesc(username).stream()
        .map(this::toResponse)
        .toList();
  }

  public TriageDtos.TriageRecordResponse getById(Long id) {
    TriageRecordEntity r =
        triageRecordRepository
            .findById(id)
            .orElseThrow(() -> new NotFoundException("Triyaj kaydi bulunamadi"));
    return toResponse(r);
  }

  public TriageDtos.TriageRecordResponse override(Long id, TriageDtos.OverrideRequest request) {
    TriageRecordEntity old =
        triageRecordRepository
            .findById(id)
            .orElseThrow(() -> new NotFoundException("Triyaj kaydi bulunamadi"));
    String previous = old.getOverrideEtiket() != null ? old.getOverrideEtiket() : old.getEtiket();
    old.setOverrideEtiket(request.overrideEtiket());
    old.setOverrideNedeni(request.overrideNedeni());
    TriageRecordEntity saved = triageRecordRepository.save(old);
    String actor = StringUtils.hasText(saved.getCreatedByKullaniciAdi()) ? saved.getCreatedByKullaniciAdi() : "personel";
    systemLogService.log(
        "TRIAGE_OVERRIDE",
        actor,
        "PERSONEL",
        "Triyaj override edildi: kayitId="
            + saved.getId()
            + ", "
            + previous
            + " -> "
            + request.overrideEtiket());
    return toResponse(saved);
  }

  public void deleteMine(Long id, String username) {
    TriageRecordEntity record =
        triageRecordRepository
            .findByIdAndCreatedByKullaniciAdiIgnoreCase(id, username)
            .orElseThrow(() -> new NotFoundException("Triyaj kaydi bulunamadi"));
    triageRecordRepository.delete(record);
    systemLogService.log(
        "TRIAGE_DELETE",
        username,
        "PERSONEL",
        "Triyaj kaydi silindi: kayitId=" + id + ", hastaId=" + record.getHasta().getId());
  }

  private LocalDate parseDate(String value) {
    if (!StringUtils.hasText(value)) {
      return null;
    }
    try {
      return LocalDate.parse(value);
    } catch (Exception ex) {
      throw new IllegalArgumentException("Tarih formati gecersiz. Beklenen format: YYYY-MM-DD");
    }
  }

  private TriageDtos.TriageRecordResponse toResponse(TriageRecordEntity r) {
    return new TriageDtos.TriageRecordResponse(
        r.getId(),
        r.getHasta().getId(),
        r.getEtiket(),
        r.getGuven(),
        r.getSikayetMetni(),
        r.getModelVersiyonu(),
        r.getDurum(),
        r.getOverrideEtiket(),
        r.getOverrideNedeni(),
        r.getBasvuruZamani());
  }
}
