package com.example.chat.controller;

import com.example.chat.dto.response.ApiResponse;
import com.example.chat.dto.response.ConversationListDTO;
import com.example.chat.dto.response.MessageDTO;
import com.example.chat.filter.CustomUserDetails;
import com.example.chat.service.ChatService;
import com.example.chat.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;

@RestController
@RequestMapping("/chat")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse> getAllUsers(@RequestParam(required = false) String search, @RequestParam(required = false, defaultValue = "0") int page, @RequestHeader("Authorization") String authorization) {
        String token = authorization.replace("Bearer ", "");
        Long currentUserId = jwtUtils.extractUserId(token);
        return  ResponseEntity.ok(new ApiResponse(
                true,
                200,
                "User fetched",
                chatService.getAllUsers(search, currentUserId, page)
        ));
    }

    @GetMapping("/conversations")
    public Mono<ResponseEntity<ApiResponse<List<ConversationListDTO>>>> getConversations() {

        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> (CustomUserDetails) auth.getPrincipal())
                .flatMap(userDetails -> chatService.getConversations(userDetails.getId()))
                .map(conversations -> ResponseEntity.ok(
                        new ApiResponse<>(true, 200, "Conversations fetched", conversations)
                ));
    }

    @GetMapping("/messages/{conversationId}")
    public Mono<ResponseEntity<ApiResponse<Page<MessageDTO>>>> getMessages(
            @PathVariable Long conversationId,
            @RequestParam(defaultValue = "0") int page) {

        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .map(auth -> (CustomUserDetails) auth.getPrincipal())
                .flatMap(userDetails ->
                        chatService.getMessages(conversationId, userDetails.getId(), page)
                )
                .map(ResponseEntity::ok);
    }
}
