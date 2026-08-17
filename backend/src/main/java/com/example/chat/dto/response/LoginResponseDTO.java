package com.example.chat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class  LoginResponseDTO {
    private Long id;
    private String username;
    private String email;
    private String displayName;
    private String profileUrl;
    private String statusMessage;
    private LocalDateTime lastSeen;
    private boolean isOnline;
    private String token;
}
