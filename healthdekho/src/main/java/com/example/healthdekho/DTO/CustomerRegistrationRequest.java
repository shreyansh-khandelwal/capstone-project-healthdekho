package com.example.healthdekho.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;

public record CustomerRegistrationRequest(

        @NotBlank
        @Email
        String email,

        @NotBlank
        String password,

        @NotBlank
        String fullName,

        @Past
        LocalDate dateOfBirth,

        @Pattern(
                regexp = "^[0-9]{10}$",
                message = "Phone number must be 10 digits")
        String phone
) {
}