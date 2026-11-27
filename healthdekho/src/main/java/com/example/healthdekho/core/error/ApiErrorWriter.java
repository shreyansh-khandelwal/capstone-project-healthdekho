package com.example.healthdekho.core.error;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

public final class ApiErrorWriter {

    private ApiErrorWriter() {
    }

    public static void write(ObjectMapper objectMapper, HttpServletResponse response,
                             HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ApiError body = new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), message, List.of());
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
