package com.example.chat.service;

import com.example.chat.dto.response.LoginResponseDTO;
import com.example.chat.entity.UserEntity;
import com.example.chat.respository.UserRepo;
import com.example.chat.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired
    private UserRepo userRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    public LoginResponseDTO login(String username, String password) {
        if(username.isEmpty() || password.isEmpty()) {
            throw new UsernameNotFoundException("Invalid username or password");
        }
        if(userRepo.findByUsername(username).isEmpty()) {
            throw new UsernameNotFoundException("Invalid username or password");
        }
        UserEntity userEntity =  userRepo.findByUsername(username).get();

        if(!passwordEncoder.matches(password,userEntity.getPassword())) {
            throw new UsernameNotFoundException("Invalid username or password");
        }
        String token = jwtUtils.generateToken(userEntity.getUsername());
        return new LoginResponseDTO(
                userEntity.getUsername(),
                userEntity.getEmail(),
                userEntity.getStatus(),
                token
        );
    }
}
