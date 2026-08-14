package com.example.chat.controller;

import com.example.chat.dto.response.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/public")
public class HealthCheckController {

    @GetMapping("/health")
    public ResponseEntity<ApiResponse> checkHealth() {
        return ResponseEntity.ok(new ApiResponse(
                true,
                200,
                "Worked",
                null
        ));
    }
}
