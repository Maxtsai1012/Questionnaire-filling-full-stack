ALTER TABLE app_user
    ADD COLUMN birthday DATE NULL AFTER phone;

UPDATE app_user
SET birthday = '2022-10-28'
WHERE birthday IS NULL;

ALTER TABLE app_user
    MODIFY COLUMN birthday DATE NOT NULL;
