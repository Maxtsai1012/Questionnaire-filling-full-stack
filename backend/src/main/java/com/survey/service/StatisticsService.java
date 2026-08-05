package com.survey.service;

import com.survey.common.ResourceNotFoundException;
import com.survey.dto.*;
import com.survey.entity.Quiz;
import com.survey.entity.QuizOption;
import com.survey.entity.QuizQuestion;
import com.survey.enums.QuestionType;
import com.survey.repository.QuizOptionRepository;
import com.survey.repository.QuizQuestionRepository;
import com.survey.repository.QuizRepository;
import com.survey.repository.QuizResponseRepository;
import com.survey.repository.ResponseAnswerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizOptionRepository optionRepository;
    private final QuizResponseRepository responseRepository;
    private final ResponseAnswerRepository answerRepository;

    @Transactional(readOnly = true)
    public QuizStatisticsDto getPublicQuizStatistics(Integer quizId) {
        Quiz quiz = quizRepository.findByIdAndIsPublishedTrue(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("問卷不存在"));
        return buildStatistics(quiz);
    }

    @Transactional(readOnly = true)
    public QuizStatisticsDto getManagedQuizStatistics(Integer quizId, Integer actorId, boolean admin) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("問卷不存在"));
        if (!admin && (quiz.getOwner() == null || !quiz.getOwner().getId().equals(actorId))) {
            throw new SecurityException("無權查看此問卷統計");
        }
        return buildStatistics(quiz);
    }

    private QuizStatisticsDto buildStatistics(Quiz quiz) {
        int totalResponses = responseRepository.countByQuizId(quiz.getId());
        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(quiz.getId());

        if (questions.isEmpty()) {
            return baseBuilder(quiz, totalResponses).questions(Collections.emptyList()).build();
        }

        List<Integer> questionIds = questions.stream().map(QuizQuestion::getId).collect(Collectors.toList());

        // 四次聚合查詢取代「整批答案拉回 JVM 分組」，且不隨填答量增加查詢次數。
        Map<Integer, Integer> answeredByQuestion = toIntMap(answerRepository.countAnswersByQuestion(questionIds));
        Map<Integer, Integer> votesByOptionId = toIntMap(answerRepository.countVotesByOption(questionIds));
        Map<Integer, List<QuizOption>> optionsByQuestion = optionRepository
                .findByQuestionIdInOrderBySortOrderAscIdAsc(questionIds).stream()
                .collect(Collectors.groupingBy(QuizOption::getQuestionId));
        Map<Integer, List<TextAnswerDto>> textsByQuestion = groupTextAnswers(
                answerRepository.countTextAnswers(questionIds));

        List<QuestionStatDto> questionStats = new ArrayList<>();
        for (QuizQuestion q : questions) {
            int answered = answeredByQuestion.getOrDefault(q.getId(), 0);
            QuestionStatDto.QuestionStatDtoBuilder stat = QuestionStatDto.builder()
                    .questionId(q.getId())
                    .title(q.getTitle())
                    .type(q.getType())
                    .isRequired(q.getIsRequired())
                    .totalAnswers(answered);

            if (QuestionType.fromCode(q.getType()) == QuestionType.T) {
                questionStats.add(stat
                        .textAnswers(textsByQuestion.getOrDefault(q.getId(), List.of()))
                        .options(Collections.emptyList())
                        .build());
            } else {
                questionStats.add(stat
                        .options(optionStats(optionsByQuestion.getOrDefault(q.getId(), List.of()),
                                votesByOptionId, answered))
                        .textAnswers(Collections.emptyList())
                        .build());
            }
        }

        return baseBuilder(quiz, totalResponses).questions(questionStats).build();
    }

    /**
     * 分母是「作答人數」而非「勾選次數」，所以多選題各項加總會超過 100%——這是多選的
     * 正確語意（每項＝勾選此項的人佔作答者比例），前端因此不對多選畫圓餅圖。
     */
    private List<OptionStatDto> optionStats(List<QuizOption> options,
                                            Map<Integer, Integer> votesByOptionId,
                                            int answered) {
        int base = Math.max(answered, 1);
        return options.stream()
                .map(opt -> {
                    int count = votesByOptionId.getOrDefault(opt.getId(), 0);
                    double percentage = Math.round((double) count / base * 1000.0) / 10.0;
                    return new OptionStatDto(opt.getLabel(), count, percentage);
                })
                .collect(Collectors.toList());
    }

    private Map<Integer, List<TextAnswerDto>> groupTextAnswers(List<Object[]> rows) {
        Map<Integer, List<TextAnswerDto>> grouped = new LinkedHashMap<>();
        for (Object[] row : rows) {
            grouped.computeIfAbsent((Integer) row[0], k -> new ArrayList<>())
                    .add(new TextAnswerDto((String) row[1], ((Number) row[2]).longValue()));
        }
        grouped.values().forEach(list -> list.sort((a, b) -> Long.compare(b.getCount(), a.getCount())));
        return grouped;
    }

    private Map<Integer, Integer> toIntMap(List<Object[]> rows) {
        Map<Integer, Integer> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((Integer) row[0], ((Number) row[1]).intValue());
        }
        return map;
    }

    private QuizStatisticsDto.QuizStatisticsDtoBuilder baseBuilder(Quiz quiz, int totalResponses) {
        return QuizStatisticsDto.builder()
                .quizId(quiz.getId())
                .quizName(quiz.getName())
                .description(quiz.getDescription())
                .totalResponses(totalResponses);
    }
}
