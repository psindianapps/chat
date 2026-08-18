package com.example.chat.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageDTO {
    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderUsername;
    private String senderDisplayName;
    private String messageType;
    private String content;
    private Long mediaId;
    private String fileUrl;
    private String thumbnailUrl;
    private String fileType;
    private Integer durationSeconds;
    private Long replyToMessageId;
    private String status;
    private LocalDateTime createdAt;
}
