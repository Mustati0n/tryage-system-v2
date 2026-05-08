package com.akillitriage.service;

import com.akillitriage.api.NotFoundException;
import com.akillitriage.dto.PatientDtos;
import com.akillitriage.entity.PatientEntity;
import com.akillitriage.repository.PatientRepository;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class PatientService {
  private final PatientRepository patientRepository;

  public PatientService(PatientRepository patientRepository) {
    this.patientRepository = patientRepository;
  }

  public PatientDtos.PatientResponse create(PatientDtos.PatientCreateRequest request) {
    PatientEntity entity = patientRepository.findByTcKimlikNo(request.tcKimlikNo()).orElseGet(PatientEntity::new);
    entity.setAd(request.ad());
    entity.setSoyad(request.soyad());
    entity.setTcKimlikNo(request.tcKimlikNo());
    entity.setDogumTarihi(LocalDate.parse(request.dogumTarihi()));
    entity.setCinsiyet(request.cinsiyet());
    return toResponse(patientRepository.save(entity));
  }

  public List<PatientDtos.PatientResponse> list(String q, String tcKimlikNo) {
    if (tcKimlikNo != null && !tcKimlikNo.isBlank()) {
      return patientRepository.findByTcKimlikNo(tcKimlikNo).map(this::toResponse).stream().toList();
    }

    String normalized = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
    List<PatientDtos.PatientResponse> results = new java.util.ArrayList<>();
    for (PatientEntity r : patientRepository.findAll()) {
      if (normalized.isBlank()
          || r.getAd().toLowerCase(Locale.ROOT).contains(normalized)
          || r.getSoyad().toLowerCase(Locale.ROOT).contains(normalized)
          || r.getTcKimlikNo().contains(normalized)) {
        results.add(toResponse(r));
      }
    }
    results.sort(java.util.Comparator.comparing(PatientDtos.PatientResponse::hastaId));
    return results;
  }

  public PatientDtos.PatientResponse getById(Long id) {
    PatientEntity r = patientRepository.findById(id).orElseThrow(() -> new NotFoundException("Hasta bulunamadi"));
    return toResponse(r);
  }

  public PatientDtos.PatientResponse update(Long id, PatientDtos.PatientUpdateRequest request) {
    PatientEntity old = patientRepository.findById(id).orElseThrow(() -> new NotFoundException("Hasta bulunamadi"));
    old.setAd(request.ad());
    old.setSoyad(request.soyad());
    old.setDogumTarihi(LocalDate.parse(request.dogumTarihi()));
    old.setCinsiyet(request.cinsiyet());
    return toResponse(patientRepository.save(old));
  }

  private PatientDtos.PatientResponse toResponse(PatientEntity r) {
    return new PatientDtos.PatientResponse(
        r.getId(),
        r.getAd(),
        r.getSoyad(),
        r.getTcKimlikNo(),
        r.getDogumTarihi().toString(),
        r.getCinsiyet(),
        Period.between(r.getDogumTarihi(), LocalDate.now()).getYears());
  }
}
