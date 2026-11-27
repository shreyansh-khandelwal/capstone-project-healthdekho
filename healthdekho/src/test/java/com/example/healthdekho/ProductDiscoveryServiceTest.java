package com.example.healthdekho;

import com.example.healthdekho.DTO.AvailableProductResponse;
import com.example.healthdekho.core.enums.PolicyType;
import com.example.healthdekho.core.enums.PremiumFrequency;
import com.example.healthdekho.entities.Customer;
import com.example.healthdekho.entities.CustomerPolicy;
import com.example.healthdekho.entities.InsuranceProduct;
import com.example.healthdekho.repositories.CustomerRepository;
import com.example.healthdekho.repositories.InsuranceProductRepository;
import com.example.healthdekho.repositories.PolicyRepository;
import com.example.healthdekho.services.ProductDiscoveryService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductDiscoveryServiceTest {

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private InsuranceProductRepository insuranceProductRepository;

    @Mock
    private PolicyRepository policyRepository;

    @InjectMocks
    private ProductDiscoveryService productDiscoveryService;

    private Customer customer;
    private InsuranceProduct termProduct;
    private InsuranceProduct healthProduct;
    private InsuranceProduct retirementProduct;

    @BeforeEach
    void setUp() {
        customer = new Customer();
        customer.setCustomerId(1L);
        customer.setEmail("customer@healthdekho.com");
        customer.setFullName("Rohan Verma");

        termProduct = InsuranceProduct.builder()
                .productId(1L)
                .productCode("TERM001")
                .policyName("Secure Life Term Plan")
                .policyType(PolicyType.TERM)
                .termMonths(240)
                .premiumFrequency(PremiumFrequency.MONTHLY)
                .premiumAmount(new BigDecimal("2500.00"))
                .sumInsured(new BigDecimal("5000000.00"))
                .minEntryAge(18)
                .maxEntryAge(60)
                .active(true)
                .build();

        healthProduct = InsuranceProduct.builder()
                .productId(2L)
                .productCode("HLTH001")
                .policyName("Family Health Shield")
                .policyType(PolicyType.HEALTH)
                .termMonths(120)
                .premiumFrequency(PremiumFrequency.MONTHLY)
                .premiumAmount(new BigDecimal("1800.00"))
                .sumInsured(new BigDecimal("1000000.00"))
                .minEntryAge(18)
                .maxEntryAge(65)
                .active(true)
                .build();

        retirementProduct = InsuranceProduct.builder()
                .productId(3L)
                .productCode("RET001")
                .policyName("Retirement Pension Plus")
                .policyType(PolicyType.RETIREMENT)
                .termMonths(300)
                .premiumFrequency(PremiumFrequency.MONTHLY)
                .premiumAmount(new BigDecimal("3500.00"))
                .sumInsured(new BigDecimal("2500000.00"))
                .minEntryAge(25)
                .maxEntryAge(55)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("Excludes active products that customer has already registered")
    void shouldExcludeAlreadyRegisteredProducts() {
        CustomerPolicy existingPolicy = new CustomerPolicy();
        existingPolicy.setProduct(healthProduct);

        when(customerRepository.findByEmailIgnoreCase("customer@healthdekho.com"))
                .thenReturn(Optional.of(customer));
        when(insuranceProductRepository.findByActiveTrueOrderByPolicyNameAsc(Pageable.unpaged()))
                .thenReturn(new PageImpl<>(List.of(healthProduct, retirementProduct, termProduct)));
        when(policyRepository.findByCustomerCustomerId(1L, Pageable.unpaged()))
                .thenReturn(new PageImpl<>(List.of(existingPolicy)));

        List<AvailableProductResponse> result =
                productDiscoveryService.getAvailableProductsForCustomer("customer@healthdekho.com", Pageable.unpaged());

        assertThat(result).hasSize(2);
        assertThat(result)
                .extracting(AvailableProductResponse::productCode)
                .containsExactly("RET001", "TERM001");
    }

    @Test
    @DisplayName("Returns all active products when customer has no existing policies")
    void shouldReturnAllActiveProductsWhenCustomerHasNoPolicies() {
        when(customerRepository.findByEmailIgnoreCase("customer@healthdekho.com"))
                .thenReturn(Optional.of(customer));
        when(insuranceProductRepository.findByActiveTrueOrderByPolicyNameAsc(Pageable.unpaged()))
                .thenReturn(new PageImpl<>(List.of(healthProduct, retirementProduct, termProduct)));
        when(policyRepository.findByCustomerCustomerId(1L, Pageable.unpaged()))
                .thenReturn(Page.empty());

        List<AvailableProductResponse> result =
                productDiscoveryService.getAvailableProductsForCustomer("customer@healthdekho.com", Pageable.unpaged());

        assertThat(result).hasSize(3);
        assertThat(result)
                .extracting(AvailableProductResponse::productCode)
                .containsExactly("HLTH001", "RET001", "TERM001");
    }

    @Test
    @DisplayName("Throws 404 when customer email is not found")
    void shouldThrowNotFoundWhenCustomerDoesNotExist() {
        when(customerRepository.findByEmailIgnoreCase("unknown@healthdekho.com"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                productDiscoveryService.getAvailableProductsForCustomer("unknown@healthdekho.com", Pageable.unpaged()))
                .isInstanceOf(ResponseStatusException.class);
    }
}