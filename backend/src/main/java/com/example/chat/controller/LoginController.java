package com.example.chat.controller;

import com.example.chat.dto.response.ApiResponse;
import com.example.chat.dto.response.LoginResponseDTO;
import com.example.chat.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/public")
public class LoginController {

    @Autowired
    private UserService userService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String username, @RequestParam String password) {
        try{
           LoginResponseDTO responseDTO = userService.login(username, password);
           return  ResponseEntity.ok(new ApiResponse<>(
                   true,
                   "Login Successfully",
                   responseDTO
           ));
        } catch (Exception e){
            return ResponseEntity.badRequest().build();
        }
    }
}
