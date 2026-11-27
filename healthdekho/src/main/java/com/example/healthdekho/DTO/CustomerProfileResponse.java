package com.example.healthdekho.DTO;

import java.time.LocalDate;

import com.example.healthdekho.entities.Customer;

public record CustomerProfileResponse(Long id, String email, String fullName,LocalDate dateOfBirth) {
    public static CustomerProfileResponse from(Customer customer) {
        return new CustomerProfileResponse(customer.getCustomerId(), customer.getEmail(), customer.getFullName(), customer.getDateOfBirth());
    }
}
