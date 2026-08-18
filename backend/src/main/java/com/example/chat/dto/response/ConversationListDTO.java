package com.example.chat.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConversationListDTO {
    private Long conversationId;
    private String type;
    private String groupName;
    private String groupIconUrl;
    private Long otherUserId;
    private String otherUsername;
    private String otherDisplayName;
    private String otherProfilePic;
    private Boolean otherIsOnline;
    private String lastMessage;
    private String lastMessageType;
    private LocalDateTime lastMessageTime;
    private Long lastMessageSenderId;
    private Long unreadCount;
}
