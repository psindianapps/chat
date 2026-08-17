package com.example.chat.utils;

import com.example.chat.entity.UserEntity;
import com.example.chat.respository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class CommonUtils {

    @Autowired
    public UserRepo userRepo;
    public UserEntity getUserByUsername(String username) {
        Optional<UserEntity> user = userRepo.findByUsername(username);
        return user.orElse(null);
    }

}
