-- Extend requests for the FastAPI active request workflow.
-- Safe to run multiple times.

DECLARE
    column_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO column_count
    FROM user_tab_columns
    WHERE table_name = 'REQUESTS'
      AND column_name = 'PATH';

    IF column_count = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE requests ADD (path CLOB)';
    END IF;
END;
/

DECLARE
    column_count NUMBER;
    column_nullable VARCHAR2(1);
BEGIN
    SELECT COUNT(*)
    INTO column_count
    FROM user_tab_columns
    WHERE table_name = 'REQUESTS'
      AND column_name = 'STATUS';

    IF column_count = 0 THEN
        EXECUTE IMMEDIATE q'[ALTER TABLE requests ADD (status VARCHAR2(20) DEFAULT 'active' NOT NULL)]';
    ELSE
        EXECUTE IMMEDIATE q'[UPDATE requests SET status = 'active' WHERE status IS NULL]';
        EXECUTE IMMEDIATE q'[ALTER TABLE requests MODIFY (status DEFAULT 'active')]';

        SELECT nullable
        INTO column_nullable
        FROM user_tab_columns
        WHERE table_name = 'REQUESTS'
          AND column_name = 'STATUS';

        IF column_nullable = 'Y' THEN
            EXECUTE IMMEDIATE 'ALTER TABLE requests MODIFY (status NOT NULL)';
        END IF;
    END IF;
END;
/

DECLARE
    column_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO column_count
    FROM user_tab_columns
    WHERE table_name = 'REQUESTS'
      AND column_name = 'DISMISSED_AT';

    IF column_count = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE requests ADD (dismissed_at TIMESTAMP)';
    END IF;
END;
/

COMMIT;
