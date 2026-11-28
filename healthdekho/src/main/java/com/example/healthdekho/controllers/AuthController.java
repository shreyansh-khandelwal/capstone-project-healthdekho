package com.example.healthdekho.controllers;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.healthdekho.DTO.CustomerProfileResponse;
import com.example.healthdekho.DTO.CustomerRegistrationRequest;
import com.example.healthdekho.DTO.CustomerRegistrationResponse;
import com.example.healthdekho.DTO.LoginRequest;
import com.example.healthdekho.services.AuthService;
import com.example.healthdekho.services.CustomerRegistrationService;

@AllArgsConstructor 
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    
    private final AuthService authService;
    private final CustomerRegistrationService registrationService;
  
   


            @PostMapping("/register")
@ResponseStatus(HttpStatus.CREATED)
public CustomerRegistrationResponse register(
        @Valid
        @RequestBody CustomerRegistrationRequest request) {

    return registrationService.register(request);
}


    @PostMapping("/login")
    public CustomerProfileResponse login(@Valid @RequestBody LoginRequest request,
                                         HttpServletRequest servletRequest,
                                         HttpServletResponse servletResponse) {
        return registrationService.login(request, servletRequest, servletResponse);
    }



    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf(CsrfToken csrfToken) {
        csrfToken.getToken();
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public CustomerProfileResponse me(Authentication authentication) {
        return authService.authenticatedCustomer(authentication)
                .map(CustomerProfileResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication, HttpServletRequest request,
                                       HttpServletResponse response) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        return ResponseEntity.noContent().build();
    }
}
