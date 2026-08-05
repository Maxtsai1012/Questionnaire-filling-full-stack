package com.survey.service;

import com.survey.entity.QuizResponse;
import com.survey.repository.QuizResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SubmissionEligibilityService {
    private final QuizResponseRepository responseRepository;

    public String normalizeName(String name) {
        return name == null ? "" : name.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    public String normalizePhone(String phone) {
        return phone == null ? "" : phone.replaceAll("[\\s-]", "");
    }

    public void ensureNotDuplicate(Integer quizId, String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (responseRepository.existsByQuizIdAndEmailIgnoreCase(quizId, normalizedEmail)) {
            throw new IllegalArgumentException("同一份 Email 不得重複填寫問卷！");
        }
    }

    public void applyIdentity(QuizResponse response, Integer userId, String name, String phone) {
        response.setUserId(userId);
        response.setNormalizedName(userId == null ? normalizeName(name) : null);
        response.setNormalizedPhone(userId == null ? normalizePhone(phone) : null);
    }
}
