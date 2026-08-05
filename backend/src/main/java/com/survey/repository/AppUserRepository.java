package com.survey.repository;

import com.survey.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Integer> {
    Optional<AppUser> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update AppUser user set user.tokenVersion = user.tokenVersion + 1 where user.id = :userId")
    int incrementTokenVersion(@Param("userId") Integer userId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update AppUser user set user.passwordHash = :newHash " +
            "where user.id = :userId and user.passwordHash = :oldHash")
    int upgradePasswordHash(@Param("userId") Integer userId,
                            @Param("oldHash") String oldHash,
                            @Param("newHash") String newHash);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update AppUser user set user.passwordHash = :newHash, " +
            "user.tokenVersion = user.tokenVersion + 1 where user.id = :userId")
    int changePasswordAndIncrementTokenVersion(@Param("userId") Integer userId,
                                               @Param("newHash") String newHash);
}
