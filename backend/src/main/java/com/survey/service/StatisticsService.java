package com.survey.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.survey.dto.*;
import com.survey.entity.Quiz;
import com.survey.entity.QuizQuestion;
import com.survey.entity.ResponseAnswer;
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
    private final QuizResponseRepository responseRepository;
    private final ResponseAnswerRepository answerRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public QuizStatisticsDto getQuizStatistics(Integer quizId) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("問卷不存在 (ID: " + quizId + ")"));

        int totalResponses = responseRepository.countByQuizId(quizId);
        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderBySortOrderAscIdAsc(quizId);

        if (questions.isEmpty()) {
            return QuizStatisticsDto.builder()
                    .quizId(quiz.getId())
                    .quizName(quiz.getName())
                    .description(quiz.getDescription())
                    .totalResponses(totalResponses)
                    .questions(Collections.emptyList())
                    .build();
        }

        // ⚡ 效能優化 1：批次一次取回此問卷下「所有題目」的回答，解決 N+1 查詢問題
        List<Integer> questionIds = questions.stream().map(QuizQuestion::getId).collect(Collectors.toList());
        List<ResponseAnswer> allAnswers = answerRepository.findByQuestionIdIn(questionIds);

        // 將 Answer 按 questionId 分組 (In-Memory Map)
        Map<Integer, List<ResponseAnswer>> answersByQuestionMap = allAnswers.stream()
                .collect(Collectors.groupingBy(ResponseAnswer::getQuestionId));

        List<QuestionStatDto> questionStats = new ArrayList<>();

        for (QuizQuestion q : questions) {
            List<ResponseAnswer> answers = answersByQuestionMap.getOrDefault(q.getId(), Collections.emptyList());
            int totalQuestionAnswers = answers.size();

            if ("T".equalsIgnoreCase(q.getType())) {
                // 文字題：相同回答進行分組計數 (In-memory grouping)
                Map<String, Long> groupedText = answers.stream()
                        .filter(a -> a.getAnswer() != null && !a.getAnswer().trim().isEmpty())
                        .collect(Collectors.groupingBy(ResponseAnswer::getAnswer, Collectors.counting()));

                List<TextAnswerDto> textAnswerDtos = groupedText.entrySet().stream()
                        .map(e -> new TextAnswerDto(e.getKey(), e.getValue()))
                        .sorted((a, b) -> Long.compare(b.getCount(), a.getCount()))
                        .collect(Collectors.toList());

                questionStats.add(QuestionStatDto.builder()
                        .questionId(q.getId())
                        .title(q.getTitle())
                        .type("T")
                        .isRequired(q.getIsRequired())
                        .totalAnswers(totalQuestionAnswers)
                        .textAnswers(textAnswerDtos)
                        .options(Collections.emptyList())
                        .build());

            } else {
                // 選擇題 (Q 單選 / M 多選)
                List<OptionDto> definedOptions = parseOptionsJson(q.getOptions());
                Map<String, Integer> countMap = new LinkedHashMap<>();
                for (OptionDto opt : definedOptions) {
                    countMap.put(opt.getOptionName(), 0);
                }

                // 計算每項選取次數 (多選題目答案以分號 ; 拆分)
                for (ResponseAnswer a : answers) {
                    if (a.getAnswer() != null && !a.getAnswer().trim().isEmpty()) {
                        String[] selectedOptions = a.getAnswer().split(";");
                        for (String sel : selectedOptions) {
                            String trimmed = sel.trim();
                            if (!trimmed.isEmpty()) {
                                countMap.put(trimmed, countMap.getOrDefault(trimmed, 0) + 1);
                            }
                        }
                    }
                }

                // ⚡ 百分比計算：以「實際回答該題人數」為基準計算百分比
                int baseCount = Math.max(totalQuestionAnswers, 1);
                List<OptionStatDto> optionStats = new ArrayList<>();
                for (Map.Entry<String, Integer> entry : countMap.entrySet()) {
                    int count = entry.getValue();
                    double percentage = Math.round((double) count / baseCount * 100.0 * 10.0) / 10.0;
                    optionStats.add(new OptionStatDto(entry.getKey(), count, percentage));
                }

                questionStats.add(QuestionStatDto.builder()
                        .questionId(q.getId())
                        .title(q.getTitle())
                        .type(q.getType())
                        .isRequired(q.getIsRequired())
                        .totalAnswers(totalQuestionAnswers)
                        .options(optionStats)
                        .textAnswers(Collections.emptyList())
                        .build());
            }
        }

        return QuizStatisticsDto.builder()
                .quizId(quiz.getId())
                .quizName(quiz.getName())
                .description(quiz.getDescription())
                .totalResponses(totalResponses)
                .questions(questionStats)
                .build();
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
