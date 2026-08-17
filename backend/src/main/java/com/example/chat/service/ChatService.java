package com.example.chat.service;

import com.example.chat.dto.response.LoginResponseDTO;
import com.example.chat.entity.UserEntity;
import com.example.chat.filter.CustomUserDetails;
import com.example.chat.respository.UserRepo;
import com.example.chat.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private JwtUtils jwtUtils;

    public List<LoginResponseDTO> getAllUsers(Long currentUserId) {

        List<UserEntity> users = userRepo.findAllUser(currentUserId);

        return users.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
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

}
