package com.example.chat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class  LoginResponseDTO {
    private String username;
    private String email;
    private Integer status;
    private String token;
}
