SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 建立資料庫
CREATE DATABASE IF NOT EXISTS survey_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE survey_db;

-- 刪除舊表 (若存在)
DROP TABLE IF EXISTS response_answer;
DROP TABLE IF EXISTS quiz_response;
DROP TABLE IF EXISTS quiz_question;
DROP TABLE IF EXISTS quiz;
DROP TABLE IF EXISTS app_user;

CREATE TABLE app_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    birthday DATE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    token_version INT NOT NULL DEFAULT 0,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    UNIQUE KEY uk_app_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1. 問卷主表
CREATE TABLE quiz (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '問卷名稱',
    description TEXT COMMENT '問卷說明',
    start_date DATE NOT NULL COMMENT '開始日期',
    end_date DATE NOT NULL COMMENT '結束日期',
    is_published BOOLEAN DEFAULT FALSE COMMENT '是否發布 (true: 發布, false: 僅儲存草稿)',
    owner_id INT NULL COMMENT '建立者會員 ID；NULL 為 Legacy/System 問卷',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_quiz_dates (start_date, end_date),
    INDEX idx_quiz_published (is_published),
    INDEX idx_quiz_owner (owner_id),
    INDEX idx_quiz_name (name(50)),
    CONSTRAINT fk_quiz_owner FOREIGN KEY (owner_id) REFERENCES app_user(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 問卷題目表
CREATE TABLE quiz_question (
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

-- 3. 填答紀錄表
CREATE TABLE quiz_response (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    user_id INT NULL COMMENT '登入會員 ID；訪客為 NULL',
    respondent_name VARCHAR(100) NOT NULL COMMENT '姓名',
    normalized_name VARCHAR(100) NULL COMMENT '訪客正規化姓名；會員為 NULL',
    phone VARCHAR(20) NOT NULL COMMENT '手機',
    normalized_phone VARCHAR(20) NULL COMMENT '訪客正規化手機；會員為 NULL',
    email VARCHAR(255) NOT NULL COMMENT 'Email',
    age INT COMMENT '年齡',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quiz(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_user(id),
    UNIQUE KEY uk_quiz_email (quiz_id, email),
    INDEX idx_response_quiz (quiz_id, id DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 回答明細表
CREATE TABLE response_answer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    response_id INT NOT NULL,
    question_id INT NOT NULL,
    answer TEXT COMMENT '回答內容, 多選用分號 (;) 分隔',
    FOREIGN KEY (response_id) REFERENCES quiz_response(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES quiz_question(id) ON DELETE CASCADE,
    INDEX idx_answer_question (question_id),
    INDEX idx_answer_response (response_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入測試問卷資料
INSERT INTO quiz (id, name, description, start_date, end_date, is_published)
VALUES 
(1, '青春洋溢高中生人氣投票戰', '測試問卷描述：歡迎參加高中生人氣選拔，請踴躍投票支持你心目中的優秀候選人！', '2023-08-12', '2030-12-31', TRUE),
(2, '2026 尾牙餐廳意向預選', '請各位同仁協助填寫今年公司尾牙希望舉辦的餐廳地點與飲食偏好。', '2026-01-01', '2026-12-31', TRUE),
(3, '未發佈產品市場滿意度調查草稿', '此為測試草稿問卷，目前設定為未發佈狀態。', '2026-08-01', '2026-09-30', FALSE);

-- 插入問卷題目
INSERT INTO quiz_question (id, quiz_id, title, type, is_required, options, sort_order)
VALUES 
(1, 1, '請選取最喜歡的人（必填）', 'Q', TRUE, '[{"optionName": "何厝科（建國中學）", "code": 0}, {"optionName": "t7/77（金瓶女中）", "code": 1}, {"optionName": "wen wen（金門國中）", "code": 2}, {"optionName": "ui ly（鳳翔高中）", "code": 3}]', 1),
(2, 1, '請說明理由', 'T', FALSE, NULL, 2),
(3, 1, '請選取在活動開始前所有認識的人（必填）', 'M', TRUE, '[{"optionName": "何厝科（建國中學）", "code": 0}, {"optionName": "t7/77（金瓶女中）", "code": 1}, {"optionName": "wen wen（金門國中）", "code": 2}, {"optionName": "ui ly（鳳翔高中）", "code": 3}]', 3),
(4, 2, '偏好的料理風格', 'M', TRUE, '[{"optionName": "日式料理", "code": 0}, {"optionName": "美式烤肉", "code": 1}, {"optionName": "法式無菜單", "code": 2}, {"optionName": "台菜海鮮", "code": 3}]', 1),
(5, 2, '任何寶貴建議', 'T', FALSE, NULL, 2);

-- 插入測試填答資料
INSERT INTO quiz_response (id, quiz_id, respondent_name, normalized_name, phone, normalized_phone, email, age, submitted_at)
VALUES 
(1, 1, '王大明', '王大明', '0900000000', '0900000000', 'happyhappyhappy@gmail.com', 23, '2026-08-02 12:30:00'),
(2, 1, '徐小花', '徐小花', '0911222333', '0911222333', 'hsu_flower@example.com', 20, '2026-08-02 13:45:00'),
(3, 1, '黃阿狗', '黃阿狗', '0988777666', '0988777666', 'doggy_yellow@example.com', 25, '2026-08-02 14:20:00');

INSERT INTO response_answer (response_id, question_id, answer)
VALUES 
(1, 1, '何厝科（建國中學）'),
(1, 2, '很久以前就認識了，覺得他人超好相處'),
(1, 3, '何厝科（建國中學）;wen wen（金門國中）'),
(2, 1, 't7/77（金瓶女中）'),
(2, 2, '美麗又親切！'),
(2, 3, 't7/77（金瓶女中）;ui ly（鳳翔高中）'),
(3, 1, '何厝科（建國中學）'),
(3, 2, '熱情有活力！'),
(3, 3, '何厝科（建國中學）;t7/77（金瓶女中）;ui ly（鳳翔高中）');
