package com.example.healthdekho;

import com.example.healthdekho.DTO.AvailableProductResponse;
import com.example.healthdekho.controllers.ProductController;
import com.example.healthdekho.core.enums.PolicyType;
import com.example.healthdekho.core.enums.PremiumFrequency;
import com.example.healthdekho.services.ProductDiscoveryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductDiscoveryService productDiscoveryService;

    @Test
    @WithMockUser(username = "customer@gmail.com")
    @DisplayName("GET /api/products/available returns filtered active products")
    void shouldReturnAvailableProducts() throws Exception {
        List<AvailableProductResponse> products = List.of(
                new AvailableProductResponse(
                        1L,
                        "TERM001",
                        "Secure Life Term Plan",
                        PolicyType.TERM,
                        240,
                        new BigDecimal("5000000.00"),
                        PremiumFrequency.MONTHLY,
                        new BigDecimal("2500.00"),
                        18,
                        60
                ),
                new AvailableProductResponse(
                        2L,
                        "HLTH001",
                        "Family Health Shield",
                        PolicyType.HEALTH,
                        120,
                        new BigDecimal("1000000.00"),
                        PremiumFrequency.MONTHLY,
                        new BigDecimal("1800.00"),
                        18,
                        65
                ),
                new AvailableProductResponse(
                        3L,
                        "RET001",
                        "Retirement Pension Plus",
                        PolicyType.RETIREMENT,
                        300,
                        new BigDecimal("2500000.00"),
                        PremiumFrequency.MONTHLY,
                        new BigDecimal("3500.00"),
                        25,
                        55
                )
        );

        when(productDiscoveryService.getAvailableProductsForCustomer(eq("customer@gmail.com"), any(Pageable.class)))
                .thenReturn(products);

        mockMvc.perform(get("/api/v1/products/available")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].productCode").value("TERM001"))
                .andExpect(jsonPath("$[0].policyName").value("Secure Life Term Plan"))
                .andExpect(jsonPath("$[0].policyType").value("TERM"))
                .andExpect(jsonPath("$[0].termMonths").value(240))
                .andExpect(jsonPath("$[0].sumInsured").value(5000000.00))
                .andExpect(jsonPath("$[0].premiumAmount").value(2500.00))
                .andExpect(jsonPath("$[1].productCode").value("HLTH001"))
                .andExpect(jsonPath("$[1].policyName").value("Family Health Shield"))
                .andExpect(jsonPath("$[1].policyType").value("HEALTH"))
                .andExpect(jsonPath("$[1].sumInsured").value(1000000.00))
                .andExpect(jsonPath("$[1].premiumAmount").value(1800.00))
                .andExpect(jsonPath("$[2].productCode").value("RET001"))
                .andExpect(jsonPath("$[2].policyName").value("Retirement Pension Plus"))
                .andExpect(jsonPath("$[2].policyType").value("RETIREMENT"))
                .andExpect(jsonPath("$[2].sumInsured").value(2500000.00))
                .andExpect(jsonPath("$[2].premiumAmount").value(3500.00));
    }

    @Test
    @DisplayName("GET /api/products/available blocks unauthenticated requests")
    void shouldRejectUnauthenticatedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/products/available")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}