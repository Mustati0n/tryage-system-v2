package com.akillitriage.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.akillitriage.dto.AdminDtos;
import com.akillitriage.entity.PatientEntity;
import com.akillitriage.entity.SystemLogEntity;
import com.akillitriage.entity.TriageRecordEntity;
import com.akillitriage.repository.SystemLogRepository;
import com.akillitriage.repository.TriageRecordRepository;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class SystemLogServiceUnitTest {

  @Mock private SystemLogRepository systemLogRepository;
  @Mock private TriageRecordRepository triageRecordRepository;

  @Test
  void shouldIncludeSyntheticTriageLogsWhenNoPersistentTriageLogsExist() {
    SystemLogService service = new SystemLogService(systemLogRepository, triageRecordRepository);
    OffsetDateTime now = OffsetDateTime.now();

    SystemLogEntity authLog = new SystemLogEntity();
    authLog.setActionType("AUTH_LOGIN");
    authLog.setActorUsername("admin");
    authLog.setActorRole("ADMIN");
    authLog.setDescription("Kullanici giris yapti");
    authLog.setCreatedAt(now.minusMinutes(1));

    TriageRecordEntity triageRecord = buildTriageRecord(101L, 7L, now.minusMinutes(2), null, "personel");

    when(systemLogRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(authLog));
    when(triageRecordRepository.findAllByOrderByBasvuruZamaniDesc()).thenReturn(List.of(triageRecord));

    List<AdminDtos.SystemLogResponse> result = service.list(null, null, null, null, null, 50);

    assertThat(result).hasSize(2);
    assertThat(result.stream().anyMatch(l -> "TRIAGE_CREATE".equals(l.actionType()))).isTrue();
    assertThat(result.stream().anyMatch(l -> l.description().contains("kayitId=101"))).isTrue();
  }

  @Test
  void shouldNotDuplicateSyntheticCreateLogWhenPersistentLogAlreadyExists() {
    SystemLogService service = new SystemLogService(systemLogRepository, triageRecordRepository);
    OffsetDateTime now = OffsetDateTime.now();

    SystemLogEntity persistentCreateLog = new SystemLogEntity();
    persistentCreateLog.setActionType("TRIAGE_CREATE");
    persistentCreateLog.setActorUsername("personel");
    persistentCreateLog.setActorRole("PERSONEL");
    persistentCreateLog.setDescription("Triyaj kaydi olusturuldu: kayitId=202, hastaId=3");
    persistentCreateLog.setCreatedAt(now.minusMinutes(1));

    TriageRecordEntity sameRecord = buildTriageRecord(202L, 3L, now.minusMinutes(5), null, "personel");

    when(systemLogRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(persistentCreateLog));
    when(triageRecordRepository.findAllByOrderByBasvuruZamaniDesc()).thenReturn(List.of(sameRecord));

    List<AdminDtos.SystemLogResponse> result = service.list(null, "TRIAGE_CREATE", null, null, null, 50);

    assertThat(result).hasSize(1);
    assertThat(result.get(0).description()).contains("kayitId=202");
  }

  @Test
  void shouldCreateSyntheticOverrideLogForOverriddenRecord() {
    SystemLogService service = new SystemLogService(systemLogRepository, triageRecordRepository);
    OffsetDateTime now = OffsetDateTime.now();

    TriageRecordEntity overriddenRecord =
        buildTriageRecord(303L, 11L, now.minusMinutes(3), "KIRMIZI", "personel");
    overriddenRecord.setEtiket("SARI");

    when(systemLogRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
    when(triageRecordRepository.findAllByOrderByBasvuruZamaniDesc())
        .thenReturn(List.of(overriddenRecord));

    List<AdminDtos.SystemLogResponse> result = service.list(null, "TRIAGE_OVERRIDE", null, null, null, 50);

    assertThat(result).hasSize(1);
    assertThat(result.get(0).actionType()).isEqualTo("TRIAGE_OVERRIDE");
    assertThat(result.get(0).description()).contains("SARI -> KIRMIZI");
  }

  private TriageRecordEntity buildTriageRecord(
      Long recordId, Long patientId, OffsetDateTime basvuruZamani, String overrideEtiket, String username) {
    PatientEntity patient = new PatientEntity();
    ReflectionTestUtils.setField(patient, "id", patientId);

    TriageRecordEntity record = new TriageRecordEntity();
    ReflectionTestUtils.setField(record, "id", recordId);
    record.setHasta(patient);
    record.setYas(35);
    record.setCinsiyet("ERKEK");
    record.setSikayetMetni("ornek sikayet");
    record.setEtiket("YESIL");
    record.setGuven(0.61);
    record.setModelVersiyonu("tfidf_svm-v1");
    record.setDurum("TAHMIN_EDILDI");
    record.setOverrideEtiket(overrideEtiket);
    record.setBasvuruZamani(basvuruZamani);
    record.setCreatedByKullaniciAdi(username);
    return record;
  }
}

