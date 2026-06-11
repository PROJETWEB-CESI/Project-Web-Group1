-- Executive demo data: extra students/grades/attendance/payments for
-- CAMP002 (Lyon Confluence), CAMP003 (Toulouse Aerospace) and
-- CAMP004 (Marseille Mediterranean) so the executive cross-campus
-- dashboards have meaningful, non-sparse data to compare.
-- 28 students (STU033-STU060), continuing IDs from seed_extra_students.sql.

-- ── 1. Students ──────────────────────────────────────────────────────────────
INSERT INTO students (student_id, first_name, last_name, email, phone, date_of_birth,
    campus_id, program_id, enrollment_year, status, payment_status)
VALUES
  ('STU033','Emma',    'Lefevre',  'emma.lefevre@novacampus.fr',   '0601000033','2002-02-14','CAMP002','PROG006',2022,'Active',  'Up to date'),
  ('STU034','Hugo',    'Martin',   'hugo.martin@novacampus.fr',    '0601000034','2001-06-21','CAMP002','PROG006',2022,'Active',  'Up to date'),
  ('STU035','Manon',   'Petit',    'manon.petit@novacampus.fr',    '0601000035','2002-09-30','CAMP002','PROG006',2023,'Active',  'Up to date'),
  ('STU036','Lucas',   'Roux',     'lucas.roux@novacampus.fr',     '0601000036','2002-04-12','CAMP002','PROG006',2023,'Active',  'Up to date'),
  ('STU037','Chloe',   'Simon',    'chloe.simon@novacampus.fr',    '0601000037','2003-01-08','CAMP002','PROG006',2024,'Active',  'Up to date'),
  ('STU038','Mathis',  'Michel',   'mathis.michel@novacampus.fr',  '0601000038','2001-11-25','CAMP002','PROG006',2021,'Inactive','Up to date'),
  ('STU039','Sarah',   'Garcia',   'sarah.garcia@novacampus.fr',   '0601000039','2002-07-17','CAMP002','PROG007',2022,'Active',  'Up to date'),
  ('STU040','Enzo',    'Bertrand', 'enzo.bertrand@novacampus.fr',  '0601000040','2002-03-04','CAMP002','PROG007',2023,'Active',  'Delay'),
  ('STU041','Jade',    'Roussel',  'jade.roussel@novacampus.fr',   '0601000041','2003-05-19','CAMP002','PROG007',2023,'Active',  'Up to date'),
  ('STU042','Nathan',  'Faure',    'nathan.faure@novacampus.fr',   '0601000042','2002-12-02','CAMP002','PROG007',2024,'Active',  'Up to date'),
  ('STU043','Lea',     'Andre',    'lea.andre@novacampus.fr',      '0601000043','2003-08-27','CAMP002','PROG007',2024,'Active',  'Up to date'),
  ('STU044','Gabriel', 'Mathieu',  'gabriel.mathieu@novacampus.fr','0601000044','2001-10-09','CAMP002','PROG007',2022,'Inactive','Delay'),

  ('STU045','Louis',   'Vincent',  'louis.vincent@novacampus.fr',  '0601000045','2002-01-22','CAMP003','PROG004',2022,'Active',  'Up to date'),
  ('STU046','Zoe',     'Lefebvre', 'zoe.lefebvre@novacampus.fr',   '0601000046','2002-06-11','CAMP003','PROG004',2022,'Active',  'Up to date'),
  ('STU047','Tom',     'Masson',   'tom.masson@novacampus.fr',     '0601000047','2002-09-03','CAMP003','PROG004',2023,'Active',  'Up to date'),
  ('STU048','Eva',     'Dubois',   'eva.dubois@novacampus.fr',     '0601000048','2003-02-26','CAMP003','PROG004',2023,'Active',  'Delay'),
  ('STU049','Noah',    'Marchand', 'noah.marchand@novacampus.fr',  '0601000049','2002-04-30','CAMP003','PROG004',2023,'Active',  'Up to date'),
  ('STU050','Alice',   'Lacroix',  'alice.lacroix@novacampus.fr',  '0601000050','2003-07-14','CAMP003','PROG004',2024,'Active',  'Up to date'),
  ('STU051','Adam',    'Caron',    'adam.caron@novacampus.fr',     '0601000051','2002-11-08','CAMP003','PROG004',2024,'Active',  'Up to date'),
  ('STU052','Jules',   'Lemoine',  'jules.lemoine@novacampus.fr',  '0601000052','2003-03-16','CAMP003','PROG004',2024,'Active',  'Up to date'),
  ('STU053','Lina',    'Fournier', 'lina.fournier@novacampus.fr',  '0601000053','2003-12-05','CAMP003','PROG004',2025,'Active',  'Up to date'),
  ('STU054','Arthur',  'Giraud',   'arthur.giraud@novacampus.fr',  '0601000054','2001-05-29','CAMP003','PROG004',2021,'Inactive','Up to date'),

  ('STU055','Mila',    'Bourgeois','mila.bourgeois@novacampus.fr', '0601000055','2002-08-13','CAMP004','PROG005',2022,'Active',  'Up to date'),
  ('STU056','Ethan',   'Royer',    'ethan.royer@novacampus.fr',    '0601000056','2002-02-21','CAMP004','PROG005',2023,'Active',  'Up to date'),
  ('STU057','Lou',     'Brunet',   'lou.brunet@novacampus.fr',     '0601000057','2003-04-09','CAMP004','PROG005',2023,'Active',  'Delay'),
  ('STU058','Liam',    'Renard',   'liam.renard@novacampus.fr',    '0601000058','2002-10-17','CAMP004','PROG005',2024,'Active',  'Up to date'),
  ('STU059','Sacha',   'Colin',    'sacha.colin@novacampus.fr',    '0601000059','2003-01-31','CAMP004','PROG005',2024,'Active',  'Up to date'),
  ('STU060','Anna',    'Le Goff',  'anna.legoff@novacampus.fr',    '0601000060','2001-09-06','CAMP004','PROG005',2021,'Inactive','Up to date')
ON CONFLICT (student_id) DO NOTHING;

-- ── 2. IAM users (same password hash as student@test.com) ────────────────────
INSERT INTO users (id, email, "passwordHash", role, "campusId", "studentId", "firstName", "lastName", status, "createdAt", "updatedAt")
SELECT gen_random_uuid(), s.email, '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC', 'student', s.campus_id, s.student_id, s.first_name, s.last_name,
       CASE WHEN s.status = 'Active' THEN 'active' ELSE 'inactive' END, NOW(), NOW()
FROM students s
WHERE s.student_id BETWEEN 'STU033' AND 'STU060'
ON CONFLICT (email) DO NOTHING;

-- ── 3. Enrollments ─────────────────────────────────────────────────────────
WITH course_map(program_id, course_id, semester, academic_year, enroll_date) AS (VALUES
    ('PROG006','CRS005',1,'2024-2025','2024-09-02'::date),
    ('PROG006','CRS007',2,'2024-2025','2025-01-13'::date),
    ('PROG006','CRS010',1,'2025-2026','2025-09-01'::date),
    ('PROG007','CRS004',1,'2024-2025','2024-09-02'::date),
    ('PROG007','CRS001',2,'2024-2025','2025-01-13'::date),
    ('PROG007','CRS002',1,'2025-2026','2025-09-01'::date),
    ('PROG004','CRS006',1,'2024-2025','2024-09-02'::date),
    ('PROG004','CRS003',2,'2024-2025','2025-01-13'::date),
    ('PROG004','CRS009',1,'2025-2026','2025-09-01'::date),
    ('PROG005','CRS008',1,'2024-2025','2024-09-02'::date),
    ('PROG005','CRS001',2,'2024-2025','2025-01-13'::date),
    ('PROG005','CRS004',1,'2025-2026','2025-09-01'::date)
),
student_list AS (
    SELECT student_id, program_id FROM students WHERE student_id BETWEEN 'STU033' AND 'STU060'
),
cross_joined AS (
    SELECT
        'ENR' || LPAD((215 + ROW_NUMBER() OVER (ORDER BY s.student_id, c.course_id))::TEXT, 3, '0') AS enrollment_id,
        s.student_id,
        c.course_id,
        c.semester,
        c.academic_year,
        CASE WHEN c.academic_year < '2025-2026' THEN 'Validated' ELSE 'In Progress' END AS status,
        ROUND((78 + random() * 20)::numeric, 1) AS attendance_rate,
        c.enroll_date
    FROM student_list s JOIN course_map c ON c.program_id = s.program_id
)
INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, academic_year,
    status, final_grade, attendance_rate, enrollment_date)
SELECT enrollment_id, student_id, course_id, semester, academic_year,
    status, NULL, attendance_rate, enroll_date
FROM cross_joined
ON CONFLICT (enrollment_id) DO NOTHING;

-- ── 4. Grades (published, weighted average + success rate) ───────────────────
WITH course_map(program_id, course_id, campus_id) AS (VALUES
    ('PROG006','CRS005','CAMP002'),
    ('PROG006','CRS007','CAMP002'),
    ('PROG006','CRS010','CAMP002'),
    ('PROG007','CRS004','CAMP002'),
    ('PROG007','CRS001','CAMP002'),
    ('PROG007','CRS002','CAMP002'),
    ('PROG004','CRS006','CAMP003'),
    ('PROG004','CRS003','CAMP003'),
    ('PROG004','CRS009','CAMP003'),
    ('PROG005','CRS008','CAMP004'),
    ('PROG005','CRS001','CAMP004'),
    ('PROG005','CRS004','CAMP004')
),
student_list AS (
    SELECT student_id, program_id FROM students WHERE student_id BETWEEN 'STU033' AND 'STU060'
),
evaluations(evaluation_name, evaluation_name_en, coefficient, evaluation_date, score_min, score_range) AS (VALUES
    ('Quiz 1',                 'Quiz 1',              1, '2024-10-14'::date,  8.0, 8.0),
    ('Examen final',           'Final exam',          2, '2024-12-09'::date,  9.0, 9.0)
)
INSERT INTO grades (student_id, course_id, campus_id, evaluation_name, evaluation_name_en, score, score_max, coefficient, evaluation_date, published_at)
SELECT s.student_id, c.course_id, c.campus_id, e.evaluation_name, e.evaluation_name_en,
       ROUND((e.score_min + random() * e.score_range)::numeric, 1), 20, e.coefficient, e.evaluation_date, '2024-12-20 10:00:00'::timestamp
FROM student_list s
JOIN course_map c ON c.program_id = s.program_id
CROSS JOIN evaluations e;

-- ── 5. Attendances (5 sessions per course, mostly present) ───────────────────
WITH course_map(program_id, course_id, campus_id) AS (VALUES
    ('PROG006','CRS005','CAMP002'),
    ('PROG006','CRS007','CAMP002'),
    ('PROG006','CRS010','CAMP002'),
    ('PROG007','CRS004','CAMP002'),
    ('PROG007','CRS001','CAMP002'),
    ('PROG007','CRS002','CAMP002'),
    ('PROG004','CRS006','CAMP003'),
    ('PROG004','CRS003','CAMP003'),
    ('PROG004','CRS009','CAMP003'),
    ('PROG005','CRS008','CAMP004'),
    ('PROG005','CRS001','CAMP004'),
    ('PROG005','CRS004','CAMP004')
),
student_list AS (
    SELECT student_id, program_id FROM students WHERE student_id BETWEEN 'STU033' AND 'STU060'
),
sessions AS (
    SELECT generate_series(1, 5) AS session_no
)
INSERT INTO attendances (student_id, course_id, campus_id, session_date, status, justified)
SELECT s.student_id, c.course_id, c.campus_id,
       ('2024-10-01'::date + (sess.session_no * 7) * INTERVAL '1 day')::date,
       CASE
           WHEN random() < 0.83 THEN 'present'
           WHEN random() < 0.5 THEN 'late'
           ELSE 'absent'
       END,
       false
FROM student_list s
JOIN course_map c ON c.program_id = s.program_id
CROSS JOIN sessions sess
ON CONFLICT (student_id, course_id, session_date) DO NOTHING;

-- ── 6. Payments (semester invoices, mix of Paid / Delay) ──────────────────────
INSERT INTO payments (payment_id, student_id, invoice_date, due_date, amount, status, payment_date, payment_method, academic_year, semester, notes, notes_en)
VALUES
  ('PAY013','STU033','2024-08-01','2024-09-15',6500.00,'Paid', '2024-09-10','Bank Transfer','2024-2025',1,'Semestre 1','Semester 1'),
  ('PAY014','STU039','2024-08-01','2024-09-15',4000.00,'Paid', '2024-09-12','Credit card',  '2024-2025',1,'Semestre 1','Semester 1'),
  ('PAY015','STU040','2024-08-01','2024-09-15',4000.00,'Delay', NULL,        'Bank Transfer','2024-2025',1,'Relance niveau 2','Second-level reminder'),
  ('PAY016','STU044','2024-08-01','2024-09-15',4000.00,'Delay', NULL,        'Bank Transfer','2024-2025',1,'Relance niveau 3','Third-level reminder'),
  ('PAY017','STU045','2024-08-01','2024-09-15',4750.00,'Paid', '2024-09-08','Bank Transfer','2024-2025',1,'Semestre 1','Semester 1'),
  ('PAY018','STU048','2024-08-01','2024-09-15',4750.00,'Delay', NULL,        'Credit card',  '2024-2025',1,'Relance niveau 1','First-level reminder'),
  ('PAY019','STU055','2024-08-01','2024-09-15',3750.00,'Paid', '2024-09-09','Bank Transfer','2024-2025',1,'Semestre 1','Semester 1'),
  ('PAY020','STU057','2024-08-01','2024-09-15',3750.00,'Delay', NULL,        'Bank Transfer','2024-2025',1,'Relance niveau 1','First-level reminder')
ON CONFLICT (payment_id) DO NOTHING;
