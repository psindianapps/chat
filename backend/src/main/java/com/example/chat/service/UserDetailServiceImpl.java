package com.example.chat.service;

import com.example.chat.entity.UserEntity;
import com.example.chat.filter.CustomUserDetails;
import com.example.chat.respository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class UserDetailServiceImpl implements UserDetailsService {
    @Autowired
    private UserRepo userRepo;

    /*
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<UserEntity> userEntity = userRepo.findByUsername(username);
        if (userEntity.isPresent()) {
            return User.builder()
                    .username(userEntity.get().getUsername())
                    .password(userEntity.get().getPassword())
                    .build();
        }
        throw new UsernameNotFoundException(username);
    }
    */

    @Override
    public UserDetails loadUserByUsername(String username) {
        UserEntity user = userRepo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new CustomUserDetails(user);
    }

}
