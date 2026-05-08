package com.akillitriage.service;

import com.akillitriage.api.NotFoundException;
import com.akillitriage.dto.AdminDtos;
import com.akillitriage.entity.DatasetItemEntity;
import com.akillitriage.entity.TriageRecordEntity;
import com.akillitriage.repository.DatasetItemRepository;
import com.akillitriage.repository.TriageRecordRepository;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DatasetService {
  private final DatasetItemRepository datasetItemRepository;
  private final TriageRecordRepository triageRecordRepository;

  public DatasetService(
      DatasetItemRepository datasetItemRepository, TriageRecordRepository triageRecordRepository) {
    this.datasetItemRepository = datasetItemRepository;
    this.triageRecordRepository = triageRecordRepository;
  }

  public AdminDtos.DatasetCreateResponse create(AdminDtos.DatasetCreateRequest request) {
    if (datasetItemRepository.findByTriageKayit_Id(request.kayitId()).isPresent()) {
      throw new IllegalArgumentException("Bu kayit zaten dataset'te");
    }
    TriageRecordEntity triageRecord =
        triageRecordRepository
            .findById(request.kayitId())
            .orElseThrow(() -> new NotFoundException("Triyaj kaydi bulunamadi"));

    DatasetItemEntity item = new DatasetItemEntity();
    item.setTriageKayit(triageRecord);
    item.setGercekEtiket(request.gercekEtiket());
    item.setNote(request.not());
    item.setKaynak("KAYITLI_VAKA");
    item.setEklenmeZamani(OffsetDateTime.now());
    DatasetItemEntity saved = datasetItemRepository.save(item);
    return new AdminDtos.DatasetCreateResponse(saved.getId());
  }

  public List<AdminDtos.DatasetItemResponse> list() {
    List<AdminDtos.DatasetItemResponse> results = new ArrayList<>();
    for (DatasetItemEntity item : datasetItemRepository.findAll()) {
      results.add(toResponse(item));
    }
    results.sort(Comparator.comparing(AdminDtos.DatasetItemResponse::veriId));
    return results;
  }

  public AdminDtos.ExportResponse export(String format) {
    String normalized = format == null ? "json" : format.toLowerCase();
    List<AdminDtos.DatasetItemResponse> items = list();
    if ("csv".equals(normalized)) {
      StringBuilder sb = new StringBuilder();
      sb.append("veriId,kayitId,gercekEtiket,not,kaynak,eklenmeZamani\n");
      for (AdminDtos.DatasetItemResponse i : items) {
        sb.append(i.veriId())
            .append(",")
            .append(i.kayitId())
            .append(",")
            .append(i.gercekEtiket())
            .append(",")
            .append(i.not() == null ? "" : i.not().replace(",", " "))
            .append(",")
            .append(i.kaynak())
            .append(",")
            .append(i.eklenmeZamani())
            .append("\n");
      }
      return new AdminDtos.ExportResponse("csv", sb.toString(), items.size());
    }

    StringBuilder sb = new StringBuilder();
    sb.append("[");
    for (int idx = 0; idx < items.size(); idx++) {
      AdminDtos.DatasetItemResponse i = items.get(idx);
      sb.append("{")
          .append("\"veriId\":").append(i.veriId()).append(",")
          .append("\"kayitId\":").append(i.kayitId()).append(",")
          .append("\"gercekEtiket\":\"").append(i.gercekEtiket()).append("\",")
          .append("\"not\":\"").append(i.not() == null ? "" : i.not()).append("\",")
          .append("\"kaynak\":\"").append(i.kaynak()).append("\"")
          .append("}");
      if (idx < items.size() - 1) {
        sb.append(",");
      }
    }
    sb.append("]");
    return new AdminDtos.ExportResponse("json", sb.toString(), items.size());
  }

  private AdminDtos.DatasetItemResponse toResponse(DatasetItemEntity item) {
    return new AdminDtos.DatasetItemResponse(
        item.getId(),
        item.getTriageKayit().getId(),
        item.getGercekEtiket(),
        item.getNote(),
        item.getKaynak(),
        item.getEklenmeZamani());
  }
}
