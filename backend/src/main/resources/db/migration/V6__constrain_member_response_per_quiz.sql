-- MySQL UNIQUE 允許多筆 NULL，因此 Guest（user_id IS NULL）不受此約束影響。
-- 登入會員則由 (quiz_id, user_id) 保證同一份問卷最多一筆最終填答。
ALTER TABLE quiz_response
    ADD CONSTRAINT uk_quiz_user UNIQUE (quiz_id, user_id);
