package com.survey.service;

import com.survey.repository.QuizResponseRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SubmissionEligibilityServiceTest {
    private final QuizResponseRepository repository = mock(QuizResponseRepository.class);
    private final SubmissionEligibilityService service = new SubmissionEligibilityService(repository);

    @Test
    void rejectsDuplicateEmailForSameQuiz() {
        when(repository.existsByQuizIdAndEmail(7, "same@example.com")).thenReturn(true);
        assertThrows(IllegalArgumentException.class,
                () -> service.ensureNotDuplicate(7, " Same@Example.com "));
    }

    @Test
    void allowsSameEmailForDifferentQuiz() {
        when(repository.existsByQuizIdAndEmail(8, "same@example.com")).thenReturn(false);
        assertDoesNotThrow(() -> service.ensureNotDuplicate(8, "same@example.com"));
    }
}
