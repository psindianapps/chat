package com.example.chat.entity;

import com.example.chat.enums.ConversationRoleEnum;
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
@Table(name = "conversation_participants")
public class ConversationParticipantEntity {

//    CREATE TABLE conversation_participants (
//            id BIGINT PRIMARY KEY AUTO_INCREMENT,
//            conversation_id BIGINT NOT NULL,
//            user_id BIGINT NOT NULL,
//            role ENUM('ADMIN', 'MEMBER') DEFAULT 'MEMBER',   -- group admin ke liye
//    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//    last_read_message_id BIGINT,          -- unread count nikalne ke liye
//    is_muted BOOLEAN DEFAULT FALSE,
//    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
//    FOREIGN KEY (user_id) REFERENCES users(id),
//    UNIQUE (conversation_id, user_id),
//    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "conversation_id")
    private ConversationEntity conversationId;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity userId;

    @NotNull
    @Enumerated(EnumType.STRING)
    private ConversationRoleEnum role= ConversationRoleEnum.MEMBER;

    private LocalDateTime joinedAt;
    @ManyToOne
    @JoinColumn(name = "last_message_read_id", nullable = true)
    private UserEntity lastMessageReadId;

    private boolean isMuted;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    private void prePersist(){
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    private void preUpdate(){
        this.updatedAt = LocalDateTime.now();
    }

}

