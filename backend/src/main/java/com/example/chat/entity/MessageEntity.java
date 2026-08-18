package com.example.chat.entity;

import com.example.chat.enums.MessageStatusEnum;
import com.example.chat.enums.MessageTypeEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "messages")
public class MessageEntity {
    /*
    CREATE TABLE messages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    conversation_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    message_type ENUM('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'CALL_LOG') NOT NULL DEFAULT 'TEXT',
    content TEXT,                         -- text message ke liye
    media_id BIGINT,                      -- FK -> media_files.id (agar media hai)
    reply_to_message_id BIGINT,           -- reply/quote feature ke liye
    status ENUM('SENT', 'DELIVERED', 'READ') DEFAULT 'SENT',
    is_deleted BOOLEAN DEFAULT FALSE,     -- soft delete
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (media_id) REFERENCES media_files(id),
    FOREIGN KEY (reply_to_message_id) REFERENCES messages(id),
    INDEX idx_conversation_created (conversation_id, created_at)   -- pagination ke liye critical,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
     */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long conversationId;

    private Long senderId;

    @NotNull
    @Enumerated(EnumType.STRING)
    private MessageTypeEnum messageType;

    @NotNull
    private String content;

    private Long mediaId;
    private Long replyToMessageId;

    @NotNull
    @Enumerated(EnumType.STRING)
    private MessageStatusEnum status;

    private boolean isDeleted=false;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate(){
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate(){
        this.updatedAt = LocalDateTime.now();
    }

}


