package com.example.healthdekho.services;

import java.util.Optional;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import com.example.healthdekho.entities.Customer;
import com.example.healthdekho.repositories.CustomerRepository;

@Service
public class AuthService {

    private final CustomerRepository customerRepository;

    public AuthService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public Optional<Customer> authenticatedCustomer(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return Optional.empty();
        }
        return customerRepository.findByEmailIgnoreCase(authentication.getName());
    }
}
