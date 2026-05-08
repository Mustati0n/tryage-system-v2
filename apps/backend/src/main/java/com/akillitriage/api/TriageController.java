package com.akillitriage.api;

import com.akillitriage.dto.TriageDtos;
import com.akillitriage.service.SttService;
import com.akillitriage.service.TriageService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/triage")
public class TriageController {
  private final TriageService triageService;
  private final SttService sttService;

  public TriageController(TriageService triageService, SttService sttService) {
    this.triageService = triageService;
    this.sttService = sttService;
  }

  @PostMapping(value = "/stt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public TriageDtos.SttResponse stt(@RequestPart("audioFile") MultipartFile audioFile) {
    String transcript = sttService.transcribe(audioFile);
    return new TriageDtos.SttResponse(transcript);
  }

  @PostMapping(value = "/stt", consumes = MediaType.APPLICATION_JSON_VALUE)
  public TriageDtos.SttResponse sttFallback(@RequestBody(required = false) Map<String, Object> body) {
    String transcript = body == null ? "" : String.valueOf(body.getOrDefault("text", ""));
    return new TriageDtos.SttResponse(transcript.trim());
  }

  @PostMapping("/predict")
  public TriageDtos.TriagePredictResponse predict(@Valid @RequestBody TriageDtos.TriagePredictRequest request) {
    return triageService.predict(request);
  }

  @PostMapping("/records")
  public TriageDtos.TriageRecordResponse create(
      @Valid @RequestBody TriageDtos.TriageRecordCreateRequest request, Authentication authentication) {
    return triageService.create(request, authentication.getName());
  }

  @GetMapping("/records")
  public List<TriageDtos.TriageRecordResponse> list(
      @RequestParam(required = false) String etiket,
      @RequestParam(required = false) Double confidenceMin,
      @RequestParam(required = false) Double confidenceMax,
      @RequestParam(required = false) Boolean overrideVarMi,
      @RequestParam(required = false) String tarihBaslangic,
      @RequestParam(required = false) String tarihBitis) {
    return triageService.list(etiket, confidenceMin, confidenceMax, overrideVarMi, tarihBaslangic, tarihBitis);
  }

  @GetMapping("/records/me")
  public List<TriageDtos.TriageRecordResponse> listMine(Authentication authentication) {
    return triageService.listMine(authentication.getName());
  }

  @GetMapping("/records/{id}")
  public TriageDtos.TriageRecordResponse getById(@PathVariable Long id) {
    return triageService.getById(id);
  }

  @PatchMapping("/records/{id}")
  public TriageDtos.TriageRecordResponse override(
      @PathVariable Long id, @Valid @RequestBody TriageDtos.OverrideRequest request) {
    return triageService.override(id, request);
  }
}
