package com.example.healthdekho.services;

import com.example.healthdekho.DTO.CustomerProfileResponse;

import com.example.healthdekho.DTO.CustomerRegistrationRequest;
import com.example.healthdekho.DTO.CustomerRegistrationResponse;
import com.example.healthdekho.DTO.LoginRequest;
import com.example.healthdekho.core.enums.CustomerStatus;
import com.example.healthdekho.entities.Customer;
import com.example.healthdekho.repositories.CustomerRepository;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.authentication.AuthenticationManager;

import org.springframework.security.core.Authentication;
import java.time.LocalDate;
import java.time.Period;

@Service
@RequiredArgsConstructor
@Transactional
public class CustomerRegistrationService {

    private final CustomerRepository customerRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final AuthService authService;
     private final HttpSessionSecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();


public CustomerProfileResponse login(
        LoginRequest request,HttpServletRequest servletRequest,
                                         HttpServletResponse servletResponse) {
     String email = request.email() == null ? "" : request.email().trim();
        String password = request.password() == null ? "" : request.password();
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));
        CustomerProfileResponse profile = authService.authenticatedCustomer(authentication)
                .map(CustomerProfileResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (servletRequest.getSession(false) != null) {
            servletRequest.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, servletRequest, servletResponse);

        return profile;
}


    public CustomerRegistrationResponse register(
            CustomerRegistrationRequest request) {

        validateRequest(request);

        if (customerRepository.existsByEmailIgnoreCase(
                request.email())) {

            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email already registered");
        }

        Customer customer =
                Customer.builder()
                        .email(request.email().trim().toLowerCase())
                        .passwordHash(
                                passwordEncoder.encode(
                                        request.password()))
                        .fullName(request.fullName().trim())
                        .dateOfBirth(request.dateOfBirth())
                        .phone(request.phone())
                        .status(CustomerStatus.ACTIVE)
                        .build();

        customer = customerRepository.save(customer);

        return new CustomerRegistrationResponse(
                customer.getCustomerId(),
                customer.getEmail(),
                customer.getFullName(),
                "Customer registered successfully");
    }

    private void validateRequest(
            CustomerRegistrationRequest request) {

        if (request.dateOfBirth()
                .isAfter(LocalDate.now())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Date of birth cannot be future dated");
        }

        int age =
                Period.between(
                        request.dateOfBirth(),
                        LocalDate.now())
                        .getYears();

        if (age < 18) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Customer must be at least 18 years old");
        }

        if (request.password().length() < 8) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must contain at least 8 characters");
        }
    }
}