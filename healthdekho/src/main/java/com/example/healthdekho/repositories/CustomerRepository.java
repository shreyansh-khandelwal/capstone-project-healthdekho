package com.example.healthdekho.repositories;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

import com.example.healthdekho.entities.Customer;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
}
