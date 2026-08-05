-- 展示／開發用的種子資料。
--
-- 這個資料夾「不在」預設的 flyway.locations 裡，只有把 SPRING_FLYWAY_LOCATIONS 設成
-- classpath:db/migration,classpath:db/seed 時才會執行（見 docker-compose.yml），
-- 正式環境不會被塞進假資料。
-- 版號從 900 起跳，避免和正規 migration 的版號相撞。

INSERT INTO quiz (id, name, description, start_date, end_date, is_published) VALUES
(1, '青春洋溢高中生人氣投票戰', '測試問卷描述：歡迎參加高中生人氣選拔，請踴躍投票支持你心目中的優秀候選人！', '2023-08-12', '2030-12-31', TRUE),
(2, '2026 尾牙餐廳意向預選', '請各位同仁協助填寫今年公司尾牙希望舉辦的餐廳地點與飲食偏好。', '2026-01-01', '2026-12-31', TRUE),
(3, '未發佈產品市場滿意度調查草稿', '此為測試草稿問卷，目前設定為未發佈狀態。', '2026-08-01', '2026-09-30', FALSE);

INSERT INTO quiz_question (id, quiz_id, title, type, is_required, sort_order) VALUES
(1, 1, '請選取最喜歡的人（必填）', 'Q', TRUE, 1),
(2, 1, '請說明理由', 'T', FALSE, 2),
(3, 1, '請選取在活動開始前所有認識的人（必填）', 'M', TRUE, 3),
(4, 2, '偏好的料理風格', 'M', TRUE, 1),
(5, 2, '任何寶貴建議', 'T', FALSE, 2);

INSERT INTO quiz_option (question_id, code, label, sort_order) VALUES
(1, 0, '何厝科（建國中學）', 0),
(1, 1, 't7/77（金瓶女中）', 1),
(1, 2, 'wen wen（金門國中）', 2),
(1, 3, 'ui ly（鳳翔高中）', 3),
(3, 0, '何厝科（建國中學）', 0),
(3, 1, 't7/77（金瓶女中）', 1),
(3, 2, 'wen wen（金門國中）', 2),
(3, 3, 'ui ly（鳳翔高中）', 3),
(4, 0, '日式料理', 0),
(4, 1, '美式烤肉', 1),
(4, 2, '法式無菜單', 2),
(4, 3, '台菜海鮮', 3);

-- Email 一律小寫，與應用層寫入時的正規化一致
INSERT INTO quiz_response (id, quiz_id, respondent_name, phone, email, age, submitted_at) VALUES
(1, 1, '王大明', '0900000000', 'happyhappyhappy@gmail.com', 23, '2026-08-02 12:30:00'),
(2, 1, '徐小花', '0911222333', 'hsu_flower@example.com', 20, '2026-08-02 13:45:00'),
(3, 1, '黃阿狗', '0988777666', 'doggy_yellow@example.com', 25, '2026-08-02 14:20:00');

-- 選擇題的 answer 欄位是填答當下的文字快照；作為統計依據的是 response_answer_option
INSERT INTO response_answer (id, response_id, question_id, answer) VALUES
(1, 1, 1, '何厝科（建國中學）'),
(2, 1, 2, '很久以前就認識了，覺得他人超好相處'),
(3, 1, 3, '何厝科（建國中學）、wen wen（金門國中）'),
(4, 2, 1, 't7/77（金瓶女中）'),
(5, 2, 2, '美麗又親切！'),
(6, 2, 3, 't7/77（金瓶女中）、ui ly（鳳翔高中）'),
(7, 3, 1, '何厝科（建國中學）'),
(8, 3, 2, '熱情有活力！'),
(9, 3, 3, '何厝科（建國中學）、t7/77（金瓶女中）、ui ly（鳳翔高中）');

INSERT INTO response_answer_option (answer_id, option_id)
SELECT ra.id, o.id FROM response_answer ra JOIN quiz_option o ON o.question_id = ra.question_id
WHERE (ra.id, o.code) IN ((1,0), (3,0), (3,2), (4,1), (6,1), (6,3), (7,0), (9,0), (9,1), (9,3));
