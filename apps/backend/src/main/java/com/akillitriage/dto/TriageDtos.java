package com.akillitriage.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public class TriageDtos {
  public record SttResponse(String transcript) {}

  public record TriagePredictRequest(
      @NotNull @Min(0) @Max(130) Integer yas, @NotBlank String cinsiyet, @NotBlank String sikayetMetni) {}

  public record TriagePredictResponse(String etiket, Double guven, String modelVersiyonu) {}

  public record TriageRecordCreateRequest(
      @NotNull Long hastaId,
      @NotNull Integer yas,
      @NotBlank String cinsiyet,
      @NotBlank String sikayetMetni,
      @NotBlank String etiket,
      @NotNull Double guven,
      @NotBlank String modelVersiyonu,
      String sesDosyaYolu,
      String overrideEtiket,
      String overrideNedeni) {}

  public record TriageRecordResponse(
      Long kayitId,
      Long hastaId,
      String etiket,
      Double guven,
      String transcript,
      String modelVersiyonu,
      String durum,
      String overrideEtiket,
      String overrideNedeni,
      OffsetDateTime basvuruZamani) {}

  public record OverrideRequest(@NotBlank String overrideEtiket, @NotBlank String overrideNedeni) {}
}
