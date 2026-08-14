package com.example.chat.controller;

import com.example.chat.dto.request.LoginRequestDto;
import com.example.chat.dto.request.RegisterRequestDTO;
import com.example.chat.dto.response.ApiResponse;
import com.example.chat.dto.response.LoginResponseDTO;
import com.example.chat.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/public")
public class LoginController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequestDTO registerRequestDTO) {
            System.out.println(registerRequestDTO);
        ApiResponse<Object> apiResponse = userService.register(registerRequestDTO);
        return new ResponseEntity<>(apiResponse, HttpStatus.OK);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequestDto request) {
        try{
           String username = request.getUsername();
           String password = request.getPassword();
           LoginResponseDTO responseDTO = userService.login(username, password);
           return  ResponseEntity.ok(new ApiResponse<>(
                   true,
                   200,
                   "Login Successfully",
                   responseDTO
           ));
        } catch (Exception e){
            return ResponseEntity.badRequest().build();
        }
    }
}
