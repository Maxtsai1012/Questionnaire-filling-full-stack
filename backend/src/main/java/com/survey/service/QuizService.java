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

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizResponseRepository responseRepository;
    private final ResponseAnswerRepository answerRepository;
    private final ObjectMapper objectMapper;

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
        Quiz quiz = quizRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("問卷不存在 (ID: " + id + ")"));

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
        return responseRepository.existsByQuizIdAndEmail(quizId, email);
    }

    @Transactional
    public Integer submitResponse(ResponseSubmitDto req) {
        Quiz quiz = quizRepository.findById(req.getQuizId())
                .orElseThrow(() -> new IllegalArgumentException("問卷不存在"));

        QuizStatus status = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
        if (status != QuizStatus.IN_PROGRESS) {
            throw new IllegalStateException("此問卷目前非開放填寫狀態 (當前狀態: " + status.getLabel() + ")");
        }

        if (responseRepository.existsByQuizIdAndEmail(req.getQuizId(), req.getEmail())) {
            throw new IllegalArgumentException("同一個 Email (" + req.getEmail() + ") 無法重複填寫同一張問卷！");
        }

        // Save Response
        QuizResponse response = new QuizResponse();
        response.setQuizId(req.getQuizId());
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
