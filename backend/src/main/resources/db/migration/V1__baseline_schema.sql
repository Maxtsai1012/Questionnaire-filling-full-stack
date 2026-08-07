-- Baseline：與既有 init.sql 產生的 schema 完全一致。
-- 既有資料庫由 flyway.baseline-on-migrate 標記為已套用 V1，不會重跑；
-- 全新資料庫則由本檔建表。兩邊自此共用同一條 migration 線。

CREATE TABLE IF NOT EXISTS app_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    token_version INT NOT NULL DEFAULT 0,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    UNIQUE KEY uk_app_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '問卷名稱',
    description TEXT COMMENT '問卷說明',
    start_date DATE NOT NULL COMMENT '開始日期',
    end_date DATE NOT NULL COMMENT '結束日期',
    is_published BOOLEAN DEFAULT FALSE COMMENT '是否發布',
    owner_id INT NULL COMMENT '建立者會員 ID；NULL 為 Legacy/System 問卷',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quiz_dates (start_date, end_date),
    INDEX idx_quiz_published (is_published),
    INDEX idx_quiz_owner (owner_id),
    INDEX idx_quiz_name (name(50)),
    CONSTRAINT fk_quiz_owner FOREIGN KEY (owner_id) REFERENCES app_user(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_question (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    title VARCHAR(500) NOT NULL COMMENT '題目標題',
    type VARCHAR(10) NOT NULL COMMENT '題型: Q (單選), M (多選), T (文字)',
    is_required BOOLEAN DEFAULT FALSE COMMENT '是否必填',
    options JSON COMMENT '選項清單 JSON 陣列',
    sort_order INT DEFAULT 0 COMMENT '排序',
    FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE,
    INDEX idx_question_quiz (quiz_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS quiz_response (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    user_id INT NULL COMMENT '登入會員 ID；訪客為 NULL',
    respondent_name VARCHAR(100) NOT NULL COMMENT '姓名',
    normalized_name VARCHAR(100) NULL,
    phone VARCHAR(20) NOT NULL COMMENT '手機',
    normalized_phone VARCHAR(20) NULL,
    email VARCHAR(255) NOT NULL COMMENT 'Email',
    age INT COMMENT '年齡',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_user(id),
    UNIQUE KEY uk_quiz_email (quiz_id, email),
    INDEX idx_response_quiz (quiz_id, id DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS response_answer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    response_id INT NOT NULL,
    question_id INT NOT NULL,
    answer TEXT COMMENT '回答內容, 多選用分號 (;) 分隔',
    FOREIGN KEY (response_id) REFERENCES quiz_response(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES quiz_question(id) ON DELETE CASCADE,
    INDEX idx_answer_question (question_id),
    INDEX idx_answer_response (response_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
