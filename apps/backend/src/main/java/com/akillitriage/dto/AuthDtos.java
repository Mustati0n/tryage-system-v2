package com.akillitriage.dto;

import jakarta.validation.constraints.NotBlank;

public class AuthDtos {
  public record LoginRequest(@NotBlank String kullaniciAdi, @NotBlank String sifre) {}

  public record RefreshRequest(@NotBlank String refreshToken) {}

  public record LoginResponse(String accessToken, String refreshToken, String rol, Long kullaniciId) {}

  public record MeResponse(Long kullaniciId, String kullaniciAdi, String adSoyad, String rol, boolean aktifMi) {}
}
