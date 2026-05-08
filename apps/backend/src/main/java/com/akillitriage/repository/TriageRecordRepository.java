package com.akillitriage.repository;

import com.akillitriage.entity.TriageRecordEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TriageRecordRepository extends JpaRepository<TriageRecordEntity, Long> {
  List<TriageRecordEntity> findAllByOrderByBasvuruZamaniDesc();
  List<TriageRecordEntity> findAllByCreatedByKullaniciAdiIgnoreCaseOrderByBasvuruZamaniDesc(String createdByKullaniciAdi);
  java.util.Optional<TriageRecordEntity> findByIdAndCreatedByKullaniciAdiIgnoreCase(Long id, String createdByKullaniciAdi);

  long countByEtiket(String etiket);
}
