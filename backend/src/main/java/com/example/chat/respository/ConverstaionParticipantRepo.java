package com.example.chat.respository;

import com.example.chat.entity.ConversationParticipantEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConverstaionParticipantRepo extends JpaRepository<ConversationParticipantEntity,Long> {
    boolean existsByConversationIdAndUserId(Long conversationId, Long userId);
}
