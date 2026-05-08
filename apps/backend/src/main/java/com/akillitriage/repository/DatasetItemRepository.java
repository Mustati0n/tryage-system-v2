package com.akillitriage.repository;

import com.akillitriage.entity.DatasetItemEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DatasetItemRepository extends JpaRepository<DatasetItemEntity, Long> {
  Optional<DatasetItemEntity> findByTriageKayit_Id(Long triageKayitId);
}
