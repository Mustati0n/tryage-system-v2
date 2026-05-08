package com.akillitriage.api;

import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(MethodArgumentNotValidException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public Map<String, Object> validationError(MethodArgumentNotValidException ex) {
    List<String> details =
        ex.getBindingResult().getFieldErrors().stream()
            .map(err -> err.getField() + " " + err.getDefaultMessage())
            .toList();
    return Map.of("code", "VALIDATION_ERROR", "message", "Gecersiz istek", "details", details);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  public Map<String, Object> illegalArgument(IllegalArgumentException ex) {
    return Map.of("code", "BUSINESS_ERROR", "message", ex.getMessage(), "details", List.of());
  }

  @ExceptionHandler(AuthException.class)
  @ResponseStatus(HttpStatus.UNAUTHORIZED)
  public Map<String, Object> authError(AuthException ex) {
    return Map.of("code", "AUTH_ERROR", "message", ex.getMessage(), "details", List.of());
  }

  @ExceptionHandler(NotFoundException.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  public Map<String, Object> notFound(NotFoundException ex) {
    return Map.of("code", "NOT_FOUND", "message", ex.getMessage(), "details", List.of());
  }

  @ExceptionHandler(SttException.class)
  @ResponseStatus(HttpStatus.BAD_GATEWAY)
  public Map<String, Object> sttError(SttException ex) {
    return Map.of("code", "STT_ERROR", "message", ex.getMessage(), "details", List.of());
  }
}
