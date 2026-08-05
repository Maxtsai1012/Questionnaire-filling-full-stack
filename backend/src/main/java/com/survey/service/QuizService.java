package com.survey.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.survey.dto.*;
import com.survey.entity.Quiz;
import com.survey.entity.QuizQuestion;
import com.survey.entity.QuizResponse;
import com.survey.entity.ResponseAnswer;
import com.survey.enums.QuizStatus;
import com.survey.repository.QuizQuestionRepository;
import com.survey.repository.QuizRepository;
import com.survey.repository.QuizResponseRepository;
import com.survey.repository.ResponseAnswerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import com.survey.common.RequestValidationException;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizResponseRepository responseRepository;
    private final ResponseAnswerRepository answerRepository;
    private final ObjectMapper objectMapper;
    private final SubmissionEligibilityService submissionEligibilityService;

    @Transactional(readOnly = true)
    public Page<QuizListDto> getFrontQuizzes(String name, LocalDate startDate, LocalDate endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Quiz> quizzes = quizRepository.searchQuizzes(name, startDate, endDate, true, pageable);

        return quizzes.map(quiz -> {
            QuizStatus status = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
            boolean canFill = (status == QuizStatus.IN_PROGRESS);
            boolean canViewStats = (status == QuizStatus.IN_PROGRESS || status == QuizStatus.ENDED);

            return QuizListDto.builder()
                    .id(quiz.getId())
                    .name(quiz.getName())
                    .startDate(quiz.getStartDate())
                    .endDate(quiz.getEndDate())
                    .isPublished(quiz.getIsPublished())
                    .status(status)
                    .statusLabel(status.getLabel())
                    .canFill(canFill)
                    .canViewStats(canViewStats)
                    .build();
        });
    }

    @Transactional(readOnly = true)
    public QuizDetailDto getFrontQuizDetail(Integer id) {
        Quiz quiz = quizRepository.findByIdAndIsPublishedTrue(id)
                .orElseThrow(() -> new com.survey.common.ResourceNotFoundException("問卷不存在"));

        QuizStatus status = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());

        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(id);
        List<QuestionSaveDto> questionDtos = questions.stream().map(q -> {
            List<OptionDto> options = parseOptionsJson(q.getOptions());
            return new QuestionSaveDto(
                    q.getId(),
                    q.getTitle(),
                    q.getType(),
                    q.getIsRequired(),
                    options
            );
        }).collect(Collectors.toList());

        return QuizDetailDto.builder()
                .id(quiz.getId())
                .name(quiz.getName())
                .description(quiz.getDescription())
                .startDate(quiz.getStartDate())
                .endDate(quiz.getEndDate())
                .isPublished(quiz.getIsPublished())
                .status(status)
                .statusLabel(status.getLabel())
                .questions(questionDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public boolean checkEmailExists(Integer quizId, String email) {
        return responseRepository.existsByQuizIdAndEmailIgnoreCase(quizId, email.trim());
    }

    @Transactional
    public Integer submitResponse(ResponseSubmitDto req, Integer userId) {
        Quiz quiz = quizRepository.findById(req.getQuizId())
                .orElseThrow(() -> new IllegalArgumentException("問卷不存在"));

        QuizStatus status = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
        if (status != QuizStatus.IN_PROGRESS) {
            throw new IllegalStateException("此問卷目前非開放填寫狀態 (當前狀態: " + status.getLabel() + ")");
        }

        req.setRespondentName(req.getRespondentName().trim().replaceAll("\\s+", " "));
        req.setPhone(submissionEligibilityService.normalizePhone(req.getPhone()));
        req.setEmail(req.getEmail().trim());
        validateAnswers(req);
        submissionEligibilityService.ensureNotDuplicate(req.getQuizId(), req.getEmail());

        // Save Response
        QuizResponse response = new QuizResponse();
        response.setQuizId(req.getQuizId());
        submissionEligibilityService.applyIdentity(response, userId, req.getRespondentName(), req.getPhone());
        response.setRespondentName(req.getRespondentName());
        response.setPhone(req.getPhone());
        response.setEmail(req.getEmail());
        response.setAge(req.getAge());
        QuizResponse savedResponse = responseRepository.save(response);

        // Save Answers
        if (req.getAnswers() != null) {
            List<ResponseAnswer> answersToSave = new ArrayList<>();
            for (AnswerSubmitDto ansReq : req.getAnswers()) {
                ResponseAnswer ans = new ResponseAnswer();
                ans.setResponseId(savedResponse.getId());
                ans.setQuestionId(ansReq.getQuestionId());
                ans.setAnswer(ansReq.getAnswer());
                answersToSave.add(ans);
            }
            answerRepository.saveAll(answersToSave);
        }

        return savedResponse.getId();
    }

    private void validateAnswers(ResponseSubmitDto req) {
        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(req.getQuizId());
        Map<Integer, AnswerSubmitDto> submitted = req.getAnswers() == null ? Collections.emptyMap()
                : req.getAnswers().stream()
                    .filter(a -> a.getQuestionId() != null)
                    .collect(Collectors.toMap(AnswerSubmitDto::getQuestionId, a -> a, (a, b) -> a));
        Set<Integer> validIds = questions.stream().map(QuizQuestion::getId).collect(Collectors.toSet());
        Map<String, String> errors = new LinkedHashMap<>();

        for (Integer submittedId : submitted.keySet()) {
            if (!validIds.contains(submittedId)) {
                errors.put("answers", "問卷答案包含不存在的題目");
            }
        }
        for (QuizQuestion question : questions) {
            String value = submitted.containsKey(question.getId()) ? submitted.get(question.getId()).getAnswer() : "";
            value = value == null ? "" : value.trim();
            if (Boolean.TRUE.equals(question.getIsRequired()) && value.isEmpty()) {
                errors.put("question_" + question.getId(), "此題為必填項目!!");
                continue;
            }
            if (!value.isEmpty() && !"T".equals(question.getType())) {
                Set<String> allowed = parseOptionsJson(question.getOptions()).stream()
                        .map(OptionDto::getOptionName).collect(Collectors.toSet());
                String[] selected = "M".equals(question.getType()) ? value.split(";") : new String[]{value};
                if (java.util.Arrays.stream(selected).anyMatch(option -> !allowed.contains(option))) {
                    errors.put("question_" + question.getId(), "答案選項不合法!!");
                }
            }
        }
        if (!errors.isEmpty()) {
            throw new RequestValidationException(errors);
        }
    }

    private List<OptionDto> parseOptionsJson(String json) {
        if (json == null || json.trim().isEmpty()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<OptionDto>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
