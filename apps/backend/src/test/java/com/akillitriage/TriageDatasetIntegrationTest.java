package com.akillitriage;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.HashSet;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

class TriageDatasetIntegrationTest extends BaseIntegrationTest {
  @Test
  void predictAppliesLowConfidenceGreenPolicy() throws Exception {
    String personelToken = loginAndGetToken("personel", "personel123");

    String predictBody =
        """
        {
          "yas": 26,
          "cinsiyet": "KADIN",
          "sikayetMetni": "hafif kas agrisi var"
        }
        """;

    mockMvc
        .perform(
            post("/api/triage/predict")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(predictBody))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.etiket").value("SARI"))
        .andExpect(jsonPath("$.modelVersiyonu").value(org.hamcrest.Matchers.containsString("policy-lowconf-green")));
  }

  @Test
  void predictAppliesGuardrailEscalationWhenRiskKeywordsExist() throws Exception {
    String personelToken = loginAndGetToken("personel", "personel123");

    String predictBody =
        """
        {
          "yas": 30,
          "cinsiyet": "ERKEK",
          "sikayetMetni": "2 saattir cok agri var ama diger belirtiler hafif"
        }
        """;

    mockMvc
        .perform(
            post("/api/triage/predict")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(predictBody))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.etiket").value("SARI"))
        .andExpect(jsonPath("$.modelVersiyonu").value(org.hamcrest.Matchers.containsString("guardrail-yellow")));
  }

  @Test
  void personelPredictCreateAndOverrideFlowWorks() throws Exception {
    String personelToken = loginAndGetToken("personel", "personel123");
    Long patientId = createPatient(personelToken, uniqueTc());

    String predictBody =
        """
        {
          "yas": 34,
          "cinsiyet": "ERKEK",
          "sikayetMetni": "2 gundur ates ve kusma var"
        }
        """;

    MvcResult predictResult =
        mockMvc
            .perform(
                post("/api/triage/predict")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(predictBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.etiket").value("SARI"))
            .andReturn();

    JsonNode predictJson = objectMapper.readTree(predictResult.getResponse().getContentAsString());
    String etiket = predictJson.get("etiket").asText();
    double guven = predictJson.get("guven").asDouble();
    String modelVersiyonu = predictJson.get("modelVersiyonu").asText();

    String createRecordBody =
        """
        {
          "hastaId": %d,
          "yas": 34,
          "cinsiyet": "ERKEK",
          "sikayetMetni": "2 gundur ates ve kusma var",
          "etiket": "%s",
          "guven": %s,
          "modelVersiyonu": "%s"
        }
        """
            .formatted(patientId, etiket, guven, modelVersiyonu);

    MvcResult recordResult =
        mockMvc
            .perform(
                post("/api/triage/records")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(createRecordBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.durum").value("TAHMIN_EDILDI"))
            .andExpect(jsonPath("$.etiket").value("SARI"))
            .andReturn();

    Long kayitId = objectMapper.readTree(recordResult.getResponse().getContentAsString()).get("kayitId").asLong();

    String overrideBody =
        """
        {
          "overrideEtiket": "KIRMIZI",
          "overrideNedeni": "Klinik olarak daha acil gorundu"
        }
        """;

    mockMvc
        .perform(
            patch("/api/triage/records/{id}", kayitId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(overrideBody))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.overrideEtiket").value("KIRMIZI"))
        .andExpect(jsonPath("$.overrideNedeni").value("Klinik olarak daha acil gorundu"));

    mockMvc
        .perform(
            get("/api/triage/records/{id}", kayitId).header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.kayitId").value(kayitId))
        .andExpect(jsonPath("$.overrideEtiket").value("KIRMIZI"));

    mockMvc
        .perform(get("/api/triage/records/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$[*].kayitId").isNotEmpty());
  }

  @Test
  void personelCanSaveRecordWithPreSaveOverride() throws Exception {
    String personelToken = loginAndGetToken("personel", "personel123");
    Long patientId = createPatient(personelToken, uniqueTc());

    String createRecordBody =
        """
        {
          "hastaId": %d,
          "yas": 29,
          "cinsiyet": "ERKEK",
          "sikayetMetni": "hafif bogaz agrisi",
          "etiket": "YESIL",
          "guven": 0.63,
          "modelVersiyonu": "triage-model-v0",
          "overrideEtiket": "SARI",
          "overrideNedeni": "Semptomlar uzuyor"
        }
        """
            .formatted(patientId);

    mockMvc
        .perform(
            post("/api/triage/records")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(createRecordBody))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.etiket").value("YESIL"))
        .andExpect(jsonPath("$.overrideEtiket").value("SARI"))
        .andExpect(jsonPath("$.overrideNedeni").value("Semptomlar uzuyor"));

    mockMvc
        .perform(get("/api/triage/records/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].etiket").value("YESIL"))
        .andExpect(jsonPath("$[0].overrideEtiket").value("SARI"));
  }

  @Test
  void myRecordsEndpointReturnsOnlyOwnerRecords() throws Exception {
    String personelToken = loginAndGetToken("personel", "personel123");
    String adminToken = loginAndGetToken("admin", "admin123");

    Long personelRecordId = createRecordWithPredict(personelToken, uniqueTc());
    Long adminRecordId = createRecordWithPredict(adminToken, uniqueTc());

    MvcResult personelMeResult =
        mockMvc
            .perform(get("/api/triage/records/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken))
            .andExpect(status().isOk())
            .andReturn();

    MvcResult adminMeResult =
        mockMvc
            .perform(get("/api/triage/records/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
            .andExpect(status().isOk())
            .andReturn();

    Set<Long> personelIds = extractRecordIds(personelMeResult);
    Set<Long> adminIds = extractRecordIds(adminMeResult);

    org.junit.jupiter.api.Assertions.assertTrue(personelIds.contains(personelRecordId));
    org.junit.jupiter.api.Assertions.assertFalse(personelIds.contains(adminRecordId));
    org.junit.jupiter.api.Assertions.assertTrue(adminIds.contains(adminRecordId));
    org.junit.jupiter.api.Assertions.assertFalse(adminIds.contains(personelRecordId));
  }

  @Test
  void adminDatasetFlowWorksAndPersonelIsForbidden() throws Exception {
    String personelToken = loginAndGetToken("personel", "personel123");
    String adminToken = loginAndGetToken("admin", "admin123");
    Long recordId = createRecordWithPredict(personelToken, uniqueTc());

    String datasetBody =
        """
        {
          "kayitId": %d,
          "gercekEtiket": "SARI",
          "not": "Kontrollu vaka"
        }
        """
            .formatted(recordId);

    mockMvc
        .perform(
            post("/api/dataset/items")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(datasetBody))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.veriId").isNumber());

    mockMvc
        .perform(
            post("/api/dataset/items")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(datasetBody))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("BUSINESS_ERROR"));

    mockMvc
        .perform(
            get("/api/dataset/export")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .param("format", "csv"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.format").value("csv"))
        .andExpect(jsonPath("$.itemCount").value(1));

    mockMvc
        .perform(get("/api/dataset/export").header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken))
        .andExpect(status().isForbidden());

    mockMvc
        .perform(get("/api/dataset/items").header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$[0].kayitId").value(recordId));

    mockMvc
        .perform(get("/api/dataset/items").header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken))
        .andExpect(status().isForbidden());
  }

  @Test
  void adminCanFilterRecordsByEtiketAndOverrideAndConfidence() throws Exception {
    String personelToken = loginAndGetToken("personel", "personel123");
    String adminToken = loginAndGetToken("admin", "admin123");

    Long recordId = createRecordWithPredict(personelToken, uniqueTc());

    String overrideBody =
        """
        {
          "overrideEtiket": "KIRMIZI",
          "overrideNedeni": "Klinik olarak daha acil"
        }
        """;

    mockMvc
        .perform(
            patch("/api/triage/records/{id}", recordId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(overrideBody))
        .andExpect(status().isOk());

    mockMvc
        .perform(
            get("/api/triage/records")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + adminToken)
                .param("etiket", "SARI")
                .param("confidenceMin", "0.7")
                .param("confidenceMax", "0.8")
                .param("overrideVarMi", "true"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$").isArray())
        .andExpect(jsonPath("$[0].kayitId").value(recordId))
        .andExpect(jsonPath("$[0].etiket").value("SARI"))
        .andExpect(jsonPath("$[0].overrideEtiket").value("KIRMIZI"));
  }

  @Test
  void sttMultipartReturnsTranscript() throws Exception {
    String personelToken = loginAndGetToken("personel", "personel123");
    MockMultipartFile audio =
        new MockMultipartFile("audioFile", "sample.wav", "audio/wav", "fake-audio-content".getBytes());

    mockMvc
        .perform(multipart("/api/triage/stt").file(audio).header(HttpHeaders.AUTHORIZATION, "Bearer " + personelToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.transcript").value("stub transcript: sample.wav"));
  }

  private Long createRecordWithPredict(String token, String tcKimlikNo) throws Exception {
    Long patientId = createPatient(token, tcKimlikNo);

    String predictBody =
        """
        {
          "yas": 41,
          "cinsiyet": "KADIN",
          "sikayetMetni": "ates ve karin agrisi"
        }
        """;
    JsonNode predictJson = performPostJson("/api/triage/predict", token, predictBody);

    String createRecordBody =
        """
        {
          "hastaId": %d,
          "yas": 41,
          "cinsiyet": "KADIN",
          "sikayetMetni": "ates ve karin agrisi",
          "etiket": "%s",
          "guven": %s,
          "modelVersiyonu": "%s"
        }
        """
            .formatted(
                patientId,
                predictJson.get("etiket").asText(),
                predictJson.get("guven").asDouble(),
                predictJson.get("modelVersiyonu").asText());

    JsonNode recordJson = performPostJson("/api/triage/records", token, createRecordBody);
    return recordJson.get("kayitId").asLong();
  }

  private Long createPatient(String token, String tcKimlikNo) throws Exception {
    String createBody =
        """
        {
          "ad": "Ayse",
          "soyad": "Kara",
          "tcKimlikNo": "%s",
          "dogumTarihi": "1992-03-01",
          "cinsiyet": "KADIN"
        }
        """
            .formatted(tcKimlikNo);

    JsonNode patient = performPostJson("/api/patients", token, createBody);
    return patient.get("hastaId").asLong();
  }

  private JsonNode performPostJson(String path, String token, String body) throws Exception {
    MvcResult result =
        mockMvc
            .perform(
                post(path)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isOk())
            .andReturn();
    return objectMapper.readTree(result.getResponse().getContentAsString());
  }

  private String uniqueTc() {
    String day = LocalDate.now().format(DateTimeFormatter.ofPattern("ddMMyy"));
    int suffix = (int) (System.nanoTime() % 100000);
    return day + String.format("%05d", suffix);
  }

  private Set<Long> extractRecordIds(MvcResult result) throws Exception {
    JsonNode array = objectMapper.readTree(result.getResponse().getContentAsString());
    Set<Long> ids = new HashSet<>();
    for (JsonNode item : array) {
      if (item.hasNonNull("kayitId")) {
        ids.add(item.get("kayitId").asLong());
      }
    }
    return ids;
  }
}
