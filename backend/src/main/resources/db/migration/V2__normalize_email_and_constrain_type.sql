-- Email 去重原本疊三層：DB unique、repository 的 IgnoreCase 查詢、service 的 toLowerCase。
-- 而 DB 那層能擋大小寫是「碰巧」靠 utf8mb4_unicode_ci 這個不分大小寫的 collation。
-- 改成寫入前就存小寫，uk_quiz_email / uk_app_user_email 便回歸成單純的唯一鍵，
-- 不再依賴 collation 的隱含行為。

UPDATE app_user SET email = LOWER(TRIM(email)) WHERE email <> LOWER(TRIM(email));
UPDATE quiz_response SET email = LOWER(TRIM(email)) WHERE email <> LOWER(TRIM(email));

-- 題型原本只由應用層的 QuestionType.fromCode 把關，而它對無效值是回傳 null 而非拋錯，
-- 等於 DB 可以塞進任何字串。
ALTER TABLE quiz_question
    ADD CONSTRAINT ck_question_type CHECK (type IN ('Q', 'M', 'T'));
