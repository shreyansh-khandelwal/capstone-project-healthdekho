package com.example.healthdekho.repositories;

import com.example.healthdekho.entities.InsuranceProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
@Repository
public interface InsuranceProductRepository extends JpaRepository<InsuranceProduct, Long> {

    Page<InsuranceProduct> findByActiveTrueOrderByPolicyNameAsc(Pageable pageable);
    
    Optional<InsuranceProduct> findByProductCodeAndActiveTrue(String productCode);
    List<InsuranceProduct> findByActiveTrue();
}