package com.example.healthdekho.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Locale;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "customer")
@Getter
@NoArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "customer_id")
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column(name = "date_of_birth", nullable = false)
    private LocalDate dateOfBirth;

    private String phone;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public Customer(String email, String passwordHash, String fullName, LocalDate dateOfBirth,
                    String phone, String status, Instant createdAt) {
        this.email = email.trim().toLowerCase(Locale.ROOT);
        this.passwordHash = passwordHash;
        this.fullName = fullName;
        this.dateOfBirth = dateOfBirth;
        this.phone = phone;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = createdAt;
    }
}
