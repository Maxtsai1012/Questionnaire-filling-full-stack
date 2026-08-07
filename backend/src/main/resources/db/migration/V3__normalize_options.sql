-- 選項正規化。
--
-- 原設計把選項存在 quiz_question.options 的 JSON 欄位，答案則存「選項顯示文字」、
-- 多選以分號串接。三個後果：
--   1. 選項改名 → 歷史答案對不上，統計會長出從未定義過的選項列
--   2. 選項文字含分號 → 多選解析直接錯亂
--   3. 統計無法下推到 SQL，只能整批拉回 JVM 分組
-- 選項獨立成表後，答案指向 option id，三個問題同時消失。

CREATE TABLE quiz_option (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    code INT NOT NULL COMMENT '題目內的選項代碼，前端送答案時使用',
    label VARCHAR(500) NOT NULL COMMENT '顯示文字，可被編輯而不影響既有答案',
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_option_question FOREIGN KEY (question_id) REFERENCES quiz_question(id) ON DELETE CASCADE,
    CONSTRAINT uk_option_question_code UNIQUE (question_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 把既有 JSON 選項攤平成資料列
INSERT INTO quiz_option (question_id, code, label, sort_order)
SELECT q.id, jt.code, jt.option_name, jt.ordinality
FROM quiz_question q,
     JSON_TABLE(q.options, '$[*]' COLUMNS (
         ordinality FOR ORDINALITY,
         code INT PATH '$.code',
         option_name VARCHAR(500) PATH '$.optionName'
     )) AS jt
WHERE q.options IS NOT NULL
  AND JSON_LENGTH(q.options) > 0
  AND jt.option_name IS NOT NULL;

CREATE TABLE response_answer_option (
    answer_id INT NOT NULL,
    option_id INT NOT NULL,
    PRIMARY KEY (answer_id, option_id),
    CONSTRAINT fk_rao_answer FOREIGN KEY (answer_id) REFERENCES response_answer(id) ON DELETE CASCADE,
    CONSTRAINT fk_rao_option FOREIGN KEY (option_id) REFERENCES quiz_option(id) ON DELETE CASCADE,
    INDEX idx_rao_option (option_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 拆解既有的分號串接答案，比對 label 還原成 option 連結。
-- 這一步本質上是有損的：文字對不上任何選項的答案無法還原——那正是本次要消滅的問題。
-- response_answer.answer 予以保留，作為填答當下的文字快照（見 V4 註解）。
INSERT INTO response_answer_option (answer_id, option_id)
WITH RECURSIVE split_answer AS (
    SELECT ra.id AS answer_id,
           ra.question_id,
           TRIM(SUBSTRING_INDEX(ra.answer, ';', 1)) AS part,
           CASE WHEN LOCATE(';', ra.answer) > 0
                THEN SUBSTRING(ra.answer, LOCATE(';', ra.answer) + 1)
                ELSE NULL END AS rest
    FROM response_answer ra
    JOIN quiz_question q ON q.id = ra.question_id
    WHERE q.type IN ('Q', 'M')
      AND ra.answer IS NOT NULL
      AND TRIM(ra.answer) <> ''
    UNION ALL
    SELECT s.answer_id,
           s.question_id,
           TRIM(SUBSTRING_INDEX(s.rest, ';', 1)),
           CASE WHEN LOCATE(';', s.rest) > 0
                THEN SUBSTRING(s.rest, LOCATE(';', s.rest) + 1)
                ELSE NULL END
    FROM split_answer s
    WHERE s.rest IS NOT NULL
)
SELECT DISTINCT s.answer_id, o.id
FROM split_answer s
JOIN quiz_option o ON o.question_id = s.question_id AND o.label = s.part
WHERE s.part <> '';
