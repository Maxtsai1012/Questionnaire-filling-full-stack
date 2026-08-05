ALTER TABLE quiz
    ADD COLUMN owner_id INT NULL;

ALTER TABLE quiz
    ADD CONSTRAINT fk_quiz_owner
        FOREIGN KEY (owner_id) REFERENCES app_user(id)
        ON DELETE RESTRICT;

CREATE INDEX idx_quiz_owner ON quiz(owner_id);
