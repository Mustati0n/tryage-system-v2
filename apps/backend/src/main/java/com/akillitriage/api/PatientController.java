package com.akillitriage.api;

import com.akillitriage.dto.PatientDtos;
import com.akillitriage.service.PatientService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patients")
public class PatientController {
  private final PatientService patientService;

  public PatientController(PatientService patientService) {
    this.patientService = patientService;
  }

  @PostMapping
  public PatientDtos.PatientResponse create(@Valid @RequestBody PatientDtos.PatientCreateRequest request) {
    return patientService.create(request);
  }

  @GetMapping
  public List<PatientDtos.PatientResponse> list(
      @RequestParam(required = false) String q, @RequestParam(required = false) String tcKimlikNo) {
    return patientService.list(q, tcKimlikNo);
  }

  @GetMapping("/{id}")
  public PatientDtos.PatientResponse getById(@PathVariable Long id) {
    return patientService.getById(id);
  }

  @GetMapping("/{id}/records")
  public List<Object> records(@PathVariable Long id) {
    patientService.getById(id);
    return List.of();
  }

  @PutMapping("/{id}")
  public PatientDtos.PatientResponse update(
      @PathVariable Long id, @Valid @RequestBody PatientDtos.PatientUpdateRequest request) {
    return patientService.update(id, request);
  }
}
