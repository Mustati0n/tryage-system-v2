package com.akillitriage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class PatientDtos {
  public record PatientCreateRequest(
      @NotBlank String ad,
      @NotBlank String soyad,
      @NotBlank @Pattern(regexp = "^[0-9]{11}$", message = "11 haneli olmali") String tcKimlikNo,
      @NotBlank String dogumTarihi,
      @NotBlank String cinsiyet) {}

  public record PatientUpdateRequest(
      @NotBlank String ad, @NotBlank String soyad, @NotBlank String dogumTarihi, @NotBlank String cinsiyet) {}

  public record PatientResponse(
      Long hastaId,
      String ad,
      String soyad,
      String tcKimlikNo,
      String dogumTarihi,
      String cinsiyet,
      Integer yas) {}
}
