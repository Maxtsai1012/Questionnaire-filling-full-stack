package com.survey.service;

import com.survey.common.RequestValidationException;
import com.survey.common.ResourceNotFoundException;
import com.survey.dto.*;
import com.survey.entity.Quiz;
import com.survey.entity.QuizOption;
import com.survey.entity.QuizQuestion;
import com.survey.entity.QuizResponse;
import com.survey.entity.ResponseAnswer;
import com.survey.enums.QuestionType;
import com.survey.enums.QuizStatus;
import com.survey.repository.QuizOptionRepository;
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

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizResponseService {

    /** 選擇題答案的顯示分隔符。僅用於呈現，不參與解析。 */
    private static final String DISPLAY_SEPARATOR = "、";

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizOptionRepository optionRepository;
    private final QuizResponseRepository responseRepository;
    private final ResponseAnswerRepository answerRepository;
    private final QuizManagementService quizManagementService;
    private final SubmissionEligibilityService submissionEligibilityService;

    @Transactional
    public Integer submitResponse(ResponseSubmitDto req, Integer userId) {
        Quiz quiz = quizRepository.findById(req.getQuizId())
                .orElseThrow(() -> new IllegalArgumentException("問卷不存在"));

        QuizStatus status = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
        if (status != QuizStatus.IN_PROGRESS) {
            throw new IllegalStateException("此問卷目前非開放填寫狀態 (當前狀態: " + status.getLabel() + ")");
        }

        // 姓名／電話／Email 的正規化在 ResponseSubmitDto 的 setter 就已完成。
        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(req.getQuizId());
        Map<Integer, Map<Integer, QuizOption>> optionsByQuestion = loadOptionsByQuestion(questions);
        Map<Integer, AnswerSubmitDto> submitted = indexSubmitted(req);

        validateAnswers(questions, optionsByQuestion, submitted);
        submissionEligibilityService.ensureNotDuplicate(req.getQuizId(), req.getEmail());

        QuizResponse response = new QuizResponse();
        response.setQuizId(req.getQuizId());
        submissionEligibilityService.applyIdentity(response, userId);
        response.setRespondentName(req.getRespondentName());
        response.setPhone(req.getPhone());
        response.setEmail(req.getEmail());
        response.setAge(req.getAge());
        QuizResponse savedResponse = responseRepository.save(response);

        answerRepository.saveAll(buildAnswers(savedResponse.getId(), questions, optionsByQuestion, submitted));
        return savedResponse.getId();
    }

    @Transactional(readOnly = true)
    public Page<QuizResponseListDto> getQuizResponses(Integer quizId, int page, int size,
                                                       Integer actorId, boolean admin) {
        quizManagementService.resolveManageableQuiz(quizId, actorId, admin);
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

        Quiz quiz = quizManagementService.resolveManageableQuiz(response.getQuizId(), actorId, admin);

        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(quiz.getId());
        Map<Integer, ResponseAnswer> answersByQuestion = answerRepository.findByResponseId(responseId).stream()
                .collect(Collectors.toMap(ResponseAnswer::getQuestionId, a -> a, (a, b) -> a));
        Map<Integer, String> labelById = loadLabelsById(questions);

        List<QuizResponseDetailDto.QuestionAnswerItemDto> answerItems = new ArrayList<>();
        for (QuizQuestion q : questions) {
            answerItems.add(QuizResponseDetailDto.QuestionAnswerItemDto.builder()
                    .questionId(q.getId())
                    .title(q.getTitle())
                    .type(q.getType())
                    .isRequired(q.getIsRequired())
                    .answer(displayAnswer(q, answersByQuestion.get(q.getId()), labelById))
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

    /**
     * 顯示用答案：選擇題一律由目前的選項 label 重建，因此管理者改了選項文字後
     * 明細頁會跟著更新；response_answer.answer 的文字快照只在選項已被刪除時才派上用場。
     */
    private String displayAnswer(QuizQuestion question, ResponseAnswer answer, Map<Integer, String> labelById) {
        if (answer == null) {
            return "無";
        }
        if (QuestionType.fromCode(question.getType()) == QuestionType.T) {
            return answer.getAnswer() == null || answer.getAnswer().isBlank() ? "無" : answer.getAnswer();
        }
        String labels = answer.getSelectedOptionIds().stream()
                .map(labelById::get)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(DISPLAY_SEPARATOR));
        if (!labels.isEmpty()) {
            return labels;
        }
        // 選項已不存在，退回填答當下的文字快照
        return answer.getAnswer() == null || answer.getAnswer().isBlank() ? "無" : answer.getAnswer();
    }

    private Map<Integer, AnswerSubmitDto> indexSubmitted(ResponseSubmitDto req) {
        if (req.getAnswers() == null) {
            return Collections.emptyMap();
        }
        return req.getAnswers().stream()
                .filter(a -> a.getQuestionId() != null)
                .collect(Collectors.toMap(AnswerSubmitDto::getQuestionId, a -> a, (a, b) -> a));
    }

    /** questionId -> (code -> option) */
    private Map<Integer, Map<Integer, QuizOption>> loadOptionsByQuestion(List<QuizQuestion> questions) {
        if (questions.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Integer> ids = questions.stream().map(QuizQuestion::getId).collect(Collectors.toList());
        return optionRepository.findByQuestionIdInOrderBySortOrderAscIdAsc(ids).stream()
                .collect(Collectors.groupingBy(QuizOption::getQuestionId,
                        Collectors.toMap(QuizOption::getCode, o -> o, (a, b) -> a, LinkedHashMap::new)));
    }

    private Map<Integer, String> loadLabelsById(List<QuizQuestion> questions) {
        if (questions.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Integer> ids = questions.stream().map(QuizQuestion::getId).collect(Collectors.toList());
        return optionRepository.findByQuestionIdInOrderBySortOrderAscIdAsc(ids).stream()
                .collect(Collectors.toMap(QuizOption::getId, QuizOption::getLabel, (a, b) -> a));
    }

    private void validateAnswers(List<QuizQuestion> questions,
                                 Map<Integer, Map<Integer, QuizOption>> optionsByQuestion,
                                 Map<Integer, AnswerSubmitDto> submitted) {
        Set<Integer> validIds = questions.stream().map(QuizQuestion::getId).collect(Collectors.toSet());
        Map<String, String> errors = new LinkedHashMap<>();

        if (!validIds.containsAll(submitted.keySet())) {
            errors.put("answers", "問卷答案包含不存在的題目");
        }

        for (QuizQuestion question : questions) {
            QuestionType type = QuestionType.fromCode(question.getType());
            AnswerSubmitDto item = submitted.get(question.getId());
            String field = "question_" + question.getId();

            if (type == QuestionType.T) {
                String text = item == null || item.getAnswer() == null ? "" : item.getAnswer().trim();
                if (Boolean.TRUE.equals(question.getIsRequired()) && text.isEmpty()) {
                    errors.put(field, "此題為必填項目!!");
                }
                continue;
            }

            List<Integer> codes = item == null || item.getOptionCodes() == null
                    ? List.of() : item.getOptionCodes();
            if (codes.isEmpty()) {
                if (Boolean.TRUE.equals(question.getIsRequired())) {
                    errors.put(field, "此題為必填項目!!");
                }
                continue;
            }
            if (type == QuestionType.Q && codes.size() > 1) {
                errors.put(field, "單選題只能選擇一個選項!!");
                continue;
            }
            Map<Integer, QuizOption> allowed = optionsByQuestion.getOrDefault(question.getId(), Map.of());
            if (!allowed.keySet().containsAll(codes)) {
                errors.put(field, "答案選項不合法!!");
            }
        }

        if (!errors.isEmpty()) {
            throw new RequestValidationException(errors);
        }
    }

    private List<ResponseAnswer> buildAnswers(Integer responseId,
                                              List<QuizQuestion> questions,
                                              Map<Integer, Map<Integer, QuizOption>> optionsByQuestion,
                                              Map<Integer, AnswerSubmitDto> submitted) {
        List<ResponseAnswer> rows = new ArrayList<>();
        for (QuizQuestion question : questions) {
            AnswerSubmitDto item = submitted.get(question.getId());
            if (item == null) {
                continue;
            }
            QuestionType type = QuestionType.fromCode(question.getType());

            ResponseAnswer row = new ResponseAnswer();
            row.setResponseId(responseId);
            row.setQuestionId(question.getId());

            if (type == QuestionType.T) {
                String text = item.getAnswer() == null ? "" : item.getAnswer().trim();
                if (text.isEmpty()) {
                    continue;   // 選填文字題沒作答就不建列，統計的分母才不會被灌水
                }
                row.setAnswer(text);
            } else {
                List<Integer> codes = item.getOptionCodes() == null ? List.of() : item.getOptionCodes();
                if (codes.isEmpty()) {
                    continue;
                }
                Map<Integer, QuizOption> byCode = optionsByQuestion.getOrDefault(question.getId(), Map.of());
                List<QuizOption> chosen = codes.stream().map(byCode::get).filter(Objects::nonNull).toList();
                row.setSelectedOptionIds(chosen.stream().map(QuizOption::getId)
                        .collect(Collectors.toCollection(LinkedHashSet::new)));
                row.setAnswer(chosen.stream().map(QuizOption::getLabel)
                        .collect(Collectors.joining(DISPLAY_SEPARATOR)));
            }
            rows.add(row);
        }
        return rows;
    }
}
