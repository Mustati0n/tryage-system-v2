package com.akillitriage.service;

import com.akillitriage.api.SttException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class SttService {
  private final ObjectMapper objectMapper;
  private final String provider;
  private final String pythonBinary;
  private final String scriptPath;
  private final String model;
  private final String language;
  private final String device;
  private final String computeType;
  private final int beamSize;
  private final boolean vadFilter;
  private final int vadMinSilenceMs;
  private final double temperature;
  private final long timeoutSeconds;

  public SttService(
      ObjectMapper objectMapper,
      @Value("${app.stt.provider:stub}") String provider,
      @Value("${app.stt.python-binary:python3}") String pythonBinary,
      @Value("${app.stt.script-path:scripts/stt_faster_whisper.py}") String scriptPath,
      @Value("${app.stt.model:small}") String model,
      @Value("${app.stt.language:tr}") String language,
      @Value("${app.stt.device:cpu}") String device,
      @Value("${app.stt.compute-type:int8}") String computeType,
      @Value("${app.stt.beam-size:5}") int beamSize,
      @Value("${app.stt.vad-filter:true}") boolean vadFilter,
      @Value("${app.stt.vad-min-silence-ms:400}") int vadMinSilenceMs,
      @Value("${app.stt.temperature:0.0}") double temperature,
      @Value("${app.stt.timeout-seconds:120}") long timeoutSeconds) {
    this.objectMapper = objectMapper;
    this.provider = provider;
    this.pythonBinary = pythonBinary;
    this.scriptPath = scriptPath;
    this.model = model;
    this.language = language;
    this.device = device;
    this.computeType = computeType;
    this.beamSize = beamSize;
    this.vadFilter = vadFilter;
    this.vadMinSilenceMs = vadMinSilenceMs;
    this.temperature = temperature;
    this.timeoutSeconds = timeoutSeconds;
  }

  public String transcribe(MultipartFile audioFile) {
    if (audioFile == null || audioFile.isEmpty()) {
      throw new SttException("Ses dosyasi bos olamaz");
    }

    String normalizedProvider = provider.trim().toLowerCase(Locale.ROOT);
    if ("stub".equals(normalizedProvider)) {
      return "stub transcript: " + safeFilename(audioFile.getOriginalFilename());
    }
    if ("faster-whisper-cli".equals(normalizedProvider)) {
      return transcribeViaCli(audioFile);
    }
    throw new SttException("Bilinmeyen STT provider: " + provider);
  }

  private String transcribeViaCli(MultipartFile audioFile) {
    String original = safeFilename(audioFile.getOriginalFilename());
    String suffix = original.contains(".") ? original.substring(original.lastIndexOf('.')) : ".wav";
    Path tempFile = null;
    try {
      tempFile = Files.createTempFile("triage-audio-", suffix);
      audioFile.transferTo(tempFile.toFile());

      List<String> command = new ArrayList<>();
      command.add(pythonBinary);
      command.add(scriptPath);
      command.add("--audio");
      command.add(tempFile.toString());
      command.add("--model");
      command.add(model);
      command.add("--language");
      command.add(language);
      command.add("--device");
      command.add(device);
      command.add("--compute-type");
      command.add(computeType);
      command.add("--beam-size");
      command.add(String.valueOf(beamSize));
      if (vadFilter) {
        command.add("--vad-filter");
      }
      command.add("--vad-min-silence-ms");
      command.add(String.valueOf(vadMinSilenceMs));
      command.add("--temperature");
      command.add(String.valueOf(temperature));

      Process process = new ProcessBuilder(command).start();
      boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
      if (!finished) {
        process.destroyForcibly();
        throw new SttException("STT timeout (" + Duration.ofSeconds(timeoutSeconds) + ")");
      }

      String stdout = new String(process.getInputStream().readAllBytes()).trim();
      String stderr = new String(process.getErrorStream().readAllBytes()).trim();
      if (process.exitValue() != 0) {
        throw new SttException("STT komutu basarisiz: " + (stderr.isBlank() ? stdout : stderr));
      }

      JsonNode node = objectMapper.readTree(stdout);
      String transcript = node.path("transcript").asText("").trim();
      if (transcript.isBlank()) {
        throw new SttException("STT transcript bos dondu");
      }
      return transcript;
    } catch (IOException e) {
      throw new SttException("STT komutu calistirilamadi: " + e.getMessage());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw new SttException("STT islemi kesildi");
    } finally {
      if (tempFile != null) {
        try {
          Files.deleteIfExists(tempFile);
        } catch (IOException ignored) {
        }
      }
    }
  }

  private String safeFilename(String input) {
    if (input == null || input.isBlank()) {
      return "audio.wav";
    }
    return Path.of(input).getFileName().toString();
  }
}
