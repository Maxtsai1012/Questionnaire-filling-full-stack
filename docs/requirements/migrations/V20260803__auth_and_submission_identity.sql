USE survey_db;

-- Email 去重沿用既有規則；執行前確認現有資料沒有同問卷重複 Email。
SELECT quiz_id, LOWER(TRIM(email)) AS normalized_email, COUNT(*) AS duplicate_count
FROM quiz_response
GROUP BY quiz_id, normalized_email
HAVING COUNT(*) > 1;

CREATE TABLE IF NOT EXISTS app_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(64) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    UNIQUE KEY uk_app_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE quiz_response
    ADD COLUMN user_id INT NULL AFTER quiz_id,
    ADD COLUMN normalized_name VARCHAR(100) NULL AFTER respondent_name,
    ADD COLUMN normalized_phone VARCHAR(20) NULL AFTER phone;

UPDATE quiz_response
SET normalized_name = LOWER(TRIM(REGEXP_REPLACE(respondent_name, '[[:space:]]+', ' '))),
    normalized_phone = REGEXP_REPLACE(phone, '[[:space:]-]', '')
WHERE normalized_name IS NULL OR normalized_phone IS NULL;

ALTER TABLE quiz_response
    ADD CONSTRAINT fk_response_user FOREIGN KEY (user_id) REFERENCES app_user(id);

-- 將指定帳號升級為管理員（先透過註冊 API 建立帳號，再替換 Email 執行）：
-- UPDATE app_user SET role = 'ADMIN' WHERE email = 'admin@example.com';
