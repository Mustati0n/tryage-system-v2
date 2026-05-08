package com.akillitriage.service;

import com.akillitriage.dto.TriageDtos;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class ModelInferenceService {
  private static final Logger log = LoggerFactory.getLogger(ModelInferenceService.class);

  private final ObjectMapper objectMapper;
  private final String provider;
  private final String pythonBinary;
  private final String scriptPath;
  private final String artifactDir;
  private final boolean fallbackToHeuristic;
  private final long timeoutSeconds;
  private final boolean guardrailEnabled;
  private final List<String> redGuardrailKeywords;
  private final List<String> yellowGuardrailKeywords;
  private final double minGreenConfidence;

  public ModelInferenceService(
      ObjectMapper objectMapper,
      @Value("${app.model.provider:heuristic}") String provider,
      @Value("${app.model.python-binary:python3}") String pythonBinary,
      @Value("${app.model.script-path:../../packages/modeling/scripts/predict_one.py}") String scriptPath,
      @Value("${app.model.artifact-dir:../../packages/modeling/artifacts/compare/tfidf_svm}") String artifactDir,
      @Value("${app.model.fallback-to-heuristic:true}") boolean fallbackToHeuristic,
      @Value("${app.model.timeout-seconds:30}") long timeoutSeconds,
      @Value("${app.model.guardrail.enabled:true}") boolean guardrailEnabled,
      @Value(
              "${app.model.guardrail.red-keywords:nefes darligi,gogus agrisi,bilinc kaybi,bayilma,siddetli kanama,felc}")
          String redGuardrailKeywords,
      @Value("${app.model.guardrail.yellow-keywords:ates,karin agrisi,kusma,bas donmesi,cok agri}") String yellowGuardrailKeywords,
      @Value("${app.model.policy.min-green-confidence:0.0}") double minGreenConfidence) {
    this.objectMapper = objectMapper;
    this.provider = provider;
    this.pythonBinary = pythonBinary;
    this.scriptPath = scriptPath;
    this.artifactDir = artifactDir;
    this.fallbackToHeuristic = fallbackToHeuristic;
    this.timeoutSeconds = timeoutSeconds;
    this.guardrailEnabled = guardrailEnabled;
    this.redGuardrailKeywords = parseKeywords(redGuardrailKeywords);
    this.yellowGuardrailKeywords = parseKeywords(yellowGuardrailKeywords);
    this.minGreenConfidence = minGreenConfidence;
  }

  public TriageDtos.TriagePredictResponse predict(TriageDtos.TriagePredictRequest request) {
    String normalizedProvider = provider.trim().toLowerCase(Locale.ROOT);
    TriageDtos.TriagePredictResponse base;

    if ("heuristic".equals(normalizedProvider)) {
      base = heuristicPredict(request);
      return applyPolicy(applyGuardrail(base, request.sikayetMetni()));
    }

    if ("python-cli".equals(normalizedProvider)) {
      try {
        base = pythonCliPredict(request);
        return applyPolicy(applyGuardrail(base, request.sikayetMetni()));
      } catch (RuntimeException ex) {
        if (!fallbackToHeuristic) {
          throw ex;
        }
        log.warn("Python model inference basarisiz, heuristic fallback devrede: {}", ex.getMessage());
        base = heuristicPredict(request);
        return applyPolicy(applyGuardrail(base, request.sikayetMetni()));
      }
    }

    throw new IllegalArgumentException("Bilinmeyen model provider: " + provider);
  }

  private TriageDtos.TriagePredictResponse pythonCliPredict(TriageDtos.TriagePredictRequest request) {
    List<String> command = new ArrayList<>();
    command.add(pythonBinary);
    command.add(scriptPath);
    command.add("--artifact-dir");
    command.add(artifactDir);
    command.add("--yas");
    command.add(String.valueOf(request.yas()));
    command.add("--cinsiyet");
    command.add(request.cinsiyet());
    command.add("--sikayet");
    command.add(request.sikayetMetni());

    try {
      Process process = new ProcessBuilder(command).start();
      boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
      if (!finished) {
        process.destroyForcibly();
        throw new RuntimeException("Model inference timeout (" + Duration.ofSeconds(timeoutSeconds) + ")");
      }

      String stdout = new String(process.getInputStream().readAllBytes()).trim();
      String stderr = new String(process.getErrorStream().readAllBytes()).trim();

      if (process.exitValue() != 0) {
        throw new RuntimeException("Model komutu basarisiz: " + (stderr.isBlank() ? stdout : stderr));
      }

      JsonNode node = objectMapper.readTree(stdout);
      String etiket = node.path("etiket").asText("").trim().toUpperCase(Locale.ROOT);
      double guven = node.path("confidence").asDouble(0.0);
      String model = node.path("model").asText("tfidf_svm");

      if (etiket.isBlank()) {
        throw new RuntimeException("Model etiketi bos dondu");
      }

      return new TriageDtos.TriagePredictResponse(etiket, guven, model + "-v1");
    } catch (IOException e) {
      throw new RuntimeException("Model komutu calistirilamadi: " + e.getMessage(), e);
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new RuntimeException("Model inference islemi kesildi", e);
    }
  }

  private TriageDtos.TriagePredictResponse heuristicPredict(TriageDtos.TriagePredictRequest request) {
    String text = request.sikayetMetni().toLowerCase(Locale.ROOT);
    if (containsAny(text, "nefes", "gogus agrisi", "bayilma", "bilinc kaybi")) {
      return new TriageDtos.TriagePredictResponse("KIRMIZI", 0.92, "heuristic-v0");
    }
    if (containsAny(text, "ates", "karin agrisi", "kusma", "bas donmesi")) {
      return new TriageDtos.TriagePredictResponse("SARI", 0.76, "heuristic-v0");
    }
    return new TriageDtos.TriagePredictResponse("YESIL", 0.63, "heuristic-v0");
  }

  private boolean containsAny(String text, String... needles) {
    for (String n : needles) {
      if (text.contains(n)) {
        return true;
      }
    }
    return false;
  }

  private TriageDtos.TriagePredictResponse applyGuardrail(
      TriageDtos.TriagePredictResponse prediction, String sikayetMetni) {
    if (!guardrailEnabled) {
      return prediction;
    }
    String text = sikayetMetni == null ? "" : sikayetMetni.toLowerCase(Locale.ROOT);
    boolean redSignal = containsAny(text, redGuardrailKeywords.toArray(String[]::new));
    boolean yellowSignal = containsAny(text, yellowGuardrailKeywords.toArray(String[]::new));

    if (redSignal && !"KIRMIZI".equalsIgnoreCase(prediction.etiket())) {
      log.info("Guardrail red escalation tetiklendi. oncekiEtiket={}", prediction.etiket());
      return new TriageDtos.TriagePredictResponse(
          "KIRMIZI",
          Math.max(prediction.guven() == null ? 0.0 : prediction.guven(), 0.85),
          prediction.modelVersiyonu() + "+guardrail-red");
    }
    if (yellowSignal && "YESIL".equalsIgnoreCase(prediction.etiket())) {
      log.info("Guardrail yellow escalation tetiklendi. oncekiEtiket={}", prediction.etiket());
      return new TriageDtos.TriagePredictResponse(
          "SARI",
          Math.max(prediction.guven() == null ? 0.0 : prediction.guven(), 0.70),
          prediction.modelVersiyonu() + "+guardrail-yellow");
    }
    return prediction;
  }

  private List<String> parseKeywords(String raw) {
    if (raw == null || raw.isBlank()) {
      return List.of();
    }
    return Arrays.stream(raw.split(","))
        .map(s -> s.trim().toLowerCase(Locale.ROOT))
        .filter(s -> !s.isBlank())
        .toList();
  }

  private TriageDtos.TriagePredictResponse applyPolicy(TriageDtos.TriagePredictResponse prediction) {
    if (minGreenConfidence <= 0) {
      return prediction;
    }
    if ("YESIL".equalsIgnoreCase(prediction.etiket())
        && Optional.ofNullable(prediction.guven()).orElse(0.0) < minGreenConfidence) {
      log.info(
          "Low-confidence green policy tetiklendi. guven={}, threshold={}",
          prediction.guven(),
          minGreenConfidence);
      return new TriageDtos.TriagePredictResponse(
          "SARI",
          Math.max(Optional.ofNullable(prediction.guven()).orElse(0.0), minGreenConfidence),
          prediction.modelVersiyonu() + "+policy-lowconf-green");
    }
    return prediction;
  }

  public String selectedModelVersion() {
    if ("python-cli".equalsIgnoreCase(provider)) {
      String artifactName = artifactDir == null ? "unknown" : artifactDir.substring(artifactDir.lastIndexOf('/') + 1);
      return artifactName + "-v1";
    }
    return "heuristic-v0";
  }

  public String modelConfigNote() {
    return String.format(
        "provider=%s, guardrail=%s, minGreenConfidence=%.2f",
        provider,
        guardrailEnabled,
        minGreenConfidence);
  }
}
