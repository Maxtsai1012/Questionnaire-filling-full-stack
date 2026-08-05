package com.survey.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.survey.common.ResourceNotFoundException;
import com.survey.dto.QuizListDto;
import com.survey.dto.QuizSaveRequestDto;
import com.survey.entity.AppUser;
import com.survey.entity.Quiz;
import com.survey.entity.QuizResponse;
import com.survey.repository.QuizQuestionRepository;
import com.survey.repository.QuizRepository;
import com.survey.repository.QuizResponseRepository;
import com.survey.repository.ResponseAnswerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class QuestionnaireOwnershipServiceTest {
    private QuizRepository quizRepository;
    private QuizQuestionRepository questionRepository;
    private QuizResponseRepository responseRepository;
    private ResponseAnswerRepository answerRepository;
    private AdminQuizService service;
    private AppUser memberA;
    private AppUser memberB;
    private AppUser admin;

    @BeforeEach void setUp() {
        quizRepository = mock(QuizRepository.class);
        questionRepository = mock(QuizQuestionRepository.class);
        responseRepository = mock(QuizResponseRepository.class);
        answerRepository = mock(ResponseAnswerRepository.class);
        service = new AdminQuizService(quizRepository, questionRepository,
                responseRepository, answerRepository, new ObjectMapper());
        memberA = user(1, "MEMBER");
        memberB = user(2, "MEMBER");
        admin = user(3, "ADMIN");
        when(quizRepository.save(any(Quiz.class))).thenAnswer(invocation -> {
            Quiz quiz = invocation.getArgument(0);
            if (quiz.getId() == null) quiz.setId(100);
            return quiz;
        });
    }

    @Test void memberCreationBindsAuthenticatedPrincipalAsOwner() {
        Integer id = service.saveOrUpdateQuiz(request(null), memberA, false);

        assertEquals(100, id);
        verify(quizRepository).save(argThat(quiz -> quiz.getOwner() == memberA));
    }

    @Test void adminCreationAlsoUsesAuthenticatedAdminAsOwner() {
        service.saveOrUpdateQuiz(request(null), admin, true);
        verify(quizRepository).save(argThat(quiz -> quiz.getOwner() == admin));
    }

    @Test void requestDtoHasNoOwnerOrUserIdentityField() {
        List<String> fields = java.util.Arrays.stream(QuizSaveRequestDto.class.getDeclaredFields())
                .map(java.lang.reflect.Field::getName).toList();
        assertFalse(fields.contains("ownerId"));
        assertFalse(fields.contains("userId"));
        assertFalse(fields.contains("createdBy"));
        assertFalse(fields.contains("role"));
    }

    @Test void memberCanUpdateOwnQuizWithoutChangingOwner() {
        Quiz own = quiz(10, memberA);
        when(quizRepository.findById(10)).thenReturn(Optional.of(own));

        service.saveOrUpdateQuiz(request(10), memberA, false);

        assertSame(memberA, own.getOwner());
        verify(quizRepository).save(own);
    }

    @Test void memberCannotUpdateAnotherMembersOrLegacyQuiz() {
        when(quizRepository.findById(20)).thenReturn(Optional.of(quiz(20, memberB)));
        when(quizRepository.findById(30)).thenReturn(Optional.of(quiz(30, null)));

        assertThrows(SecurityException.class, () -> service.saveOrUpdateQuiz(request(20), memberA, false));
        assertThrows(SecurityException.class, () -> service.saveOrUpdateQuiz(request(30), memberA, false));
        verify(quizRepository, never()).save(argThat(q -> q.getId() != null && (q.getId() == 20 || q.getId() == 30)));
    }

    @Test void adminCanUpdateMemberAndLegacyQuiz() {
        Quiz memberQuiz = quiz(20, memberB);
        Quiz legacy = quiz(30, null);
        when(quizRepository.findById(20)).thenReturn(Optional.of(memberQuiz));
        when(quizRepository.findById(30)).thenReturn(Optional.of(legacy));

        assertDoesNotThrow(() -> service.saveOrUpdateQuiz(request(20), admin, true));
        assertDoesNotThrow(() -> service.saveOrUpdateQuiz(request(30), admin, true));
        assertSame(memberB, memberQuiz.getOwner());
        assertNull(legacy.getOwner());
    }

    @Test void missingQuizReturnsNotFoundInsteadOfForbidden() {
        when(quizRepository.findById(404)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> service.saveOrUpdateQuiz(request(404), memberA, false));
    }

    @Test void memberDeleteEnforcesSameOwnershipRule() {
        Quiz own = quiz(10, memberA);
        when(quizRepository.findById(10)).thenReturn(Optional.of(own));
        when(quizRepository.findById(20)).thenReturn(Optional.of(quiz(20, memberB)));
        when(quizRepository.findById(30)).thenReturn(Optional.of(quiz(30, null)));

        service.deleteQuizzes(List.of(10), memberA.getId(), false);
        assertThrows(SecurityException.class, () -> service.deleteQuizzes(List.of(20), memberA.getId(), false));
        assertThrows(SecurityException.class, () -> service.deleteQuizzes(List.of(30), memberA.getId(), false));
        verify(quizRepository).delete(own);
    }

    @Test void memberListUsesPrincipalOwnerFilterAndExcludesLegacy() {
        Quiz own = quiz(10, memberA);
        when(quizRepository.searchOwnedQuizzes(eq(memberA.getId()), isNull(), isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(own)));

        List<QuizListDto> result = service.getOwnedQuizzes(memberA.getId(), null, null, null, 0, 10).getContent();

        assertEquals(List.of(10), result.stream().map(QuizListDto::getId).toList());
        assertEquals(memberA.getId(), result.get(0).getOwnerId());
        verify(quizRepository).searchOwnedQuizzes(eq(memberA.getId()), isNull(), isNull(), isNull(), any(Pageable.class));
    }

    @Test void questionFailurePropagatesSoTransactionCanRollback() {
        doThrow(new IllegalStateException("question failure")).when(questionRepository).deleteByQuizId(100);
        assertThrows(IllegalStateException.class,
                () -> service.saveOrUpdateQuiz(request(null), memberA, false));
    }

    @Test void memberCanListOnlyResponsesForOwnedQuiz() {
        when(quizRepository.findById(10)).thenReturn(Optional.of(quiz(10, memberA)));
        when(quizRepository.findById(20)).thenReturn(Optional.of(quiz(20, memberB)));
        when(responseRepository.findByQuizIdOrderByIdDesc(eq(10), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        assertDoesNotThrow(() -> service.getQuizResponses(10, 0, 10, memberA.getId(), false));
        assertThrows(SecurityException.class,
                () -> service.getQuizResponses(20, 0, 10, memberA.getId(), false));
        verify(responseRepository, never()).findByQuizIdOrderByIdDesc(eq(20), any(Pageable.class));
    }

    @Test void memberCannotOpenAnotherMembersResponseDetailButAdminCan() {
        QuizResponse response = new QuizResponse();
        response.setId(50);
        response.setQuizId(20);
        when(responseRepository.findById(50)).thenReturn(Optional.of(response));
        when(quizRepository.findById(20)).thenReturn(Optional.of(quiz(20, memberB)));
        when(questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(20)).thenReturn(List.of());
        when(answerRepository.findByResponseId(50)).thenReturn(List.of());

        assertThrows(SecurityException.class,
                () -> service.getResponseDetail(50, memberA.getId(), false));
        assertDoesNotThrow(() -> service.getResponseDetail(50, admin.getId(), true));
    }

    private AppUser user(int id, String role) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setName(role + " User");
        user.setRole(role);
        return user;
    }

    private Quiz quiz(int id, AppUser owner) {
        Quiz quiz = new Quiz();
        quiz.setId(id);
        quiz.setOwner(owner);
        quiz.setName("Quiz " + id);
        quiz.setDescription("Description");
        quiz.setStartDate(LocalDate.now().plusDays(2));
        quiz.setEndDate(LocalDate.now().plusDays(3));
        quiz.setIsPublished(false);
        return quiz;
    }

    private QuizSaveRequestDto request(Integer id) {
        QuizSaveRequestDto request = new QuizSaveRequestDto();
        request.setId(id);
        request.setName("Owned Quiz");
        request.setDescription("Description");
        request.setStartDate(LocalDate.now().plusDays(2));
        request.setEndDate(LocalDate.now().plusDays(3));
        request.setIsPublished(false);
        request.setQuestions(List.of());
        return request;
    }
}
