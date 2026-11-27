package com.example.healthdekho.repositories;

import com.example.healthdekho.entities.PremiumInstallment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PremiumInstallmentRepository
        extends JpaRepository<PremiumInstallment, Long> {
}