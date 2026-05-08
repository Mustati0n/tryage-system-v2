package com.akillitriage.dto;

import jakarta.validation.constraints.NotBlank;

public class UserDtos {
  public record UserCreateRequest(
      @NotBlank String kullaniciAdi, @NotBlank String sifre, @NotBlank String rol, String adSoyad) {}

  public record UserUpdateRequest(@NotBlank String kullaniciAdi, @NotBlank String rol, String adSoyad) {}

  public record UserStatusRequest(boolean aktifMi) {}

  public record UserResponse(Long kullaniciId, String kullaniciAdi, String adSoyad, String rol, boolean aktifMi) {}
}
