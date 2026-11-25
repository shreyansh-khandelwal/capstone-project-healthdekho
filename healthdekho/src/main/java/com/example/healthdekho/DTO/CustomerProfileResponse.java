package com.example.healthdekho.DTO;

import com.example.healthdekho.entities.Customer;

public record CustomerProfileResponse(Long id, String email, String fullName) {
    public static CustomerProfileResponse from(Customer customer) {
        return new CustomerProfileResponse(customer.getId(), customer.getEmail(), customer.getFullName());
    }
}
