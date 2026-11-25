package com.example.healthdekho.DTO;

import java.util.List;

public record PolicyPageResponse(
        List<PolicyResponse> policies,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last) {
}
