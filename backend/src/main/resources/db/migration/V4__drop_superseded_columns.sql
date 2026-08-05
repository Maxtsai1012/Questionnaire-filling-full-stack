-- quiz_question.options 已完整攤平到 quiz_option（JSON 轉列是無損的），移除以免兩份選項定義並存。
ALTER TABLE quiz_question DROP COLUMN options;

-- normalized_name / normalized_phone 是只寫不讀的欄位：applyIdentity 會在訪客填答時寫入，
-- 但整個 codebase 沒有任何查詢或約束讀取它們。原意應是「訪客用姓名+電話去重」，
-- 但實際去重只看 email。留著只會讓人誤以為有這層防護。
ALTER TABLE quiz_response
    DROP COLUMN normalized_name,
    DROP COLUMN normalized_phone;

-- response_answer.answer 刻意保留：
--   文字題 → 這就是答案本身
--   選擇題 → 填答當下看到的文字快照。選項 label 之後可能被改，快照記錄的是使用者
--            實際點下去的內容，與 response_answer_option 的正規化連結互補而非重複。
ALTER TABLE response_answer
    MODIFY COLUMN answer TEXT COMMENT '文字題答案；選擇題為填答當下的文字快照（正規化連結見 response_answer_option）';
