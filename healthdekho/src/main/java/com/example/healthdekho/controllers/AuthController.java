package com.example.healthdekho.controllers;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.healthdekho.DTO.CustomerProfileResponse;
import com.example.healthdekho.DTO.LoginRequest;
import com.example.healthdekho.services.AuthService;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final AuthService authService;
    private final HttpSessionSecurityContextRepository securityContextRepository =
            new HttpSessionSecurityContextRepository();

    public AuthController(AuthenticationManager authenticationManager, AuthService authService) {
        this.authenticationManager = authenticationManager;
        this.authService = authService;
    }

    @PostMapping("/login")
    public CustomerProfileResponse login(@Valid @RequestBody LoginRequest request,
                                         HttpServletRequest servletRequest,
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
