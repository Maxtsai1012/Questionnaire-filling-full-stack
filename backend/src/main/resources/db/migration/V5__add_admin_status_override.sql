ALTER TABLE quiz
    ADD COLUMN admin_status_override VARCHAR(32) NULL COMMENT 'ADMIN 手動狀態；NULL 時依發布旗標與日期推算',
    ADD CONSTRAINT ck_quiz_admin_status_override
        CHECK (admin_status_override IS NULL OR admin_status_override IN (
            'UNPUBLISHED', 'NOT_STARTED', 'IN_PROGRESS', 'ENDED'
        ));
