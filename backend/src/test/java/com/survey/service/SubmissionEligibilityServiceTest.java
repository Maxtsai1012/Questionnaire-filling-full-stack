package com.survey.service;

import com.survey.repository.QuizResponseRepository;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SubmissionEligibilityServiceTest {
    private final QuizResponseRepository repository = mock(QuizResponseRepository.class);
    private final SubmissionEligibilityService service = new SubmissionEligibilityService(repository);

    @Test
    void normalizesGuestIdentity() {
        assertEquals("john wang", service.normalizeName("  John   Wang "));
        assertEquals("0912345678", service.normalizePhone("0912-345 678"));
    }

    @Test
    void rejectsDuplicateEmailForSameQuiz() {
        when(repository.existsByQuizIdAndEmailIgnoreCase(7, "same@example.com")).thenReturn(true);
        assertThrows(IllegalArgumentException.class,
                () -> service.ensureNotDuplicate(7, " Same@Example.com "));
    }

    @Test
    void allowsSameEmailForDifferentQuiz() {
        when(repository.existsByQuizIdAndEmailIgnoreCase(8, "same@example.com")).thenReturn(false);
        assertDoesNotThrow(() -> service.ensureNotDuplicate(8, "same@example.com"));
    }
}
