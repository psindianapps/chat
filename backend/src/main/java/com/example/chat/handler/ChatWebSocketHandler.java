package com.example.chat.handler;

import com.example.chat.dto.request.ChatMessageRequest;
import com.example.chat.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.socket.CloseStatus;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.WebSocketMessage;
import org.springframework.web.reactive.socket.WebSocketSession;
import reactor.core.publisher.Mono;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ChatWebSocketHandler implements WebSocketHandler {

    @Autowired
    public JwtUtils jwtUtils;


    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Mono<Void> handle(WebSocketSession session) {

        String query = session.getHandshakeInfo().getUri().getQuery();
        String token = extractToken(query);

        String username = jwtUtils.extractUsername(token); // apna existing util use karo
        if (username == null) {
            return session.close(CloseStatus.POLICY_VIOLATION);
        }

        sessions.put(username, session);
        System.out.println("✅ CONNECTED: " + username + " | total online: " + sessions.size());

        return session.receive()
                .map(WebSocketMessage::getPayloadAsText)
                .doOnNext(payload -> routeMessage(username, payload))
                .doFinally(signal -> {
                    sessions.remove(username);
                    System.out.println("🔴 DISCONNECTED: " + username);
                })
                .then();
    }

    private void routeMessage(String senderUsername, String payload) {
        try {
            ChatMessageRequest msg = objectMapper.readValue(payload, ChatMessageRequest.class);

            // sender ko hamesha server-side se set karo, client ki value trust mat karo
            msg.setSender(senderUsername);

            WebSocketSession receiverSession = sessions.get(msg.getReceiver());

            if (receiverSession != null && receiverSession.isOpen()) {
                String outgoing = objectMapper.writeValueAsString(msg);
                receiverSession.send(Mono.just(receiverSession.textMessage(outgoing)))
                        .subscribe();
            } else {
                System.out.println("⚠️ Receiver offline: " + msg.getReceiver());
                // yahan DB mein message save kar do taaki receiver login karte hi mil jaaye
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
}