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

    /**
     * Email 一律以小寫存入（見 ResponseSubmitDto.setEmail 與 migration V2），
     * 因此 uk_quiz_email 這個唯一鍵本身就足以擋重複，不再倚賴 collation 是否分大小寫。
     */
    public void ensureNotDuplicate(Integer quizId, String email) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        if (responseRepository.existsByQuizIdAndEmail(quizId, normalizedEmail)) {
            throw new IllegalArgumentException("同一份 Email 不得重複填寫問卷！");
        }
    }

    public void applyIdentity(QuizResponse response, Integer userId) {
        response.setUserId(userId);
    }
}
