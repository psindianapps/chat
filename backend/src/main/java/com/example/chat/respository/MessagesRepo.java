package com.example.chat.respository;

import com.example.chat.entity.MessageEntity;
import com.example.chat.projection.LastMessageProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessagesRepo extends JpaRepository<MessageEntity,Long> {
    @Query(value = """
        SELECT m.* 
        FROM messages m
        JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
        WHERE cp.user_id = :userId
            AND m.sender_id != :userId
            AND m.is_deleted = false
            AND NOT EXISTS (
                SELECT 1 FROM message_status ms 
                WHERE ms.message_id = m.id AND ms.user_id = :userId
            )
        ORDER BY m.created_at ASC
        """, nativeQuery = true)
    List<MessageEntity> findUndeliveredMessages(@Param("userId") Long userId);


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


    @Query(value = """
        SELECT 
            m.id, m.conversation_id, m.sender_id, 
            u.username AS sender_username, u.display_name AS sender_display_name,
            m.message_type, m.content, m.media_id,
            mf.file_url, mf.thumbnail_url, mf.file_type, mf.duration_seconds,
            m.reply_to_message_id, m.status, m.created_at
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        LEFT JOIN media_files mf ON mf.id = m.media_id
        WHERE m.conversation_id = :conversationId
            AND m.is_deleted = false
        ORDER BY m.created_at ASC 
        """,
            countQuery = """
        SELECT COUNT(*) FROM messages m 
        WHERE m.conversation_id = :conversationId AND m.is_deleted = false
        """,
            nativeQuery = true)
    Page<Object[]> findMessagesByConversation(
            @Param("conversationId") Long conversationId,
            Pageable pageable
    );

    Page<MessageEntity> findByConversationId(Long conversationId, Pageable pageable);


    @Query(value = """
    SELECT
        messages.content,
        receiver.is_online,
        receiver.profile_pic_url,
        messages.message_type,
        messages.created_at,
        messages.sender_id
    FROM messages
    JOIN users AS receiver
        ON receiver.id = :receiverId
    WHERE messages.conversation_id = :conversationId
      AND messages.message_type = 'TEXT'
    ORDER BY messages.id DESC
    LIMIT 1
    """, nativeQuery = true)
    LastMessageProjection findLastMessageOfConversataion(
            @Param("conversationId") Long conversationId,
            @Param("receiverId") Long receiverId
    );

}
