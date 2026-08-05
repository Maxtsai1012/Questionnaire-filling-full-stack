package com.survey.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.survey.dto.*;
import com.survey.entity.Quiz;
import com.survey.entity.QuizQuestion;
import com.survey.entity.QuizResponse;
import com.survey.entity.ResponseAnswer;
import com.survey.entity.AppUser;
import com.survey.common.ResourceNotFoundException;
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
public class AdminQuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizResponseRepository responseRepository;
    private final ResponseAnswerRepository answerRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<QuizListDto> getAdminQuizzes(String name, LocalDate startDate, LocalDate endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Quiz> quizzes = quizRepository.searchAdminQuizzes(name, startDate, endDate, pageable);

        return quizzes.map(this::toManagementListDto);
    }

    @Transactional(readOnly = true)
    public Page<QuizListDto> getOwnedQuizzes(Integer ownerId, String name, LocalDate startDate,
                                              LocalDate endDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return quizRepository.searchOwnedQuizzes(ownerId, name, startDate, endDate, pageable)
                .map(this::toManagementListDto);
    }

    private QuizListDto toManagementListDto(Quiz quiz) {
            QuizStatus status = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
            boolean canEdit = (status == QuizStatus.UNPUBLISHED || status == QuizStatus.NOT_STARTED);
            boolean canDelete = (status == QuizStatus.UNPUBLISHED || status == QuizStatus.NOT_STARTED);
            boolean canViewStats = (status == QuizStatus.IN_PROGRESS || status == QuizStatus.ENDED);

            return QuizListDto.builder()
                    .id(quiz.getId())
                    .name(quiz.getName())
                    .startDate(quiz.getStartDate())
                    .endDate(quiz.getEndDate())
                    .isPublished(quiz.getIsPublished())
                    .status(status)
                    .statusLabel(status.getLabel())
                    .canEdit(canEdit)
                    .canDelete(canDelete)
                    .canViewStats(canViewStats)
                    .ownerId(quiz.getOwner() == null ? null : quiz.getOwner().getId())
                    .ownerName(quiz.getOwner() == null ? null : quiz.getOwner().getName())
                    .build();
    }

    @Transactional(readOnly = true)
    public QuizDetailDto getManagedQuizDetail(Integer quizId, Integer actorId, boolean admin) {
        Quiz quiz = resolveManageableQuiz(quizId, actorId, admin);
        List<QuestionSaveDto> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(quizId).stream()
                .map(q -> new QuestionSaveDto(q.getId(), q.getTitle(), q.getType(), q.getIsRequired(),
                        parseOptions(q.getOptions())))
                .collect(Collectors.toList());
        QuizStatus status = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
        return QuizDetailDto.builder().id(quiz.getId()).name(quiz.getName()).description(quiz.getDescription())
                .startDate(quiz.getStartDate()).endDate(quiz.getEndDate()).isPublished(quiz.getIsPublished())
                .status(status).statusLabel(status.getLabel()).questions(questions).build();
    }

    @Transactional
    public Integer saveOrUpdateQuiz(QuizSaveRequestDto req, AppUser actor, boolean admin) {
        LocalDate today = LocalDate.now();

        // Validation for new or modified dates
        if (req.getStartDate() != null && req.getEndDate() != null) {
            if (req.getStartDate().isAfter(req.getEndDate())) {
                throw new IllegalArgumentException("結束時間不能早於開始時間！");
            }
        }
        if (req.getStartDate() == null || req.getEndDate() == null) {
            throw new IllegalArgumentException("開始時間與結束時間皆為必填！");
        }

        Quiz quiz;
        if (req.getId() != null) {
            quiz = resolveManageableQuiz(req.getId(), actor.getId(), admin);

            QuizStatus currentStatus = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
            if (currentStatus == QuizStatus.IN_PROGRESS || currentStatus == QuizStatus.ENDED) {
                throw new IllegalStateException("進行中或已結束的問卷無法修改！");
            }
        } else {
            quiz = new Quiz();
            quiz.setOwner(actor);
            if (req.getStartDate().isBefore(today)) {
                throw new IllegalArgumentException("開始時間不能是今日之前的日期！");
            }
        }

        quiz.setName(req.getName());
        quiz.setDescription(req.getDescription());
        quiz.setStartDate(req.getStartDate());
        quiz.setEndDate(req.getEndDate());
        quiz.setIsPublished(Boolean.TRUE.equals(req.getIsPublished()));

        Quiz savedQuiz = quizRepository.save(quiz);

        // Delete existing questions and re-insert
        questionRepository.deleteByQuizId(savedQuiz.getId());

        if (req.getQuestions() != null && !req.getQuestions().isEmpty()) {
            List<QuizQuestion> questionsToSave = new ArrayList<>();
            int order = 1;
            for (QuestionSaveDto qDto : req.getQuestions()) {
                QuizQuestion qq = new QuizQuestion();
                qq.setQuizId(savedQuiz.getId());
                qq.setTitle(qDto.getQuestName());
                qq.setType(qDto.getType());
                qq.setIsRequired(Boolean.TRUE.equals(qDto.getNeed()));
                qq.setSortOrder(order++);

                if (qDto.getOptions() != null && !qDto.getOptions().isEmpty()) {
                    try {
                        qq.setOptions(objectMapper.writeValueAsString(qDto.getOptions()));
                    } catch (Exception e) {
                        qq.setOptions("[]");
                    }
                } else {
                    qq.setOptions(null);
                }
                questionsToSave.add(qq);
            }
            questionRepository.saveAll(questionsToSave);
        }

        return savedQuiz.getId();
    }

    @Transactional
    public void deleteQuizzes(List<Integer> ids) {
        deleteQuizzes(ids, null, true);
    }

    @Transactional
    public void deleteQuizzes(List<Integer> ids, Integer actorId, boolean admin) {
        if (ids == null || ids.isEmpty()) {
            return;
        }

        for (Integer id : ids) {
            Quiz quiz = resolveManageableQuiz(id, actorId, admin);
            if (quiz != null) {
                QuizStatus status = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
                if (status == QuizStatus.IN_PROGRESS || status == QuizStatus.ENDED) {
                    throw new IllegalStateException("問卷「" + quiz.getName() + "」為" + status.getLabel() + "狀態，不可刪除！");
                }
                quizRepository.delete(quiz);
            }
        }
    }

    private Quiz resolveManageableQuiz(Integer quizId, Integer actorId, boolean admin) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("問卷不存在"));
        if (!admin && (quiz.getOwner() == null || !quiz.getOwner().getId().equals(actorId))) {
            throw new SecurityException("無權管理此問卷");
        }
        return quiz;
    }

    private List<OptionDto> parseOptions(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<OptionDto>>() {});
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }

    @Transactional(readOnly = true)
    public Page<QuizResponseListDto> getQuizResponses(Integer quizId, int page, int size,
                                                       Integer actorId, boolean admin) {
        resolveManageableQuiz(quizId, actorId, admin);
        Pageable pageable = PageRequest.of(page, size);
        Page<QuizResponse> responses = responseRepository.findByQuizIdOrderByIdDesc(quizId, pageable);

        return responses.map(res -> QuizResponseListDto.builder()
                .id(res.getId())
                .respondentName(res.getRespondentName())
                .submittedAt(res.getSubmittedAt())
                .build());
    }

    @Transactional(readOnly = true)
    public QuizResponseDetailDto getResponseDetail(Integer responseId, Integer actorId, boolean admin) {
        QuizResponse response = responseRepository.findById(responseId)
                .orElseThrow(() -> new ResourceNotFoundException("找不到填答紀錄"));

        Quiz quiz = resolveManageableQuiz(response.getQuizId(), actorId, admin);

        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(quiz.getId());
        List<ResponseAnswer> answers = answerRepository.findByResponseId(responseId);

        List<QuizResponseDetailDto.QuestionAnswerItemDto> answerItems = new ArrayList<>();
        for (QuizQuestion q : questions) {
            String ansVal = answers.stream()
                    .filter(a -> a.getQuestionId().equals(q.getId()))
                    .map(ResponseAnswer::getAnswer)
                    .findFirst()
                    .orElse("無");

            answerItems.add(QuizResponseDetailDto.QuestionAnswerItemDto.builder()
                    .questionId(q.getId())
                    .title(q.getTitle())
                    .type(q.getType())
                    .isRequired(q.getIsRequired())
                    .answer(ansVal)
                    .build());
        }

        return QuizResponseDetailDto.builder()
                .responseId(response.getId())
                .quizId(quiz.getId())
                .quizName(quiz.getName())
                .quizDescription(quiz.getDescription())
                .startDate(quiz.getStartDate())
                .endDate(quiz.getEndDate())
                .respondentName(response.getRespondentName())
                .phone(response.getPhone())
                .email(response.getEmail())
                .age(response.getAge())
                .submittedAt(response.getSubmittedAt())
                .answers(answerItems)
                .build();
    }
}
