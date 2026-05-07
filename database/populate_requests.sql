-- Seed one request of each type for every patient (3 requests per patient)

INSERT INTO requests (patient_id, request_date, request_type, description, path, status, dismissed_at)
WITH request_types AS (
	SELECT 'basic_needs' AS request_type, 1 AS type_order FROM dual
	UNION ALL
	SELECT 'communication' AS request_type, 2 AS type_order FROM dual
	UNION ALL
	SELECT 'pain' AS request_type, 3 AS type_order FROM dual
)
SELECT
	p.id,
	SYSTIMESTAMP - NUMTODSINTERVAL(rt.type_order * 10, 'HOUR'),
	rt.request_type,
	CASE rt.request_type
		WHEN 'basic_needs' THEN 'food'
		WHEN 'communication' THEN 'call family'
		WHEN 'pain' THEN 'head-mild-pain'
	END,
	NULL,
	'active',
	NULL
FROM patients p
CROSS JOIN request_types rt;

COMMIT;