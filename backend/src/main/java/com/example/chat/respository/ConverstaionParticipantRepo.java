package com.example.chat.respository;

import com.example.chat.entity.ConversationParticipantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConverstaionParticipantRepo extends JpaRepository<ConversationParticipantEntity,Long> {
    @Query(value = """
        SELECT COUNT(*) 
        FROM conversation_participants 
        WHERE conversation_id = :conversationId AND user_id = :userId
        """, nativeQuery = true)
    Long countByConversationIdAndUserId(
            @Param("conversationId") Long conversationId,
            @Param("userId") Long userId
    );

}
