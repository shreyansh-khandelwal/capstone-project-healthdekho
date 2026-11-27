package com.example.healthdekho.repositories;

import com.example.healthdekho.core.enums.PolicyStatus;
import com.example.healthdekho.entities.CustomerPolicy;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PolicyRepository extends JpaRepository<CustomerPolicy, Long> {
    Page<CustomerPolicy> findByCustomerCustomerId(Long customerId, Pageable pageable);

    Optional<CustomerPolicy> findByPolicyNumber(String policyIdentifier);
    boolean existsByCustomerCustomerIdAndProductProductIdAndStatus(
    Long customerId,
    Long productId,
    PolicyStatus status
);
List<CustomerPolicy> findByCustomerCustomerId(Long customerId);
}
