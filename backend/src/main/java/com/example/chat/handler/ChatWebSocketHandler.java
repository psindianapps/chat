package com.example.chat.handler;

import com.example.chat.dto.request.ChatMessageRequest;
import com.example.chat.dto.response.ApiResponse;
import com.example.chat.entity.ConversationEntity;
import com.example.chat.entity.MessageEntity;
import com.example.chat.entity.MessageStatusEntity;
import com.example.chat.entity.UserEntity;
import com.example.chat.enums.MessageStatusEnum;
import com.example.chat.projection.LastMessageProjection;
import com.example.chat.respository.MessageStatusRepo;
import com.example.chat.respository.MessagesRepo;
import com.example.chat.respository.UserRepo;
import com.example.chat.service.ChatService;
import com.example.chat.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.CloseStatus;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler implements WebSocketHandler {

    @Autowired
    public JwtUtils jwtUtils;
    
    @Autowired
    private ChatService chatService;

    @Autowired
    private MessagesRepo messageRepo;

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private MessageStatusRepo messageStatusRepo;

    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(WebSocketSession session) {

        String query = session.getHandshakeInfo().getUri().getQuery();
        String token = extractToken(query);

        String id = String.valueOf(jwtUtils.extractUserId(token));
        String username = jwtUtils.extractUsername(token);
        if (id == null) {
            return session.close(CloseStatus.POLICY_VIOLATION);
        }

        sessions.put(id, session);
        activeInactiveUser(Long.valueOf(id));
        deliverPendingMessages(Long.valueOf(id), session);
        System.out.println("✅ CONNECTED: " + id + " : " + username  +" | total online: " + sessions.size());

        return session.receive()
                .map(WebSocketMessage::getPayloadAsText)
                .doOnNext(payload -> routeMessage(id, payload))
                .doFinally(signal -> {
                    sessions.remove(id);
                    activeInactiveUser(Long.valueOf(id));
                    System.out.println("🔴 DISCONNECTED: " + username);
                })
                .then();
    }

    private void routeMessage(String senderUsername, String payload) {
        try {
            ChatMessageRequest msg = objectMapper.readValue(payload, ChatMessageRequest.class);
            msg.setSender(Long.valueOf(senderUsername));

            ApiResponse<Object> objectApiResponse = chatService.sendMessage(msg);

            if (!objectApiResponse.isSuccess()) {
                System.err.println("❌ Failed to persist message: " + objectApiResponse.getMessage());
                return;
            }

            ConversationEntity conversation = (ConversationEntity) objectApiResponse.getData();
            msg.setConversationId(conversation.getId());

            String outgoing = objectMapper.writeValueAsString(msg);

            WebSocketSession receiverSession = sessions.get(String.valueOf(msg.getReceiver()));
            if (receiverSession != null && receiverSession.isOpen()) {
                receiverSession.send(Mono.just(receiverSession.textMessage(outgoing))).subscribe();
            } else {
                System.out.println("⚠️ Receiver offline, message saved for later delivery: " + msg.getReceiver());
            }

            WebSocketSession senderSession = sessions.get(senderUsername);
            if (senderSession != null && senderSession.isOpen()) {
                senderSession.send(Mono.just(senderSession.textMessage(outgoing))).subscribe();
            }

        } catch (Exception e) {
            System.err.println("❌ Failed to route message: " + e.getMessage());
        }
    }

    private String extractToken(String query) {
        if (query == null) return null;
        for (String param : query.split("&")) {
            String[] pair = param.split("=", 2);
            if (pair.length == 2 && pair[0].equals("token")) {
                return pair[1];
            }
        }
        return null;
    }

    private void deliverPendingMessages(Long userId, WebSocketSession session) {
        List<MessageEntity> pendingMessages = messageRepo.findUndeliveredMessages(userId);

        for (MessageEntity msg : pendingMessages) {
            try {
                ChatMessageRequest outgoingMsg = new ChatMessageRequest();
                outgoingMsg.setId(msg.getId());
                outgoingMsg.setConversationId(msg.getConversationId());
                outgoingMsg.setSender(msg.getSenderId());
                outgoingMsg.setReceiver(userId);
                outgoingMsg.setMessage(msg.getContent());
                outgoingMsg.setMessageType(msg.getMessageType().name());
                outgoingMsg.setStatus(MessageStatusEnum.DELIVERED.name());
                outgoingMsg.setCreatedAt(msg.getCreatedAt());

                String payload = objectMapper.writeValueAsString(outgoingMsg);
                session.send(Mono.just(session.textMessage(payload))).subscribe();

                MessageStatusEntity statusEntity = new MessageStatusEntity();
                statusEntity.setMessageId(msg.getId());
                statusEntity.setUserId(userId);
                statusEntity.setStatus(MessageStatusEnum.DELIVERED);
                messageStatusRepo.save(statusEntity);

            } catch (Exception e) {
                System.err.println("❌ Failed to deliver pending message: " + e.getMessage());
            }
        }
    }

    private void activeInactiveUser(Long id){
        UserEntity user = userRepo.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        user.setOnline(!user.isOnline());
        userRepo.save(user);
    }
}