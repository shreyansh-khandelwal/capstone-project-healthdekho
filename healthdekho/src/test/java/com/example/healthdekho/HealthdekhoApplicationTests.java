package com.example.healthdekho;

import com.example.healthdekho.entities.Customer;
import com.example.healthdekho.entities.Policy;
import com.example.healthdekho.repositories.CustomerRepository;
import com.example.healthdekho.repositories.PolicyRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class HealthdekhoApplicationTests {

    private static final String EMAIL = "customer@healthdekho.test";
    private static final String PASSWORD = "correct horse battery staple";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private PolicyRepository policyRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        policyRepository.deleteAll();
        customerRepository.deleteAll();
        customerRepository.save(new Customer(
                EMAIL,
                passwordEncoder.encode(PASSWORD),
                "Test Customer",
                LocalDate.of(1990, 1, 1),
                null,
                "ACTIVE",
                Instant.now()));
    }

    @Test
    void validCredentialsCreateProtectedSessionAndReturnSafeProfile() throws Exception {
        MvcResult login = login(EMAIL, PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.email", is(EMAIL)))
                .andExpect(jsonPath("$.fullName", is("Test Customer")))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andReturn();

        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        org.junit.jupiter.api.Assertions.assertNotNull(session);
        mockMvc.perform(get("/api/v1/dashboard").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.policies").isArray())
                .andExpect(jsonPath("$.email").doesNotExist());
    }

    @Test
    void invalidCredentialsUseStandard401WithoutCreatingSession() throws Exception {
        login(EMAIL, "wrong password")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")))
                .andExpect(jsonPath("$.message", is("Invalid email or password")))
                .andExpect(jsonPath("$.password").doesNotExist());

        login("unknown@healthdekho.test", PASSWORD)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    void invalidLoginPayloadUsesStandardValidationEnvelope() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-an-email","password":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", is("Validation failed")))
                .andExpect(jsonPath("$.fieldErrors.length()", is(2)));
    }

    @Test
    void stateChangingAuthenticationRequestsRequireCsrfToken() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(EMAIL, PASSWORD)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", is("Request rejected")));
    }

    @Test
    void successfulLoginRotatesAnExistingSessionId() throws Exception {
        MockHttpSession existingSession = new MockHttpSession();
        String previousSessionId = existingSession.getId();

        MvcResult result = login(EMAIL, PASSWORD, existingSession).andReturn();

        assertNotEquals(previousSessionId, result.getRequest().getSession(false).getId());
    }

    @Test
    void malformedLoginUsesTheStandardErrorEnvelope() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", is("Malformed request")));
    }

    @Test
    void missingOrExpiredSessionsCannotReachProtectedResources() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.email").doesNotExist());

        MvcResult login = login(EMAIL, PASSWORD).andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);
        session.invalidate();

        mockMvc.perform(get("/api/v1/auth/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logoutClearsTheActiveSession() throws Exception {
        MvcResult login = login(EMAIL, PASSWORD).andReturn();
        MockHttpSession session = (MockHttpSession) login.getRequest().getSession(false);

        mockMvc.perform(post("/api/v1/auth/logout").session(session).with(csrf()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/auth/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void dashboardReturnsOnlyOwnedPoliciesWithCompleteFactsInIdentifierOrder() throws Exception {
        Customer owner = customerRepository.findByEmailIgnoreCase(EMAIL).orElseThrow();
        Customer other = customerRepository.save(new Customer(
                "other@healthdekho.test",
                passwordEncoder.encode(PASSWORD),
                "Other Customer",
                LocalDate.of(1988, 6, 12),
                null,
                "ACTIVE",
                Instant.now()));
        policyRepository.save(new Policy(
                owner, "POL-Z", "Family Shield", "Health", 12,
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31),
                "Monthly", new BigDecimal("1499.00"), new BigDecimal("500000.00"), "ACTIVE"));
        policyRepository.save(new Policy(
                owner, "POL-A", "Life Secure", "Life", 240,
                LocalDate.of(2026, 2, 1), LocalDate.of(2046, 1, 31),
                "Quarterly", new BigDecimal("4250.00"), new BigDecimal("2500000.00"), "ACTIVE"));
        policyRepository.save(new Policy(
                other, "POL-PRIVATE", "Private Product", "Health", 12,
                LocalDate.of(2026, 3, 1), LocalDate.of(2027, 2, 28),
                "Annual", BigDecimal.ONE, BigDecimal.TEN, "ACTIVE"));
        MockHttpSession session = loginAndSession();

        mockMvc.perform(get("/api/v1/dashboard")
                        .session(session)
                        .param("page", "0")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.policies.length()", is(1)))
                .andExpect(jsonPath("$.policies[0].policyIdentifier", is("POL-A")))
                .andExpect(jsonPath("$.policies[0].productName", is("Life Secure")))
                .andExpect(jsonPath("$.policies[0].policyType", is("Life")))
                .andExpect(jsonPath("$.policies[0].termMonths", is(240)))
                .andExpect(jsonPath("$.policies[0].startDate", is("2026-02-01")))
                .andExpect(jsonPath("$.policies[0].maturityDate", is("2046-01-31")))
                .andExpect(jsonPath("$.policies[0].premiumFrequency", is("Quarterly")))
                .andExpect(jsonPath("$.policies[0].premiumAmount", is(4250.00)))
                .andExpect(jsonPath("$.policies[0].sumInsured", is(2500000.00)))
                .andExpect(jsonPath("$.policies[0].status", is("ACTIVE")))
                .andExpect(jsonPath("$.totalElements", is(2)))
                .andExpect(jsonPath("$.totalPages", is(2)))
                .andExpect(jsonPath("$.policies[0].policyIdentifier").value(
                        org.hamcrest.Matchers.not("POL-PRIVATE")));
    }

    @Test
    void dashboardReturnsAUsefulEmptyPortfolio() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard").session(loginAndSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.policies.length()", is(0)))
                .andExpect(jsonPath("$.totalElements", is(0)))
                .andExpect(jsonPath("$.first", is(true)))
                .andExpect(jsonPath("$.last", is(true)));
    }

    @Test
    void policyDetailsRejectOtherCustomersWithoutDisclosingTheRecord() throws Exception {
        Customer other = customerRepository.save(new Customer(
                "other@healthdekho.test",
                passwordEncoder.encode(PASSWORD),
                "Other Customer",
                LocalDate.of(1988, 6, 12),
                null,
                "ACTIVE",
                Instant.now()));
        policyRepository.save(new Policy(
                other, "POL-PRIVATE", "Private Product", "Health", 12,
                LocalDate.of(2026, 3, 1), LocalDate.of(2027, 2, 28),
                "Annual", BigDecimal.ONE, BigDecimal.TEN, "ACTIVE"));

        mockMvc.perform(get("/api/v1/policies/POL-PRIVATE").session(loginAndSession()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.policyIdentifier").doesNotExist())
                .andExpect(jsonPath("$.productName").doesNotExist());
        mockMvc.perform(get("/api/v1/policies/UNKNOWN").session(loginAndSession()))
                .andExpect(status().isForbidden());
    }

    @Test
    void dashboardMeetsTheLatencyTargetOnTheAgreedTestDataset() throws Exception {
        Customer owner = customerRepository.findByEmailIgnoreCase(EMAIL).orElseThrow();
        for (int index = 0; index < 20; index++) {
            policyRepository.save(new Policy(
                    owner, "PERF-%02d".formatted(index), "Performance Policy", "Health", 12,
                    LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31),
                    "Monthly", BigDecimal.ONE, BigDecimal.TEN, "ACTIVE"));
        }
        MockHttpSession session = loginAndSession();
        mockMvc.perform(get("/api/v1/dashboard").session(session)).andExpect(status().isOk());
        List<Long> durations = new ArrayList<>();
        for (int request = 0; request < 20; request++) {
            long started = System.nanoTime();
            mockMvc.perform(get("/api/v1/dashboard").session(session)).andExpect(status().isOk());
            durations.add((System.nanoTime() - started) / 1_000_000);
        }
        Collections.sort(durations);
        long p95 = durations.get((int) Math.ceil(durations.size() * 0.95) - 1);
        org.junit.jupiter.api.Assertions.assertTrue(
                p95 < 300, "Expected dashboard p95 below 300 ms, observed " + p95 + " ms");
    }

    private MockHttpSession loginAndSession() throws Exception {
        return (MockHttpSession) login(EMAIL, PASSWORD).andReturn().getRequest().getSession(false);
    }

    private org.springframework.test.web.servlet.ResultActions login(String email, String password)
            throws Exception {
        return login(email, password, null);
    }

    private org.springframework.test.web.servlet.ResultActions login(
            String email, String password, MockHttpSession session) throws Exception {
        MockHttpServletRequestBuilder request = post("/api/v1/auth/login");
        if (session != null) {
            request.session(session);
        }
        return mockMvc.perform(request
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"%s","password":"%s"}
                        """.formatted(email, password)));
    }
}
