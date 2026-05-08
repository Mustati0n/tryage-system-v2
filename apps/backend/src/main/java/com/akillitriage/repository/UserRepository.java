package com.akillitriage.repository;

import com.akillitriage.entity.UserEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
  Optional<UserEntity> findByKullaniciAdiIgnoreCase(String kullaniciAdi);
}
