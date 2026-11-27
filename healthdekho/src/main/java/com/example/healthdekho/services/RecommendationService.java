package com.example.healthdekho.services;

import com.example.healthdekho.DTO.AiProductRecommendation;
import com.example.healthdekho.DTO.RecommendationRequest;
import com.example.healthdekho.DTO.RecommendationResponse;
import com.example.healthdekho.entities.AiRecommendationItem;
import com.example.healthdekho.entities.AiRecommendationRequest;
import com.example.healthdekho.entities.Customer;
import com.example.healthdekho.entities.CustomerPolicy;
import com.example.healthdekho.entities.InsuranceProduct;
import com.example.healthdekho.repositories.AiRecommendationItemRepository;
import com.example.healthdekho.repositories.AiRecommendationRequestRepository;
import com.example.healthdekho.repositories.CustomerRepository;
import com.example.healthdekho.repositories.InsuranceProductRepository;
import com.example.healthdekho.repositories.PolicyRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RecommendationService {

    private final CustomerRepository customerRepository;
    private final InsuranceProductRepository productRepository;
    private final PolicyRepository policyRepository;

    private final AiRecommendationRequestRepository recommendationRequestRepository;
    private final AiRecommendationItemRepository recommendationItemRepository;

    private final ChatClient chatClient;

    public List<RecommendationResponse> generateRecommendations(
            String customerEmail,
            RecommendationRequest request) {

        Customer customer =
                customerRepository
                        .findByEmailIgnoreCase(customerEmail)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Customer not found"));

        LocalDate dob =
                request.dateOfBirth() != null
                        ? request.dateOfBirth()
                        : customer.getDateOfBirth();

        validateDob(dob);

        int age = calculateAge(dob);

        List<InsuranceProduct> activeProducts =
                productRepository.findByActiveTrue();

        List<CustomerPolicy> existingPolicies =
                policyRepository.findByCustomerCustomerId(
                        customer.getCustomerId());

        Set<Long> alreadyOwnedProductIds =
                existingPolicies.stream()
                        .map(CustomerPolicy::getProduct)
                        .filter(Objects::nonNull)
                        .map(InsuranceProduct::getProductId)
                        .collect(Collectors.toSet());

        List<InsuranceProduct> eligibleProducts =
                activeProducts.stream()

                        .filter(product ->
                                Boolean.TRUE.equals(product.getActive()))

                        .filter(product ->
                                age >= product.getMinEntryAge())

                        .filter(product ->
                                age <= product.getMaxEntryAge())

                        .filter(product ->
                                !alreadyOwnedProductIds.contains(
                                        product.getProductId()))

                        .filter(product ->
                                request.preferredPolicyType() == null
                                        || request.preferredPolicyType().isBlank()
                                        || product.getPolicyType()
                                                .name()
                                                .equalsIgnoreCase(
                                                        request.preferredPolicyType()))

                        .filter(product ->
                                request.preferredTerm() == null
                                        || product.getTermMonths()
                                        >= request.preferredTerm())

                        .toList();

        if (eligibleProducts.isEmpty()) {
            return List.of();
        }

        if (request.preferredTerm() != null
                && request.preferredTerm() <= 0) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Preferred term must be positive");
        }

        AiRecommendationRequest recommendationRequest =
                recommendationRequestRepository.save(

                        AiRecommendationRequest.builder()
                                .customer(customer)
                                .insuranceGoals(request.insuranceGoals())
                                .preferredTerm(request.preferredTerm())
                                .preferredPolicyType(
                                        request.preferredPolicyType())
                                .calculatedAge(age)
                                .modelName("amazon-bedrock")
                                .modelVersion("v1")
                                .promptVersion("v1")
                                .requestedAt(LocalDateTime.now())
                                .build());

        String prompt =
                buildPrompt(
                        age,
                        request,
                        eligibleProducts);

        List<AiProductRecommendation> aiRecommendations =
                invokeAi(prompt);

        if (aiRecommendations == null
                || aiRecommendations.isEmpty()) {
            return List.of();
        }

        Map<String, InsuranceProduct> productMap =
                eligibleProducts.stream()
                        .collect(Collectors.toMap(
                                InsuranceProduct::getProductCode,
                                Function.identity()));

        List<RecommendationResponse> recommendations =
                new ArrayList<>();

        int rank = 1;

        for (AiProductRecommendation aiRecommendation
                : aiRecommendations) {

            InsuranceProduct product =
                    productMap.get(
                            aiRecommendation.productCode());

            /*
             * Protect against hallucinated products.
             */
            if (product == null) {
                continue;
            }

            recommendationItemRepository.save(

                    AiRecommendationItem.builder()
                            .recommendationRequest(
                                    recommendationRequest)
                            .product(product)
                            .rankOrder(rank++)
                            .recommendationReason(
                                    aiRecommendation
                                            .recommendationReason())
                            .suitability(
                                    aiRecommendation
                                            .suitability())
                            .selectedForRegistration(false)
                            .build());

            recommendations.add(

                    new RecommendationResponse(

                            product.getProductCode(),

                            product.getPolicyName(),

                            product.getPolicyType().name(),

                            product.getTermMonths(),

                            product.getSumInsured(),

                            product.getPremiumFrequency().name(),

                            product.getPremiumAmount(),

                            aiRecommendation
                                    .recommendationReason(),

                            aiRecommendation
                                    .suitability(),

                            product.getProductId()));
        }

        return List.copyOf(recommendations);
    }

    private void validateDob(LocalDate dob) {

        if (dob.isAfter(LocalDate.now())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Date of birth cannot be future dated");
        }
    }

    private int calculateAge(LocalDate dob) {

        return Period.between(
                dob,
                LocalDate.now())
                .getYears();
    }

    private List<AiProductRecommendation> invokeAi(
            String prompt) {

        try {

            return chatClient.prompt()

                    .user(prompt)

                    .call()

                    .entity(
                            new ParameterizedTypeReference<
                                    List<AiProductRecommendation>>() {
                            });

        } catch (Exception ex) {

            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to generate AI recommendations",
                    ex);
        }
    }

    private String buildPrompt(
            int age,
            RecommendationRequest request,
            List<InsuranceProduct> products) {

        String catalog =
                products.stream()

                        .map(product -> """
                                ProductCode=%s,
                                PolicyName=%s,
                                PolicyType=%s,
                                TermMonths=%d,
                                PremiumAmount=%s,
                                PremiumFrequency=%s,
                                SumInsured=%s
                                """
                                .formatted(
                                        product.getProductCode(),
                                        product.getPolicyName(),
                                        product.getPolicyType().name(),
                                        product.getTermMonths(),
                                        product.getPremiumAmount(),
                                        product.getPremiumFrequency().name(),
                                        product.getSumInsured()))

                        .collect(Collectors.joining("\n"));

        return """
                You are an insurance recommendation assistant.

                Customer Age:
                %d

                Insurance Goals:
                %s

                Preferred Policy Term:
                %s

                Preferred Policy Type:
                %s

                AVAILABLE PRODUCTS:

                %s

                RULES:

                1. Recommend ONLY from AVAILABLE PRODUCTS.
                2. Do NOT create new products.
                3. Do NOT modify product codes.
                4. Return maximum 3 recommendations.
                5. Suitability should be between 1 and 100.
                6. Explain recommendation in simple insurance terms.

                Return strictly as JSON array.

                Example:

                [
                  {
                    "productCode":"TERM001",
                    "recommendationReason":"Suitable for family protection and long term coverage.",
                    "suitability":95
                  }
                ]
                """
                .formatted(
                        age,
                        request.insuranceGoals(),
                        request.preferredTerm(),
                        request.preferredPolicyType(),
                        catalog);
    }
}