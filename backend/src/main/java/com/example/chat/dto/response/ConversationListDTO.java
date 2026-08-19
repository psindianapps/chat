package com.example.chat.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConversationListDTO {
    private Long conversationId;
    private String type;
    private String groupName;
    private String groupIconUrl;
    private Long receiverUserId;
    private String receiverUsername;
    private String receiverDisplayName;
    private String receiverProfilePic;
    private Boolean receiverIsOnline;
    private String lastMessage;
    private String lastMessageType;
    private LocalDateTime lastMessageTime;
    private Long lastMessageSenderId;
    private Long unreadCount;
}
