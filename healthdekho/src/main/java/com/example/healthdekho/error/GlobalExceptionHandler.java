package com.example.healthdekho.error;

import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> handleAuthentication(AuthenticationException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(error(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception) {
        List<ApiError.FieldError> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new ApiError.FieldError(error.getField(), error.getDefaultMessage()))
                .toList();
        ApiError body = new ApiError(Instant.now(), HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(), "Validation failed", fieldErrors);
        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleMalformedRequest(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(error(HttpStatus.BAD_REQUEST, "Malformed request"));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.resolve(exception.getStatusCode().value());
        HttpStatus resolved = status == null ? HttpStatus.INTERNAL_SERVER_ERROR : status;
        String message = resolved == HttpStatus.UNAUTHORIZED ? "Authentication required" : resolved.getReasonPhrase();
        return ResponseEntity.status(resolved).body(error(resolved, message));
    }

    private ApiError error(HttpStatus status, String message) {
        return new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), message, List.of());
    }
}
