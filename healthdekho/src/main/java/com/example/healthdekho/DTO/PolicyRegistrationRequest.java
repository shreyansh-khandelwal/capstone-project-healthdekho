package com.example.healthdekho.DTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class PolicyRegistrationRequest {

    @NotBlank
    private String productCode;

    @NotNull
    private LocalDate startDate;
}