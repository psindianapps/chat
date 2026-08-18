package com.example.chat.respository;

import com.example.chat.entity.MessageStatusEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageStatusRepo extends JpaRepository<MessageStatusEntity,Long> {
}
