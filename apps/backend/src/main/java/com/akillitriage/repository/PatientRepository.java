package com.akillitriage.repository;

import com.akillitriage.entity.PatientEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<PatientEntity, Long> {
  Optional<PatientEntity> findByTcKimlikNo(String tcKimlikNo);
}
