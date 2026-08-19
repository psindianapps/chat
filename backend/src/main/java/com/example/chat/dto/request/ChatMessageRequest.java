package com.example.chat.dto.request;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChatMessageRequest {
    private Long id;                  // NEW — message ka DB id, frontend key + dedup ke liye
    private Long conversationId;
    private Long sender;              // String → Long (userId hamesha numeric hai)
    private Long receiver;            // String → Long
    private String username;
    private String displayname;
    private String message;
    private String messageType;
    private boolean isOnline;
    private String profilePicUrl;
    private LocalDateTime createdAt;
    private String lastMessage;
    private String status;            // NEW — SENT/DELIVERED/READ
}
