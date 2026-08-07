package com.survey.service;

import com.survey.common.ResourceNotFoundException;
import com.survey.dto.OptionDto;
import com.survey.dto.QuestionSaveDto;
import com.survey.dto.QuizDetailDto;
import com.survey.dto.QuizListDto;
import com.survey.dto.QuizSaveRequestDto;
import com.survey.enums.QuestionType;
import com.survey.entity.AppUser;
import com.survey.entity.Quiz;
import com.survey.entity.QuizQuestion;
import com.survey.enums.QuizStatus;
import com.survey.entity.QuizOption;
import com.survey.repository.QuizOptionRepository;
import com.survey.repository.QuizQuestionRepository;
import com.survey.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizManagementService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizOptionRepository optionRepository;

    /**
     * Validates start and end date range.
     */
    public void validateDateRange(LocalDate startDate, LocalDate endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("問卷結束時間不能早於開始時間，請重新選擇！");
        }
    }

    @Transactional(readOnly = true)
    public Page<QuizListDto> getAdminQuizzes(String name, LocalDate startDate, LocalDate endDate, int page, int size) {
        validateDateRange(startDate, endDate);
        Pageable pageable = PageRequest.of(page, size);
        return quizRepository.searchAdminQuizzes(name, startDate, endDate, pageable)
                .map(this::toManagementListDto);
    }

    @Transactional(readOnly = true)
    public Page<QuizListDto> getOwnedQuizzes(Integer ownerId, String name, LocalDate startDate,
                                              LocalDate endDate, int page, int size) {
        validateDateRange(startDate, endDate);
        Pageable pageable = PageRequest.of(page, size);
        return quizRepository.searchOwnedQuizzes(ownerId, name, startDate, endDate, pageable)
                .map(this::toManagementListDto);
    }

    /**
     * 載入整份問卷的題目與選項。選項用一次 IN 查詢撈回再分組，避免逐題查詢。
     * 前台與管理端共用，確保兩邊看到的題目結構一致。
     */
    @Transactional(readOnly = true)
    public List<QuestionSaveDto> loadQuestions(Integer quizId) {
        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(quizId);
        if (questions.isEmpty()) {
            return List.of();
        }

        List<Integer> questionIds = questions.stream().map(QuizQuestion::getId).collect(Collectors.toList());
        Map<Integer, List<OptionDto>> optionsByQuestion = optionRepository
                .findByQuestionIdInOrderBySortOrderAscIdAsc(questionIds).stream()
                .collect(Collectors.groupingBy(
                        QuizOption::getQuestionId,
                        Collectors.mapping(o -> new OptionDto(o.getLabel(), o.getCode()), Collectors.toList())));

        return questions.stream()
                .map(q -> new QuestionSaveDto(
                        q.getId(),
                        q.getTitle(),
                        q.getType(),
                        q.getIsRequired(),
                        optionsByQuestion.getOrDefault(q.getId(), List.of())
                ))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuizDetailDto getManagedQuizDetail(Integer quizId, Integer actorId, boolean admin) {
        Quiz quiz = resolveManageableQuiz(quizId, actorId, admin);
        List<QuestionSaveDto> questions = loadQuestions(quizId);

        QuizStatus status = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
        return QuizDetailDto.builder()
                .id(quiz.getId())
                .name(quiz.getName())
                .description(quiz.getDescription())
                .startDate(quiz.getStartDate())
                .endDate(quiz.getEndDate())
                .isPublished(quiz.getIsPublished())
                .status(status)
                .statusLabel(status.getLabel())
                .questions(questions)
                .build();
    }

    @Transactional
    public Integer saveOrUpdateQuiz(QuizSaveRequestDto req, AppUser actor, boolean admin) {
        LocalDate today = LocalDate.now();

        if (req.getStartDate() == null || req.getEndDate() == null) {
            throw new IllegalArgumentException("開始時間與結束時間皆為必填！");
        }
        if (req.getStartDate().isAfter(req.getEndDate())) {
            throw new IllegalArgumentException("結束時間不能早於開始時間！");
        }

        Quiz quiz;
        if (req.getId() != null) {
            quiz = resolveManageableQuiz(req.getId(), actor.getId(), admin);
            QuizStatus currentStatus = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
            if (currentStatus == QuizStatus.IN_PROGRESS || currentStatus == QuizStatus.ENDED) {
                throw new IllegalStateException("問卷「" + quiz.getName() + "」目前為" + currentStatus.getLabel() + "狀態，題目結構已鎖定不可修改！");
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

        questionRepository.deleteByQuizId(savedQuiz.getId());

        if (req.getQuestions() != null && !req.getQuestions().isEmpty()) {
            int order = 1;
            for (QuestionSaveDto qDto : req.getQuestions()) {
                QuizQuestion qq = new QuizQuestion();
                qq.setQuizId(savedQuiz.getId());
                qq.setTitle(qDto.getQuestName());
                qq.setType(resolveType(qDto.getType()));
                qq.setIsRequired(Boolean.TRUE.equals(qDto.getNeed()));
                qq.setSortOrder(order++);
                saveOptions(questionRepository.save(qq), qDto.getOptions());
            }
        }

        return savedQuiz.getId();
    }

    /** DB 有 ck_question_type 擋，這裡先擋一次以回傳可讀的錯誤而非約束violation。 */
    private String resolveType(String rawType) {
        QuestionType type = QuestionType.fromCode(rawType);
        if (type == null) {
            throw new IllegalArgumentException("題型只能是 Q（單選）、M（多選）或 T（文字），收到：" + rawType);
        }
        return type.getCode();
    }

    private void saveOptions(QuizQuestion question, List<OptionDto> options) {
        if (QuestionType.fromCode(question.getType()) == QuestionType.T || options == null || options.isEmpty()) {
            return;
        }
        List<QuizOption> rows = new ArrayList<>();
        int order = 0;
        for (OptionDto opt : options) {
            // code 由儲存順序重編，避免前端送進重複或跳號的 code 撞上 uk_option_question_code
            rows.add(new QuizOption(question.getId(), order, opt.getOptionName(), order));
            order++;
        }
        optionRepository.saveAll(rows);
    }

    /**
     * 子資料（題目／填答／答案）由 schema 的 ON DELETE CASCADE 負責清除，
     * 不在應用層重複刪一次——約束放在 DB 才對所有寫入者一體適用。
     */
    @Transactional
    public void deleteQuizzes(List<Integer> ids, Integer actorId, boolean admin) {
        if (ids == null || ids.isEmpty()) {
            return;
        }

        for (Integer id : ids) {
            quizRepository.delete(resolveManageableQuiz(id, actorId, admin));
        }
    }

    public Quiz resolveManageableQuiz(Integer quizId, Integer actorId, boolean admin) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("問卷不存在"));
        if (!admin && (quiz.getOwner() == null || !quiz.getOwner().getId().equals(actorId))) {
            throw new SecurityException("無權管理此問卷");
        }
        return quiz;
    }

    private QuizListDto toManagementListDto(Quiz quiz) {
        QuizStatus status = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
        boolean canEdit = (status == QuizStatus.UNPUBLISHED || status == QuizStatus.NOT_STARTED);
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
                .canViewStats(canViewStats)
                .ownerId(quiz.getOwner() == null ? null : quiz.getOwner().getId())
                .ownerName(quiz.getOwner() == null ? null : quiz.getOwner().getName())
                .build();
    }
}
