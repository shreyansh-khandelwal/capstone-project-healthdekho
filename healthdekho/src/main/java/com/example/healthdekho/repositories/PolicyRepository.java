package com.example.healthdekho.repositories;

import com.example.healthdekho.entities.Policy;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PolicyRepository extends JpaRepository<Policy, Long> {
    Page<Policy> findByCustomerId(Long customerId, Pageable pageable);

    Optional<Policy> findByPolicyIdentifier(String policyIdentifier);
}
