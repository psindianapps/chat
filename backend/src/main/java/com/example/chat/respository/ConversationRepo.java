package com.example.chat.respository;

import com.example.chat.entity.ConversationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConversationRepo extends JpaRepository<ConversationEntity,Long> {

    @Query(value = """
    SELECT c.* FROM conversations c
    JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
    JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
    WHERE c.type = 'INDIVIDUAL'
        AND cp1.user_id = :userId1
        AND cp2.user_id = :userId2
    LIMIT 1
    """, nativeQuery = true)
    Optional<ConversationEntity> findIndividualConversationBetween(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2
    );


        @Query(value = """
        SELECT 
            c.id AS conversation_id, c.type, c.name AS group_name, c.group_icon_url,
            ou.id AS other_user_id, ou.username AS other_username, 
            ou.display_name AS other_display_name, ou.profile_pic_url AS other_profile_pic,
            ou.is_online AS other_is_online,
            lm.id AS last_message_id, lm.content AS last_message, lm.message_type AS last_message_type,
            lm.created_at AS last_message_time, lm.sender_id AS last_message_sender_id,
            (
                SELECT COUNT(*) FROM messages m2
                WHERE m2.conversation_id = c.id
                    AND m2.sender_id != :currentUserId
                    AND m2.is_deleted = false
                    AND NOT EXISTS (
                        SELECT 1 FROM message_status ms 
                        WHERE ms.message_id = m2.id AND ms.user_id = :currentUserId AND ms.status = 'READ'
                    )
            ) AS unread_count
        FROM conversations c
        JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = :currentUserId
        LEFT JOIN conversation_participants ocp 
            ON ocp.conversation_id = c.id AND ocp.user_id != :currentUserId AND c.type = 'INDIVIDUAL'
        LEFT JOIN users ou ON ou.id = ocp.user_id
        LEFT JOIN messages lm ON lm.id = (
            SELECT m.id FROM messages m 
            WHERE m.conversation_id = c.id AND m.is_deleted = false
            ORDER BY m.created_at DESC LIMIT 1
        )
        WHERE cp.user_id = :currentUserId
        ORDER BY lm.created_at DESC
        """, nativeQuery = true)
        List<Object[]> findConversationsWithDetails(@Param("currentUserId") Long currentUserId);

}
