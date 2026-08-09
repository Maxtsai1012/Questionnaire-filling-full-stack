package com.survey.service;

import com.survey.common.ResourceNotFoundException;
import com.survey.dto.AnswerSubmitDto;
import com.survey.dto.QuizResponseDetailDto;
import com.survey.dto.ResponseSubmitDto;
import com.survey.entity.AppUser;
import com.survey.entity.Quiz;
import com.survey.entity.QuizOption;
import com.survey.entity.QuizQuestion;
import com.survey.entity.QuizResponse;
import com.survey.entity.ResponseAnswer;
import com.survey.enums.QuizStatus;
import com.survey.repository.QuizOptionRepository;
import com.survey.repository.QuizQuestionRepository;
import com.survey.repository.QuizRepository;
import com.survey.repository.QuizResponseRepository;
import com.survey.repository.ResponseAnswerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class QuizResponseUpdateServiceTest {
    private QuizRepository quizRepository;
    private QuizQuestionRepository questionRepository;
    private QuizOptionRepository optionRepository;
    private QuizResponseRepository responseRepository;
    private ResponseAnswerRepository answerRepository;
    private QuizManagementService managementService;
    private QuizResponseService service;
    private Quiz quiz;
    private List<QuizQuestion> questions;
    private List<QuizOption> options;
    private AppUser member;

    @BeforeEach
    void setUp() {
        quizRepository = mock(QuizRepository.class);
        questionRepository = mock(QuizQuestionRepository.class);
        optionRepository = mock(QuizOptionRepository.class);
        responseRepository = mock(QuizResponseRepository.class);
        answerRepository = mock(ResponseAnswerRepository.class);
        managementService = mock(QuizManagementService.class);
        service = new QuizResponseService(quizRepository, questionRepository, optionRepository,
                responseRepository, answerRepository, managementService,
                new SubmissionEligibilityService(responseRepository));

        quiz = new Quiz();
        quiz.setId(7);
        quiz.setName("Update test");
        quiz.setDescription("Description");
        quiz.setStartDate(LocalDate.now().minusDays(1));
        quiz.setEndDate(LocalDate.now().plusDays(1));
        quiz.setIsPublished(true);
        questions = List.of(
                question(11, "Q", "Single"),
                question(12, "M", "Multiple"),
                question(13, "T", "Text"));
        options = List.of(
                option(101, 11, 0, "Q A", 0), option(102, 11, 1, "Q B", 1),
                option(201, 12, 0, "M A", 0), option(202, 12, 1, "M B", 1));

        when(quizRepository.findById(7)).thenReturn(Optional.of(quiz));
        when(managementService.effectiveStatus(quiz)).thenReturn(QuizStatus.IN_PROGRESS);
        when(questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(7)).thenReturn(questions);
        when(optionRepository.findByQuestionIdInOrderBySortOrderAscIdAsc(List.of(11, 12, 13)))
                .thenReturn(options);
        when(responseRepository.save(any(QuizResponse.class))).thenAnswer(invocation -> {
            QuizResponse response = invocation.getArgument(0);
            if (response.getId() == null) response.setId(50);
            return response;
        });
        member = new AppUser();
        member.setId(1);
        member.setBirthday(LocalDate.of(2000, 10, 28));
    }

    @Test
    void secondMemberSubmitUpdatesSameResponseAndReplacesQMTAnswers() {
        QuizResponse existing = response(50, 1);
        when(responseRepository.findByQuizIdAndUserId(7, 1))
                .thenReturn(Optional.empty(), Optional.of(existing));
        ResponseAnswer oldAnswer = answer(301, 50, 11, null, 101);
        when(answerRepository.findByResponseId(50)).thenReturn(List.of(oldAnswer));

        Integer firstId = service.submitResponse(request(0, List.of(0), "first text"), member);
        Integer secondId = service.submitResponse(request(1, List.of(1), "updated text"), member);

        assertEquals(50, firstId);
        assertEquals(firstId, secondId);
        verify(responseRepository, times(2)).save(any(QuizResponse.class));
        verify(answerRepository).deleteAll(List.of(oldAnswer));
        verify(answerRepository).flush();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ResponseAnswer>> answers = ArgumentCaptor.forClass(List.class);
        verify(answerRepository, times(2)).saveAll(answers.capture());
        List<ResponseAnswer> latest = answers.getAllValues().get(1);
        assertEquals(3, latest.size());
        assertEquals("updated text", latest.stream()
                .filter(item -> item.getQuestionId().equals(13)).findFirst().orElseThrow().getAnswer());
        assertEquals(new LinkedHashSet<>(List.of(102)), latest.stream()
                .filter(item -> item.getQuestionId().equals(11)).findFirst().orElseThrow().getSelectedOptionIds());
        assertEquals(new LinkedHashSet<>(List.of(202)), latest.stream()
                .filter(item -> item.getQuestionId().equals(12)).findFirst().orElseThrow().getSelectedOptionIds());
        verify(responseRepository, times(2)).save(argThat(response ->
                response.getAge() == QuizResponseService.calculateAge(member.getBirthday(), LocalDate.now())));
    }

    @Test
    void ageUsesCompletedYearsAroundBirthday() {
        assertEquals(23, QuizResponseService.calculateAge(
                LocalDate.of(2000, 10, 28), LocalDate.of(2024, 10, 27)));
        assertEquals(24, QuizResponseService.calculateAge(
                LocalDate.of(2000, 10, 28), LocalDate.of(2024, 10, 28)));
    }

    @Test
    void myResponseUsesPrincipalUserAndReturnsCodesForAutoLoad() {
        QuizResponse mine = response(50, 1);
        when(responseRepository.findByQuizIdAndUserId(7, 1)).thenReturn(Optional.of(mine));
        when(responseRepository.findByQuizIdAndUserId(7, 2)).thenReturn(Optional.empty());
        when(answerRepository.findByResponseId(50)).thenReturn(List.of(
                answer(301, 50, 11, "Q B", 102),
                answer(302, 50, 12, "M A、M B", 201, 202),
                answer(303, 50, 13, "saved text")));

        QuizResponseDetailDto detail = service.getMyResponse(7, 1);

        assertEquals(50, detail.getResponseId());
        assertEquals(List.of(1), detail.getAnswers().get(0).getOptionCodes());
        assertEquals(List.of(0, 1), detail.getAnswers().get(1).getOptionCodes());
        assertEquals("saved text", detail.getAnswers().get(2).getAnswer());
        assertThrows(ResourceNotFoundException.class, () -> service.getMyResponse(7, 2));
    }

    private ResponseSubmitDto request(int singleCode, List<Integer> multiCodes, String text) {
        ResponseSubmitDto request = new ResponseSubmitDto();
        request.setQuizId(7);
        request.setRespondentName("Test User");
        request.setPhone("0912345678");
        request.setEmail("member@example.com");
        request.setAge(20);
        request.setAnswers(List.of(choiceAnswer(11, List.of(singleCode)),
                choiceAnswer(12, multiCodes), textAnswer(13, text)));
        return request;
    }

    private AnswerSubmitDto choiceAnswer(int questionId, List<Integer> codes) {
        AnswerSubmitDto answer = new AnswerSubmitDto();
        answer.setQuestionId(questionId);
        answer.setOptionCodes(codes);
        return answer;
    }

    private AnswerSubmitDto textAnswer(int questionId, String value) {
        AnswerSubmitDto answer = new AnswerSubmitDto();
        answer.setQuestionId(questionId);
        answer.setAnswer(value);
        return answer;
    }

    private QuizQuestion question(int id, String type, String title) {
        QuizQuestion question = new QuizQuestion();
        question.setId(id);
        question.setQuizId(7);
        question.setType(type);
        question.setTitle(title);
        question.setIsRequired(true);
        question.setSortOrder(id);
        return question;
    }

    private QuizOption option(int id, int questionId, int code, String label, int sortOrder) {
        QuizOption option = new QuizOption(questionId, code, label, sortOrder);
        option.setId(id);
        return option;
    }

    private QuizResponse response(int id, int userId) {
        QuizResponse response = new QuizResponse();
        response.setId(id);
        response.setQuizId(7);
        response.setUserId(userId);
        response.setRespondentName("Test User");
        response.setPhone("0912345678");
        response.setEmail("member@example.com");
        response.setSubmittedAt(LocalDateTime.of(2026, 8, 8, 12, 0));
        return response;
    }

    private ResponseAnswer answer(int id, int responseId, int questionId, String value, Integer... optionIds) {
        ResponseAnswer answer = new ResponseAnswer();
        answer.setId(id);
        answer.setResponseId(responseId);
        answer.setQuestionId(questionId);
        answer.setAnswer(value);
        answer.setSelectedOptionIds(new LinkedHashSet<>(List.of(optionIds)));
        return answer;
    }
}
