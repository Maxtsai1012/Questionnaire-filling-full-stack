package com.survey.security;

import com.survey.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
    private final AppUserRepository repository;

    @Override
    public UserDetails loadUserByUsername(String email) {
        return UserPrincipal.from(repository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("找不到使用者")));
    }

    public UserPrincipal loadUserById(Integer id) {
        return UserPrincipal.from(repository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("找不到使用者")));
    }
}
