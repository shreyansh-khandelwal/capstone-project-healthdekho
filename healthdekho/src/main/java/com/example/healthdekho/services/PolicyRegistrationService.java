package com.example.healthdekho.services;

import com.example.healthdekho.core.enums.PaymentStatus;
import com.example.healthdekho.core.enums.PolicyStatus;
import com.example.healthdekho.core.enums.PremiumFrequency;
import com.example.healthdekho.DTO.PolicyRegistrationRequest;
import com.example.healthdekho.DTO.PolicyRegistrationResponse;
import com.example.healthdekho.entities.*;
import com.example.healthdekho.repositories.*;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PolicyRegistrationService {

    private final CustomerRepository customerRepository;
    private final InsuranceProductRepository productRepository;
    private final PolicyRepository policyRepository;
    private final PremiumInstallmentRepository installmentRepository;

    @Transactional
    public PolicyRegistrationResponse registerPolicy(
            String customerEmail,
            PolicyRegistrationRequest request) {

                if (request.getStartDate().isBefore(LocalDate.now())) {
    throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Policy start date cannot be in the past");
}

        Customer customer = customerRepository.findByEmailIgnoreCase(customerEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Customer not found"));

        InsuranceProduct product = productRepository.findByProductCodeAndActiveTrue(
                request.getProductCode())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Product not found"));

        validateAge(customer, product);

        validateDuplicatePolicy(customer, product);

        CustomerPolicy policy = buildPolicy(customer, product, request);

        policy = policyRepository.save(policy);

        generateInstallments(policy);

        return PolicyRegistrationResponse.builder()
                .policyNumber(policy.getPolicyNumber())
                .policyName(product.getPolicyName())
                .startDate(policy.getStartDate())
                .maturityDate(policy.getMaturityDate())
                .premiumAmount(policy.getPremiumAmount())
                .sumInsured(policy.getSumInsured())
                .status(policy.getStatus().name())
                .build();
    }

    private void validateAge(
            Customer customer,
            InsuranceProduct product) {
        if (customer.getDateOfBirth().isAfter(LocalDate.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid customer date of birth");
        }
        int age = Period.between(
                customer.getDateOfBirth(),
                LocalDate.now()).getYears();

        if (age < product.getMinEntryAge()
                || age > product.getMaxEntryAge()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Customer not eligible for selected product");
        }
    }

    private void validateDuplicatePolicy(
            Customer customer,
            InsuranceProduct product) {

        if(policyRepository
        .existsByCustomerCustomerIdAndProductProductIdAndStatus(
                customer.getCustomerId(),
                product.getProductId(),
                PolicyStatus.ACTIVE)) {

    throw new ResponseStatusException(
            HttpStatus.CONFLICT,
            "Active policy already exists");
}
    }

    private CustomerPolicy buildPolicy(
            Customer customer,
            InsuranceProduct product,
            PolicyRegistrationRequest request) {

        LocalDate maturityDate = request.getStartDate()
                .plusMonths(product.getTermMonths());

        if (!maturityDate.isAfter(request.getStartDate())) {
    throw new ResponseStatusException(
            HttpStatus.BAD_REQUEST,
            "Invalid maturity date");
}

        int installments = calculateInstallments(
                product.getTermMonths(),
                product.getPremiumFrequency());

        return CustomerPolicy.builder()
                .policyNumber(generatePolicyNumber())
                .customer(customer)
                .product(product)
                .startDate(request.getStartDate())
                .maturityDate(maturityDate)
                .premiumFrequency(product.getPremiumFrequency())
                .premiumAmount(product.getPremiumAmount())
                .sumInsured(product.getSumInsured())
                .totalPremiumPayable(
                        product.getPremiumAmount()
                                .multiply(
                                        java.math.BigDecimal.valueOf(
                                                installments)))
                .status(PolicyStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private void generateInstallments(
            CustomerPolicy policy) {

        int totalInstallments = calculateInstallments(
                policy.getProduct().getTermMonths(),
                policy.getPremiumFrequency());

        LocalDate dueDate = policy.getStartDate();

        for (int i = 1; i <= totalInstallments; i++) {

            PremiumInstallment installment = PremiumInstallment.builder()
                    .policy(policy)
                    .installmentNumber(i)
                    .dueDate(dueDate)
                    .gracePeriodEndDate(
                            dueDate.plusDays(30))
                    .scheduledAmount(
                            policy.getPremiumAmount())
                    .paidAmount(java.math.BigDecimal.ZERO)
                    .paymentStatus(
                            PaymentStatus.PENDING)
                    .build();

            installmentRepository.save(installment);

            dueDate = getNextDueDate(
                    dueDate,
                    policy.getPremiumFrequency());
        }
    }

    private int calculateInstallments(
            Integer termMonths,
            PremiumFrequency frequency) {

        return switch (frequency) {

            case MONTHLY -> termMonths;

            case QUARTERLY -> termMonths / 3;

            case HALF_YEARLY -> termMonths / 6;

            case YEARLY -> termMonths / 12;
        };
    }

    private LocalDate getNextDueDate(
            LocalDate current,
            PremiumFrequency frequency) {

        return switch (frequency) {

            case MONTHLY -> current.plusMonths(1);

            case QUARTERLY -> current.plusMonths(3);

            case HALF_YEARLY -> current.plusMonths(6);

            case YEARLY -> current.plusYears(1);
        };
    }

    private String generatePolicyNumber() {

        return "POL-"
                + UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase();
    }
}