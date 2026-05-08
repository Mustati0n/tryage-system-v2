package com.akillitriage.service;

import com.akillitriage.dto.AdminDtos;
import com.akillitriage.dto.TriageDtos;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class SystemService {
  private final TriageService triageService;
  private final ModelInferenceService modelInferenceService;
  private final SystemLogService systemLogService;

  public SystemService(
      TriageService triageService,
      ModelInferenceService modelInferenceService,
      SystemLogService systemLogService) {
    this.triageService = triageService;
    this.modelInferenceService = modelInferenceService;
    this.systemLogService = systemLogService;
  }

  public AdminDtos.SystemStatsResponse stats() {
    List<TriageDtos.TriageRecordResponse> records = triageService.list();
    Map<String, Long> dagilim = new HashMap<>();
    for (TriageDtos.TriageRecordResponse r : records) {
      dagilim.put(r.etiket(), dagilim.getOrDefault(r.etiket(), 0L) + 1);
    }
    return new AdminDtos.SystemStatsResponse(records.size(), dagilim);
  }

  public AdminDtos.SystemModelInfoResponse models() {
    return new AdminDtos.SystemModelInfoResponse(
        modelInferenceService.selectedModelVersion(),
        "local-faster-whisper (MVP: stub stt endpoint)",
        modelInferenceService.modelConfigNote());
  }

  public List<AdminDtos.SystemLogResponse> logs(
      String q, String actionType, String role, String dateFrom, String dateTo, Integer limit) {
    return systemLogService.list(q, actionType, role, dateFrom, dateTo, limit);
  }
}
