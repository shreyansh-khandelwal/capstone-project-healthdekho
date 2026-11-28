package com.example.healthdekho.DTO;

public record CustomerRegistrationResponse(

        Long customerId,

        String email,

        String fullName,

        String message
) {
}