package com.example.chat.controller;

import com.example.chat.dto.response.LoginResponseDTO;
import com.example.chat.filter.CustomUserDetails;
import com.example.chat.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import reactor.core.publisher.Mono;

import java.util.List;

@Controller
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @GetMapping("/users")
    public Mono<ResponseEntity<List<LoginResponseDTO>>> getAllUsers() {

        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> (CustomUserDetails) auth.getPrincipal())
                .map(userDetails ->
                        chatService.getAllUsers(userDetails.getId())
                )
                .map(ResponseEntity::ok);
    }

}
