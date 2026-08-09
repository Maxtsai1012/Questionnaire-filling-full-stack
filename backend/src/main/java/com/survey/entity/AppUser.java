package com.survey.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "app_user")
@Getter @Setter @NoArgsConstructor
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false, length = 100) private String name;
    @Column(nullable = false, unique = true, length = 255) private String email;
    @Column(nullable = false, length = 20) private String phone;
    @Column(nullable = false) private LocalDate birthday;
    @Column(name = "password_hash", nullable = false, length = 255) private String passwordHash;
    @Column(nullable = false, length = 20) private String role = "MEMBER";
    @Column(name = "token_version", nullable = false) private Integer tokenVersion = 0;

    @PrePersist
    void initializeTokenVersion() {
        if (tokenVersion == null) tokenVersion = 0;
    }
}
