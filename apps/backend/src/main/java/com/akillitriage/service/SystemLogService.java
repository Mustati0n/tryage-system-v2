package com.akillitriage.service;

import com.akillitriage.dto.AdminDtos;
import com.akillitriage.entity.SystemLogEntity;
import com.akillitriage.entity.TriageRecordEntity;
import com.akillitriage.repository.SystemLogRepository;
import com.akillitriage.repository.TriageRecordRepository;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Predicate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class SystemLogService {
  private final SystemLogRepository systemLogRepository;
  private final TriageRecordRepository triageRecordRepository;

  public SystemLogService(
      SystemLogRepository systemLogRepository, TriageRecordRepository triageRecordRepository) {
    this.systemLogRepository = systemLogRepository;
    this.triageRecordRepository = triageRecordRepository;
  }

  public void log(String actionType, String actorUsername, String actorRole, String description) {
    SystemLogEntity log = new SystemLogEntity();
    log.setActionType(actionType);
    log.setActorUsername(actorUsername);
    log.setActorRole(actorRole);
    log.setDescription(description);
    log.setCreatedAt(OffsetDateTime.now());
    systemLogRepository.save(log);
  }

  public List<AdminDtos.SystemLogResponse> list(
      String q, String actionType, String role, String dateFrom, String dateTo, Integer limit) {
    Predicate<AdminDtos.SystemLogResponse> byAction =
        l -> !StringUtils.hasText(actionType) || actionType.equalsIgnoreCase(l.actionType());
    Predicate<AdminDtos.SystemLogResponse> byRole =
        l -> !StringUtils.hasText(role) || role.equalsIgnoreCase(l.actorRole());

    String query = (q == null ? "" : q.trim().toLowerCase());
    Predicate<AdminDtos.SystemLogResponse> byText =
        l ->
            query.isEmpty()
                || l.actionType().toLowerCase().contains(query)
                || l.actorUsername().toLowerCase().contains(query)
                || l.actorRole().toLowerCase().contains(query)
                || l.description().toLowerCase().contains(query);

    LocalDate from = parseDate(dateFrom);
    LocalDate to = parseDate(dateTo);
    Predicate<AdminDtos.SystemLogResponse> byDate =
        l -> {
          LocalDate d = l.createdAt().toLocalDate();
          if (from != null && d.isBefore(from)) return false;
          if (to != null && d.isAfter(to)) return false;
          return true;
        };

    int safeLimit = (limit == null || limit <= 0) ? 200 : Math.min(limit, 1000);
    Set<Long> existingCreateLogRecordIds = new HashSet<>();
    Set<Long> existingOverrideLogRecordIds = new HashSet<>();

    List<AdminDtos.SystemLogResponse> persistentLogs =
        systemLogRepository.findAllByOrderByCreatedAtDesc().stream()
            .map(this::toResponse)
            .peek(
                l -> {
                  Long recordId = extractRecordId(l.description());
                  if (recordId == null) {
                    return;
                  }
                  if ("TRIAGE_CREATE".equalsIgnoreCase(l.actionType())) {
                    existingCreateLogRecordIds.add(recordId);
                  } else if ("TRIAGE_OVERRIDE".equalsIgnoreCase(l.actionType())) {
                    existingOverrideLogRecordIds.add(recordId);
                  }
                })
            .toList();

    List<AdminDtos.SystemLogResponse> syntheticTriageLogs =
        triageRecordRepository.findAllByOrderByBasvuruZamaniDesc().stream()
            .flatMap(
                r -> {
                  AdminDtos.SystemLogResponse createLog = syntheticCreateLog(r);
                  AdminDtos.SystemLogResponse overrideLog = syntheticOverrideLog(r);
                  if (overrideLog == null) {
                    return java.util.stream.Stream.of(createLog);
                  }
                  return java.util.stream.Stream.of(overrideLog, createLog);
                })
            .filter(
                l -> {
                  Long recordId = extractRecordId(l.description());
                  if (recordId == null) return true;
                  if ("TRIAGE_CREATE".equalsIgnoreCase(l.actionType())) {
                    return !existingCreateLogRecordIds.contains(recordId);
                  }
                  if ("TRIAGE_OVERRIDE".equalsIgnoreCase(l.actionType())) {
                    return !existingOverrideLogRecordIds.contains(recordId);
                  }
                  return true;
                })
            .toList();

    return java.util.stream.Stream.concat(persistentLogs.stream(), syntheticTriageLogs.stream())
        .sorted(Comparator.comparing(AdminDtos.SystemLogResponse::createdAt).reversed())
        .filter(byAction.and(byRole).and(byText).and(byDate))
        .limit(safeLimit)
        .toList();
  }

  private AdminDtos.SystemLogResponse toResponse(SystemLogEntity x) {
    return new AdminDtos.SystemLogResponse(
        x.getId(),
        x.getActionType(),
        x.getActorUsername(),
        x.getActorRole(),
        x.getDescription(),
        x.getCreatedAt());
  }

  private LocalDate parseDate(String value) {
    if (!StringUtils.hasText(value)) return null;
    try {
      return LocalDate.parse(value);
    } catch (Exception ex) {
      throw new IllegalArgumentException("Tarih formati gecersiz. Beklenen format: YYYY-MM-DD");
    }
  }

  private AdminDtos.SystemLogResponse syntheticCreateLog(TriageRecordEntity r) {
    String actor =
        StringUtils.hasText(r.getCreatedByKullaniciAdi()) ? r.getCreatedByKullaniciAdi() : "personel";
    return new AdminDtos.SystemLogResponse(
        -r.getId(),
        "TRIAGE_CREATE",
        actor,
        "PERSONEL",
        "Triyaj kaydi olusturuldu: kayitId=" + r.getId() + ", hastaId=" + r.getHasta().getId(),
        r.getBasvuruZamani());
  }

  private AdminDtos.SystemLogResponse syntheticOverrideLog(TriageRecordEntity r) {
    if (!StringUtils.hasText(r.getOverrideEtiket())) {
      return null;
    }
    String actor =
        StringUtils.hasText(r.getCreatedByKullaniciAdi()) ? r.getCreatedByKullaniciAdi() : "personel";
    return new AdminDtos.SystemLogResponse(
        -(r.getId() + 1_000_000L),
        "TRIAGE_OVERRIDE",
        actor,
        "PERSONEL",
        "Triyaj override edildi: kayitId="
            + r.getId()
            + ", "
            + r.getEtiket()
            + " -> "
            + r.getOverrideEtiket(),
        r.getBasvuruZamani().plusSeconds(1));
  }

  private Long extractRecordId(String description) {
    if (!StringUtils.hasText(description)) {
      return null;
    }
    int idx = description.indexOf("kayitId=");
    if (idx < 0) {
      return null;
    }
    int start = idx + "kayitId=".length();
    int end = start;
    while (end < description.length() && Character.isDigit(description.charAt(end))) {
      end++;
    }
    if (end == start) {
      return null;
    }
    try {
      return Long.parseLong(description.substring(start, end));
    } catch (Exception ex) {
      return null;
    }
  }
}
