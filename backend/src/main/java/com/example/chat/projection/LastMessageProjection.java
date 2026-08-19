package com.example.chat.projection;

import java.time.LocalDateTime;

public interface LastMessageProjection {
    String getContent();

    Boolean getOnline();

    String getProfilePicUrl();

    String getMessageType();

    LocalDateTime getCreatedAt();

    Long getSenderId();
}
