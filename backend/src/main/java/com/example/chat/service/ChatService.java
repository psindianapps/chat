package com.example.chat.service;

import com.example.chat.config.Constants;
import com.example.chat.dto.request.ChatMessageRequest;
import com.example.chat.dto.response.ApiResponse;
import com.example.chat.dto.response.ConversationListDTO;
import com.example.chat.dto.response.LoginResponseDTO;
import com.example.chat.dto.response.MessageDTO;
import com.example.chat.entity.*;
import com.example.chat.enums.ConversationRoleEnum;
import com.example.chat.enums.ConversationTypeEnum;
import com.example.chat.enums.MessageStatusEnum;
import com.example.chat.enums.MessageTypeEnum;
import com.example.chat.respository.*;
import com.example.chat.specification.UserSpecification;
import com.example.chat.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private Constants constants;

    @Autowired
    private ConversationRepo conversationRepo;

    @Autowired
    private ConverstaionParticipantRepo  converstaionParticipantRepo;

    @Autowired
    private MessagesRepo messagesRepo;

    @Autowired
    private MessageStatusRepo messageStatusRepo;

    public Page<LoginResponseDTO> getAllUsers(String search, Long currentUserId, int pageNumber) {

        Specification<UserEntity> specification = UserSpecification.searchUsers(search, currentUserId);


        Pageable pageable = PageRequest.of(
                                pageNumber,
                                Integer.parseInt(constants.getPageSize()),
                                Sort.by(Sort.Direction.DESC, "id")
                            );

        Page<UserEntity> users = userRepo.findAll(specification,pageable);

        return users.map(this::mapToDTO);
    }



    private LoginResponseDTO mapToDTO(UserEntity user) {
        // apna mapping logic
        return new LoginResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getDisplayName(),
                user.getProfilePicUrl(),
                user.getStatusMessage(),
                user.getLastSeen(),
                user.isOnline(),
                ""
        );
    }


    public ApiResponse<Object> sendMessage(ChatMessageRequest request) throws Exception {
        try {
            UserEntity sender = userRepo.findById(
                    request.getSender()
            ).orElseThrow(() -> new RuntimeException("Sender not found"));

            UserEntity receiver = userRepo.findById(
                    request.getReceiver()
            ).orElseThrow(() -> new RuntimeException("Receiver not found"));
            ConversationEntity conversation;
            if(request.getConversationId() == null){
                conversation = conversationRepo.findIndividualConversationBetween(sender.getId(), receiver.getId())
                        .orElse(null);

                if (conversation == null) {
                    conversation = new ConversationEntity();
                    conversation.setType(ConversationTypeEnum.INDIVIDUAL);
                    conversation.setCreatedBy(sender);
                    conversation = conversationRepo.save(conversation);

                    ConversationParticipantEntity senderCpe = new ConversationParticipantEntity();
                    senderCpe.setConversationId(conversation);
                    senderCpe.setUserId(sender);
                    senderCpe.setRole(ConversationRoleEnum.MEMBER);
                    converstaionParticipantRepo.save(senderCpe);

                    ConversationParticipantEntity receiverCpe = new ConversationParticipantEntity();
                    receiverCpe.setConversationId(conversation);
                    receiverCpe.setUserId(receiver);
                    receiverCpe.setRole(ConversationRoleEnum.MEMBER);
                    converstaionParticipantRepo.save(receiverCpe);
                }
            } else {
                conversation = conversationRepo.findById(request.getConversationId()).orElseThrow(() ->
                        new RuntimeException(
                                "Conversation not found"
                        )
                );;
            }


            // 3. Message insert karo
            MessageEntity messageEntity = new MessageEntity();
            messageEntity.setConversationId(conversation.getId());
            messageEntity.setSenderId(sender.getId());
            messageEntity.setMessageType(MessageTypeEnum.TEXT);
            messageEntity.setContent(request.getMessage());
            messageEntity.setStatus(MessageStatusEnum.SENT);
            messagesRepo.save(messageEntity);

            return new ApiResponse<>(true, 200, "Message sent", conversation);

        } catch (Exception e) {
            throw new Exception("error " + e.getMessage());
        }
    }

    public Mono<List<ConversationListDTO>> getConversations(Long currentUserId) {

        return Mono.fromCallable(() -> {
                    List<Object[]> rows = conversationRepo.findConversationsWithDetails(currentUserId);
                    return rows.stream()
                            .map(this::mapToConversationListDTO)
                            .collect(Collectors.toList());
                })
                .subscribeOn(Schedulers.boundedElastic());
    }

    private ConversationListDTO mapToConversationListDTO(Object[] row) {
        ConversationListDTO dto = new ConversationListDTO();
        dto.setConversationId(((Number) row[0]).longValue());
        dto.setType((String) row[1]);
        dto.setGroupName((String) row[2]);
        dto.setGroupIconUrl((String) row[3]);
        dto.setReceiverUserId(row[4] != null ? ((Number) row[4]).longValue() : null);
        dto.setReceiverUsername((String) row[5]);
        dto.setReceiverDisplayName((String) row[6]);
        dto.setReceiverProfilePic((String) row[7]);
        dto.setReceiverIsOnline(row[8] != null && (Boolean) row[8]);
        dto.setLastMessage((String) row[10]);
        dto.setLastMessageType((String) row[11]);
        dto.setLastMessageSenderId(row[13] != null ? ((Number) row[13]).longValue() : null);
        dto.setUnreadCount(((Number) row[14]).longValue());
        return dto;
    }


    public Mono<ApiResponse<Page<MessageDTO>>> getMessages(
            Long conversationId, Long currentUserId, int page) {

        return Mono.fromCallable(() -> {

                    // Security check — user isi conversation ka participant hai kya
                    Long count = converstaionParticipantRepo.countByConversationIdAndUserId(conversationId, currentUserId);
                    boolean isParticipant = count != null && count > 0;

                    if (!isParticipant) {
                        return new ApiResponse<Page<MessageDTO>>(
                                false, 403, "You are not part of this conversation", null
                        );
                    }
                    int size = Integer.parseInt(constants.getPageSize());
                    Pageable pageable = PageRequest.of(page, size);
                    Page<Object[]> rows = messagesRepo.findMessagesByConversation(conversationId, pageable);

                    Page<MessageDTO> dtoPage = rows.map(this::mapToMessageDTO);

                    return new ApiResponse<>(true, 200, "Messages fetched", dtoPage);
                })
                .subscribeOn(Schedulers.boundedElastic());
    }

    private MessageDTO mapToMessageDTO(Object[] row) {
        MessageDTO dto = new MessageDTO();
        dto.setId(((Number) row[0]).longValue());
        dto.setConversationId(((Number) row[1]).longValue());
        dto.setSenderId(((Number) row[2]).longValue());
        dto.setSenderUsername((String) row[3]);
        dto.setSenderDisplayName((String) row[4]);
        dto.setMessageType((String) row[5]);
        dto.setContent((String) row[6]);
        dto.setMediaId(row[7] != null ? ((Number) row[7]).longValue() : null);
        dto.setFileUrl((String) row[8]);
        dto.setThumbnailUrl((String) row[9]);
        dto.setFileType((String) row[10]);
        dto.setDurationSeconds(row[11] != null ? ((Number) row[11]).intValue() : null);
        dto.setReplyToMessageId(row[12] != null ? ((Number) row[12]).longValue() : null);
        dto.setStatus((String) row[13]);
        // createdAt (row[14]) — DB driver ke return type ke hisaab se cast karna, error aaye toh bata dena
        return dto;
    }

}
