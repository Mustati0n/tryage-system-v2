package com.akillitriage.service;

import com.akillitriage.api.AuthException;
import com.akillitriage.dto.AuthDtos;
import com.akillitriage.entity.RefreshTokenEntity;
import com.akillitriage.entity.UserEntity;
import com.akillitriage.repository.RefreshTokenRepository;
import com.akillitriage.repository.UserRepository;
import com.akillitriage.security.JwtService;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final JwtService jwtService;
  private final UserRepository userRepository;
  private final RefreshTokenRepository refreshTokenRepository;
  private final SystemLogService systemLogService;
  private final long refreshTtlSeconds;

  public AuthService(
      JwtService jwtService,
      UserRepository userRepository,
      RefreshTokenRepository refreshTokenRepository,
      SystemLogService systemLogService,
      @Value("${app.jwt.refresh-ttl-seconds:1209600}") long refreshTtlSeconds) {
    this.jwtService = jwtService;
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.systemLogService = systemLogService;
    this.refreshTtlSeconds = refreshTtlSeconds;
  }

  public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
    UserEntity user =
        userRepository
            .findByKullaniciAdiIgnoreCase(request.kullaniciAdi())
            .orElseThrow(() -> new AuthException("Kullanici adi veya sifre hatali"));

    if (!user.isAktifMi()) {
      throw new AuthException("Kullanici pasif");
    }
    if (!user.getSifreHash().equals(request.sifre())) {
      throw new AuthException("Kullanici adi veya sifre hatali");
    }

    String access = jwtService.issueAccessToken(user.getId(), user.getKullaniciAdi(), user.getRol());
    String refresh = createRefreshToken(user);
    systemLogService.log("AUTH_LOGIN", user.getKullaniciAdi(), user.getRol(), "Kullanici giris yapti");
    return new AuthDtos.LoginResponse(access, refresh, user.getRol(), user.getId());
  }

  @Transactional
  public AuthDtos.LoginResponse refresh(String refreshTokenValue) {
    RefreshTokenEntity oldToken =
        refreshTokenRepository
            .findByTokenAndRevokedFalse(refreshTokenValue)
            .orElseThrow(() -> new AuthException("Refresh token gecersiz"));

    if (oldToken.getExpiresAt().isBefore(OffsetDateTime.now())) {
      oldToken.setRevoked(true);
      refreshTokenRepository.save(oldToken);
      throw new AuthException("Refresh token suresi dolmus");
    }

    UserEntity user = oldToken.getUser();
    if (!user.isAktifMi()) {
      throw new AuthException("Kullanici pasif");
    }

    oldToken.setRevoked(true);
    refreshTokenRepository.save(oldToken);

    String access = jwtService.issueAccessToken(user.getId(), user.getKullaniciAdi(), user.getRol());
    String newRefresh = createRefreshToken(user);
    return new AuthDtos.LoginResponse(access, newRefresh, user.getRol(), user.getId());
  }

  public AuthDtos.MeResponse me(String username) {
    UserEntity user =
        userRepository
            .findByKullaniciAdiIgnoreCase(username)
            .orElseThrow(() -> new AuthException("Kullanici bulunamadi"));
    return new AuthDtos.MeResponse(
        user.getId(), user.getKullaniciAdi(), user.getAdSoyad(), user.getRol(), user.isAktifMi());
  }

  public void logLogout(String username) {
    userRepository
        .findByKullaniciAdiIgnoreCase(username)
        .ifPresent(
            user ->
                systemLogService.log(
                    "AUTH_LOGOUT", user.getKullaniciAdi(), user.getRol(), "Kullanici cikis yapti"));
  }

  private String createRefreshToken(UserEntity user) {
    String tokenValue = UUID.randomUUID() + "." + UUID.randomUUID();
    RefreshTokenEntity token = new RefreshTokenEntity();
    token.setUser(user);
    token.setToken(tokenValue);
    token.setCreatedAt(OffsetDateTime.now());
    token.setExpiresAt(OffsetDateTime.now().plusSeconds(refreshTtlSeconds));
    token.setRevoked(false);
    refreshTokenRepository.save(token);
    return tokenValue;
  }
}
