package com.akillitriage.api;

import com.akillitriage.dto.AdminDtos;
import com.akillitriage.service.DatasetService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dataset")
@PreAuthorize("hasRole('ADMIN')")
public class DatasetController {
  private final DatasetService datasetService;

  public DatasetController(DatasetService datasetService) {
    this.datasetService = datasetService;
  }

  @PostMapping("/items")
  public AdminDtos.DatasetCreateResponse create(@Valid @RequestBody AdminDtos.DatasetCreateRequest request) {
    return datasetService.create(request);
  }

  @GetMapping("/items")
  public List<AdminDtos.DatasetItemResponse> list() {
    return datasetService.list();
  }

  @GetMapping("/export")
  public AdminDtos.ExportResponse export(@RequestParam(defaultValue = "json") String format) {
    return datasetService.export(format);
  }
}
