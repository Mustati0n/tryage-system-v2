package com.akillitriage.api;

import com.akillitriage.dto.AuthDtos;
import com.akillitriage.service.AuthService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public AuthDtos.LoginResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
    return authService.login(request);
  }

  @PostMapping("/refresh")
  public AuthDtos.LoginResponse refresh(@Valid @RequestBody AuthDtos.RefreshRequest request) {
    return authService.refresh(request.refreshToken());
  }

  @GetMapping("/me")
  public AuthDtos.MeResponse me(Principal principal) {
    return authService.me(principal.getName());
  }

  @PostMapping("/logout")
  public Map<String, String> logout(Principal principal) {
    if (principal != null) {
      authService.logLogout(principal.getName());
    }
    return Map.of("message", "Cikis basarili");
  }
}
