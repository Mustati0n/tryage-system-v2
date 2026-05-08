package com.akillitriage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.Map;

public class AdminDtos {
  public record DatasetCreateRequest(@NotNull Long kayitId, @NotBlank String gercekEtiket, String not) {}

  public record DatasetCreateResponse(Long veriId) {}

  public record DatasetItemResponse(
      Long veriId,
      Long kayitId,
      String gercekEtiket,
      String not,
      String kaynak,
      OffsetDateTime eklenmeZamani) {}

  public record ExportResponse(String format, String content, Integer itemCount) {}

  public record SystemStatsResponse(Integer toplamKayit, Map<String, Long> etiketDagilimi) {}

  public record SystemModelInfoResponse(String modelVersiyonu, String sttMotoru, String not) {}

  public record SystemLogResponse(
      Long logId,
      String actionType,
      String actorUsername,
      String actorRole,
      String description,
      OffsetDateTime createdAt) {}
}
