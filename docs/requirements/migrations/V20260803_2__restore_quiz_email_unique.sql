USE survey_db;

-- 僅適用於已執行舊版身分去重 migration 的資料庫。
-- 若第一段查詢有結果，必須先人工處理重複 Email，不得直接刪除資料。
SELECT quiz_id, LOWER(TRIM(email)) AS normalized_email, COUNT(*) AS duplicate_count
FROM quiz_response
GROUP BY quiz_id, normalized_email
HAVING COUNT(*) > 1;

ALTER TABLE quiz_response
    DROP INDEX uk_quiz_user,
    DROP INDEX uk_quiz_guest_identity,
    ADD UNIQUE KEY uk_quiz_email (quiz_id, email);
