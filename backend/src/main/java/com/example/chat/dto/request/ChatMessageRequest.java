package com.example.chat.dto.request;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ChatMessageRequest {
    private Long conversationId;
    private String sender;
    private String receiver;
    private String username;
    private String displayname;
    private String message;
    private String messageType;
    private boolean isOnline;
    private String profilePicUrl;
    private LocalDateTime createdAt;
    private String lastMessage;

}
