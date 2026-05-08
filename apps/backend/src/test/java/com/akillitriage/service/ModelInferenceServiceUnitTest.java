package com.akillitriage.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.akillitriage.dto.TriageDtos;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class ModelInferenceServiceUnitTest {

  @Test
  void shouldPredictRedForHighRiskComplaintInHeuristicMode() {
    ModelInferenceService service = buildHeuristicService(0.0);

    TriageDtos.TriagePredictResponse response =
        service.predict(new TriageDtos.TriagePredictRequest(54, "ERKEK", "gogus agrisi ve nefes darligi var"));

    assertThat(response.etiket()).isEqualTo("KIRMIZI");
    assertThat(response.guven()).isGreaterThanOrEqualTo(0.85);
    assertThat(response.modelVersiyonu()).contains("heuristic-v0");
  }

  @Test
  void shouldEscalateLowConfidenceGreenToYellowWithPolicy() {
    ModelInferenceService service = buildHeuristicService(0.70);

    TriageDtos.TriagePredictResponse response =
        service.predict(new TriageDtos.TriagePredictRequest(24, "KADIN", "hafif kas agrisi var"));

    assertThat(response.etiket()).isEqualTo("SARI");
    assertThat(response.guven()).isEqualTo(0.70);
    assertThat(response.modelVersiyonu()).contains("+policy-lowconf-green");
  }

  @Test
  void shouldEscalateGreenToYellowWhenYellowGuardrailKeywordExists() {
    ModelInferenceService service =
        new ModelInferenceService(
            new ObjectMapper(),
            "heuristic",
            "python3",
            "../../packages/modeling/scripts/predict_one.py",
            "../../packages/modeling/artifacts/selected/tfidf_svm",
            true,
            30,
            true,
            "nefes darligi,gogus agrisi,bilinc kaybi,bayilma,siddetli kanama,felc",
            "halsizlik",
            0.0);

    TriageDtos.TriagePredictResponse response =
        service.predict(new TriageDtos.TriagePredictRequest(34, "ERKEK", "2 gundur halsizlik var"));

    assertThat(response.etiket()).isEqualTo("SARI");
    assertThat(response.guven()).isGreaterThanOrEqualTo(0.70);
    assertThat(response.modelVersiyonu()).contains("+guardrail-yellow");
  }

  private ModelInferenceService buildHeuristicService(double minGreenConfidence) {
    return new ModelInferenceService(
        new ObjectMapper(),
        "heuristic",
        "python3",
        "../../packages/modeling/scripts/predict_one.py",
        "../../packages/modeling/artifacts/selected/tfidf_svm",
        true,
        30,
        true,
        "nefes darligi,gogus agrisi,bilinc kaybi,bayilma,siddetli kanama,felc",
        "ates,karin agrisi,kusma,bas donmesi,cok agri",
        minGreenConfidence);
  }
}
