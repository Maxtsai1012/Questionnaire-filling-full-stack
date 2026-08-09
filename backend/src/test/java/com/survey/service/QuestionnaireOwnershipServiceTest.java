package com.survey.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.survey.common.ResourceNotFoundException;
import com.survey.dto.QuestionSaveDto;
import com.survey.dto.QuizListDto;
import com.survey.dto.QuizSaveRequestDto;
import com.survey.entity.AppUser;
import com.survey.entity.Quiz;
import com.survey.entity.QuizQuestion;
import com.survey.entity.QuizResponse;
import com.survey.repository.QuizOptionRepository;
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
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class QuestionnaireOwnershipServiceTest {
    private QuizRepository quizRepository;
    private QuizQuestionRepository questionRepository;
    private QuizResponseRepository responseRepository;
    private ResponseAnswerRepository answerRepository;
    private QuizOptionRepository optionRepository;
    private QuizManagementService service;
    private QuizResponseService responseService;
    private AppUser memberA;
    private AppUser memberB;
    private AppUser admin;

    @BeforeEach void setUp() {
        quizRepository = mock(QuizRepository.class);
        questionRepository = mock(QuizQuestionRepository.class);
        responseRepository = mock(QuizResponseRepository.class);
        answerRepository = mock(ResponseAnswerRepository.class);
        optionRepository = mock(QuizOptionRepository.class);
        service = new QuizManagementService(quizRepository, questionRepository, optionRepository, responseRepository);
        responseService = new QuizResponseService(quizRepository, questionRepository, optionRepository,
                responseRepository, answerRepository, service,
                new SubmissionEligibilityService(responseRepository));
        memberA = user(1, "MEMBER");
        memberB = user(2, "MEMBER");
        admin = user(3, "ADMIN");
        when(quizRepository.save(any(Quiz.class))).thenAnswer(invocation -> {
            Quiz quiz = invocation.getArgument(0);
            if (quiz.getId() == null) quiz.setId(100);
            return quiz;
        });
        AtomicInteger nextQuestionId = new AtomicInteger(200);
        when(questionRepository.save(any(QuizQuestion.class))).thenAnswer(invocation -> {
            QuizQuestion question = invocation.getArgument(0);
            if (question.getId() == null) question.setId(nextQuestionId.getAndIncrement());
            return question;
        });
    }

    @Test void memberCreationBindsAuthenticatedPrincipalAsOwner() {
        Integer id = service.saveOrUpdateQuiz(request(null), memberA, false);

        assertEquals(100, id);
        verify(quizRepository).save(argThat(quiz -> quiz.getOwner() == memberA));
    }

    @Test void memberCannotPublishOwnQuiz() {
        QuizSaveRequestDto request = request(null);
        request.setIsPublished(true);

        assertThrows(SecurityException.class,
                () -> service.saveOrUpdateQuiz(request, memberA, false));
        verify(quizRepository, never()).save(any());
    }

    @Test void memberUpdatePreservesExistingAdminPublication() {
        Quiz published = quiz(10, memberA);
        published.setIsPublished(true);
        when(quizRepository.findById(10)).thenReturn(Optional.of(published));
        QuizSaveRequestDto update = request(10);
        update.setQuestions(List.of(question("Keep one question")));

        service.saveOrUpdateQuiz(update, memberA, false);

        assertTrue(published.getIsPublished());
        verify(quizRepository).save(published);
    }

    @Test void memberCannotRemoveAllQuestionsFromPublishedQuiz() {
        Quiz published = quiz(10, memberA);
        published.setIsPublished(true);
        when(quizRepository.findById(10)).thenReturn(Optional.of(published));

        assertThrows(IllegalArgumentException.class,
                () -> service.saveOrUpdateQuiz(request(10), memberA, false));
        verify(quizRepository, never()).save(any());
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

    @Test void adminCanPublishMemberQuiz() {
        Quiz memberQuiz = quiz(20, memberB);
        when(quizRepository.findById(20)).thenReturn(Optional.of(memberQuiz));
        QuizSaveRequestDto request = request(20);
        request.setIsPublished(true);
        request.setQuestions(List.of(question("Ready to publish")));

        assertDoesNotThrow(() -> service.saveOrUpdateQuiz(request, admin, true));

        assertTrue(memberQuiz.getIsPublished());
        verify(questionRepository).save(argThat(question ->
                question.getQuizId().equals(20)
                        && question.getTitle().equals("Ready to publish")
                        && question.getSortOrder().equals(1)));
    }

    @Test void zeroQuestionQuizCannotBePublishedButCanRemainDraft() {
        QuizSaveRequestDto publishRequest = request(null);
        publishRequest.setIsPublished(true);

        assertThrows(IllegalArgumentException.class,
                () -> service.saveOrUpdateQuiz(publishRequest, admin, true));
        verify(quizRepository, never()).save(any());

        assertDoesNotThrow(() -> service.saveOrUpdateQuiz(request(null), memberA, false));
    }

    @Test void publishedQuizRequiresAtLeastOneRequiredQuestion() {
        QuizSaveRequestDto publishRequest = request(null);
        publishRequest.setIsPublished(true);
        publishRequest.setQuestions(List.of(
                new QuestionSaveDto(null, "Optional only", "T", false, List.of())));

        assertThrows(IllegalArgumentException.class,
                () -> service.saveOrUpdateQuiz(publishRequest, admin, true));
        verify(quizRepository, never()).save(any());
    }

    @Test void questionArrayOrderIsPersistedAsContinuousSortOrder() {
        QuizSaveRequestDto request = request(null);
        request.setQuestions(List.of(
                question("Third moved first"),
                question("Original first"),
                question("Original second")
        ));

        service.saveOrUpdateQuiz(request, memberA, false);

        var captor = org.mockito.ArgumentCaptor.forClass(QuizQuestion.class);
        verify(questionRepository, times(3)).save(captor.capture());
        assertEquals(List.of("Third moved first", "Original first", "Original second"),
                captor.getAllValues().stream().map(QuizQuestion::getTitle).toList());
        assertEquals(List.of(1, 2, 3),
                captor.getAllValues().stream().map(QuizQuestion::getSortOrder).toList());
    }

    @Test void loadingQuestionsKeepsPersistedSortOrder() {
        QuizQuestion first = persistedQuestion(201, 10, "Third moved first", 1);
        QuizQuestion second = persistedQuestion(202, 10, "Original first", 2);
        QuizQuestion third = persistedQuestion(203, 10, "Original second", 3);
        when(questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(10))
                .thenReturn(List.of(first, second, third));
        when(optionRepository.findByQuestionIdInOrderBySortOrderAscIdAsc(List.of(201, 202, 203)))
                .thenReturn(List.of());

        List<QuestionSaveDto> loaded = service.loadQuestions(10);

        assertEquals(List.of("Third moved first", "Original first", "Original second"),
                loaded.stream().map(QuestionSaveDto::getQuestName).toList());
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
        when(responseRepository.countByQuizIds(List.of(10)))
                .thenReturn(List.<Object[]>of(new Object[]{10, 2L}));

        List<QuizListDto> result = service.getOwnedQuizzes(
                memberA.getId(), null, null, null, 0, 10, "id", "desc").getContent();

        assertEquals(List.of(10), result.stream().map(QuizListDto::getId).toList());
        assertEquals(memberA.getId(), result.get(0).getOwnerId());
        assertEquals(2L, result.get(0).getResponseCount());
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
        when(responseRepository.searchByQuizId(eq(10), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        assertDoesNotThrow(() -> responseService.getQuizResponses(
                10, 0, 10, memberA.getId(), false, null, "id", "desc"));
        assertThrows(SecurityException.class,
                () -> responseService.getQuizResponses(
                        20, 0, 10, memberA.getId(), false, null, "id", "desc"));
        verify(responseRepository, never()).searchByQuizId(eq(20), any(), any(Pageable.class));
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
                () -> responseService.getResponseDetail(50, memberA.getId(), false));
        assertDoesNotThrow(() -> responseService.getResponseDetail(50, admin.getId(), true));
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

    @Test void adminStatusOverrideIsPersistedAndControlsEffectiveStatus() {
        Quiz target = quiz(10, memberA);
        when(quizRepository.findById(10)).thenReturn(Optional.of(target));
        when(questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(10))
                .thenReturn(List.of(persistedQuestion(201, 10, "Question", 1)));

        QuizListDto result = service.updateAdminStatus(10, com.survey.enums.QuizStatus.IN_PROGRESS);

        assertEquals(com.survey.enums.QuizStatus.IN_PROGRESS, target.getAdminStatusOverride());
        assertTrue(target.getIsPublished());
        assertEquals(com.survey.enums.QuizStatus.IN_PROGRESS, result.getStatus());
        verify(quizRepository).save(target);
    }

    @Test void statusOverrideCannotPublishQuestionlessQuiz() {
        Quiz target = quiz(10, memberA);
        when(quizRepository.findById(10)).thenReturn(Optional.of(target));
        when(questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(10)).thenReturn(List.of());

        assertThrows(IllegalArgumentException.class,
                () -> service.updateAdminStatus(10, com.survey.enums.QuizStatus.IN_PROGRESS));
        verify(quizRepository, never()).save(any());
    }

    private QuestionSaveDto question(String title) {
        return new QuestionSaveDto(null, title, "T", true, List.of());
    }

    private QuizQuestion persistedQuestion(int id, int quizId, String title, int sortOrder) {
        QuizQuestion question = new QuizQuestion();
        question.setId(id);
        question.setQuizId(quizId);
        question.setTitle(title);
        question.setType("T");
        question.setIsRequired(true);
        question.setSortOrder(sortOrder);
        return question;
    }
}
