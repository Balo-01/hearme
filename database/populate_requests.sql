-- Seed 3 requests of each type for every patient (9 requests per patient)

INSERT INTO requests (patient_id, request_date, request_type, description)
WITH request_types AS (
	SELECT 'basic_needs' AS request_type, 1 AS type_order FROM dual
	UNION ALL
	SELECT 'communication' AS request_type, 2 AS type_order FROM dual
	UNION ALL
	SELECT 'pain' AS request_type, 3 AS type_order FROM dual
),
occurrences AS (
	SELECT 1 AS occurrence_no FROM dual
	UNION ALL
	SELECT 2 AS occurrence_no FROM dual
	UNION ALL
	SELECT 3 AS occurrence_no FROM dual
)
SELECT
	p.id,
	SYSTIMESTAMP - NUMTODSINTERVAL((rt.type_order * 10) + o.occurrence_no, 'HOUR'),
	rt.request_type,
	CASE rt.request_type
		WHEN 'basic_needs' THEN 'Basic needs request #' || o.occurrence_no || ': assistance with meal and hydration'
		WHEN 'communication' THEN 'Communication request #' || o.occurrence_no || ': support to contact family'
		WHEN 'pain' THEN 'Pain request #' || o.occurrence_no || ': reports discomfort and asks for evaluation'
	END
FROM patients p
CROSS JOIN request_types rt
CROSS JOIN occurrences o;

COMMIT;