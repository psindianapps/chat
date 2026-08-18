package com.example.chat.entity;

import com.example.chat.enums.ConversationTypeEnum;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Null;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "conversations")
@AllArgsConstructor
@NoArgsConstructor
public class ConversationEntity {

    /*+
    CREATE TABLE conversations (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            type ENUM('INDIVIDUAL', 'GROUP') NOT NULL,
    name VARCHAR(150),                    -- group name (individual ke liye NULL)
    group_icon_url VARCHAR(500),          -- group ke liye
    created_by BIGINT,                    -- FK -> users.id (group creator)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
     */

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Enumerated(EnumType.STRING)
    private ConversationTypeEnum type;

    @Null
    private String name;

    private String groupIconUrl;

    @ManyToOne
    @JoinColumn(name = "created_by", nullable = false)
    private UserEntity createdBy;

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

