package com.example.chat.dto.request;

import lombok.Data;

@Data
public class ChatMessageRequest {
    private String sender;
    private String receiver;
    private String message;
    private String time;
}
