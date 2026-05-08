package com.akillitriage.config;

import com.akillitriage.entity.UserEntity;
import com.akillitriage.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class DemoUserInitializer implements ApplicationRunner {
  private final UserRepository userRepository;
  private final boolean seedEnabled;

  public DemoUserInitializer(
      UserRepository userRepository, @Value("${app.seed-demo-users:true}") boolean seedEnabled) {
    this.userRepository = userRepository;
    this.seedEnabled = seedEnabled;
  }

  @Override
  public void run(ApplicationArguments args) {
    if (!seedEnabled) {
      return;
    }
    upsertUser("admin", "admin123", "ADMIN", "Sistem Yoneticisi");
    upsertUser("personel", "personel123", "PERSONEL", "Triage Personeli");
  }

  private void upsertUser(String username, String password, String role, String fullName) {
    UserEntity user = userRepository.findByKullaniciAdiIgnoreCase(username).orElseGet(UserEntity::new);
    user.setKullaniciAdi(username);
    user.setSifreHash(password);
    user.setRol(role);
    user.setAdSoyad(fullName);
    user.setAktifMi(true);
    userRepository.save(user);
  }
}
