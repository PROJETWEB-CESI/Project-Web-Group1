-- Extra students for rank & class-average testing
-- 20 students (STU013-STU032) at CAMP001 / PROG001, same courses as STU001

-- ── 1. Students ──────────────────────────────────────────────────────────────
INSERT INTO students (student_id, first_name, last_name, email, phone, date_of_birth,
    campus_id, program_id, enrollment_year, status, payment_status)
VALUES
  ('STU013','Marie',    'Dupont',   'marie.dupont@novacampus.fr',    '0601000013','2003-03-11','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU014','Antoine',  'Leroy',    'antoine.leroy@novacampus.fr',   '0601000014','2002-07-25','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU015','Camille',  'Girard',   'camille.girard@novacampus.fr',  '0601000015','2003-01-09','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU016','Nicolas',  'Fontaine', 'nicolas.fontaine@novacampus.fr','0601000016','2002-11-30','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU017','Sophie',   'Renaud',   'sophie.renaud@novacampus.fr',   '0601000017','2003-05-14','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU018','Julien',   'Blanc',    'julien.blanc@novacampus.fr',    '0601000018','2002-09-03','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU019','Laura',    'Morel',    'laura.morel@novacampus.fr',     '0601000019','2003-06-22','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU020','Pierre',   'Chevalier','pierre.chevalier@novacampus.fr','0601000020','2002-12-17','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU021','Celine',   'Perrin',   'celine.perrin@novacampus.fr',   '0601000021','2003-02-28','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU022','Maxime',   'Denis',    'maxime.denis@novacampus.fr',    '0601000022','2002-08-05','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU023','Lucie',    'Mercier',  'lucie.mercier@novacampus.fr',   '0601000023','2003-04-16','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU024','Romain',   'Guerin',   'romain.guerin@novacampus.fr',   '0601000024','2002-10-08','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU025','Pauline',  'Lemaire',  'pauline.lemaire@novacampus.fr', '0601000025','2003-07-19','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU026','Tristan',  'Gauthier', 'tristan.gauthier@novacampus.fr','0601000026','2002-05-27','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU027','Anais',    'Robin',    'anais.robin@novacampus.fr',     '0601000027','2003-09-01','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU028','Baptiste', 'Clement',  'baptiste.clement@novacampus.fr','0601000028','2002-06-13','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU029','Ines',     'Nguyen',   'ines.nguyen@novacampus.fr',     '0601000029','2003-08-24','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU030','Florian',  'Rousseau', 'florian.rousseau@novacampus.fr','0601000030','2002-04-07','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU031','Charlotte','Bonnet',   'charlotte.bonnet@novacampus.fr','0601000031','2003-10-15','CAMP001','PROG001',2023,'Active','Up to date'),
  ('STU032','Theo',     'Lambert',  'theo.lambert@novacampus.fr',    '0601000032','2002-03-21','CAMP001','PROG001',2023,'Active','Up to date')
ON CONFLICT (student_id) DO NOTHING;

-- ── 2. IAM users (same password hash as student@test.com) ────────────────────
INSERT INTO users (id, email, "passwordHash", role, "campusId", "studentId", "firstName", "lastName", status, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(),'marie.dupont@novacampus.fr',    '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU013','Marie',    'Dupont',   'active',NOW(),NOW()),
  (gen_random_uuid(),'antoine.leroy@novacampus.fr',   '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU014','Antoine',  'Leroy',    'active',NOW(),NOW()),
  (gen_random_uuid(),'camille.girard@novacampus.fr',  '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU015','Camille',  'Girard',   'active',NOW(),NOW()),
  (gen_random_uuid(),'nicolas.fontaine@novacampus.fr','$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU016','Nicolas',  'Fontaine', 'active',NOW(),NOW()),
  (gen_random_uuid(),'sophie.renaud@novacampus.fr',   '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU017','Sophie',   'Renaud',   'active',NOW(),NOW()),
  (gen_random_uuid(),'julien.blanc@novacampus.fr',    '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU018','Julien',   'Blanc',    'active',NOW(),NOW()),
  (gen_random_uuid(),'laura.morel@novacampus.fr',     '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU019','Laura',    'Morel',    'active',NOW(),NOW()),
  (gen_random_uuid(),'pierre.chevalier@novacampus.fr','$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU020','Pierre',   'Chevalier','active',NOW(),NOW()),
  (gen_random_uuid(),'celine.perrin@novacampus.fr',   '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU021','Celine',   'Perrin',   'active',NOW(),NOW()),
  (gen_random_uuid(),'maxime.denis@novacampus.fr',    '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU022','Maxime',   'Denis',    'active',NOW(),NOW()),
  (gen_random_uuid(),'lucie.mercier@novacampus.fr',   '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU023','Lucie',    'Mercier',  'active',NOW(),NOW()),
  (gen_random_uuid(),'romain.guerin@novacampus.fr',   '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU024','Romain',   'Guerin',   'active',NOW(),NOW()),
  (gen_random_uuid(),'pauline.lemaire@novacampus.fr', '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU025','Pauline',  'Lemaire',  'active',NOW(),NOW()),
  (gen_random_uuid(),'tristan.gauthier@novacampus.fr','$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU026','Tristan',  'Gauthier', 'active',NOW(),NOW()),
  (gen_random_uuid(),'anais.robin@novacampus.fr',     '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU027','Anais',    'Robin',    'active',NOW(),NOW()),
  (gen_random_uuid(),'baptiste.clement@novacampus.fr','$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU028','Baptiste', 'Clement',  'active',NOW(),NOW()),
  (gen_random_uuid(),'ines.nguyen@novacampus.fr',     '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU029','Ines',     'Nguyen',   'active',NOW(),NOW()),
  (gen_random_uuid(),'florian.rousseau@novacampus.fr','$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU030','Florian',  'Rousseau', 'active',NOW(),NOW()),
  (gen_random_uuid(),'charlotte.bonnet@novacampus.fr','$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU031','Charlotte','Bonnet',   'active',NOW(),NOW()),
  (gen_random_uuid(),'theo.lambert@novacampus.fr',    '$2b$10$eQGIlc0F6PrTFHlvScLRSODsuafhiXXGKtDQZESwYPTCm.2UngnlC','student','CAMP001','STU032','Theo',     'Lambert',  'active',NOW(),NOW())
ON CONFLICT (email) DO NOTHING;

-- ── 3. Enrollments (sequential IDs starting from ENR016) ─────────────────────
WITH course_list(course_id, semester, academic_year, enroll_date) AS (VALUES
    ('CRS001', 1, '2023-2024', '2023-09-04'::date),
    ('CRS003', 1, '2023-2024', '2023-09-04'::date),
    ('CRS008', 2, '2023-2024', '2024-01-15'::date),
    ('CRS004', 2, '2023-2024', '2024-01-15'::date),
    ('CRS005', 1, '2024-2025', '2024-09-02'::date),
    ('CRS009', 1, '2024-2025', '2024-09-02'::date),
    ('CRS010', 2, '2024-2025', '2025-01-13'::date),
    ('CRS007', 2, '2024-2025', '2025-01-13'::date),
    ('CRS006', 1, '2025-2026', '2025-09-01'::date),
    ('CRS002', 1, '2025-2026', '2025-09-01'::date)
),
student_list(student_id) AS (VALUES
    ('STU013'),('STU014'),('STU015'),('STU016'),('STU017'),
    ('STU018'),('STU019'),('STU020'),('STU021'),('STU022'),
    ('STU023'),('STU024'),('STU025'),('STU026'),('STU027'),
    ('STU028'),('STU029'),('STU030'),('STU031'),('STU032')
),
cross_joined AS (
    SELECT
        'ENR' || LPAD((ROW_NUMBER() OVER (ORDER BY s.student_id, c.course_id) + 15)::TEXT, 3, '0') AS enrollment_id,
        s.student_id,
        c.course_id,
        c.semester,
        c.academic_year,
        CASE WHEN c.academic_year < '2025-2026' THEN 'Validated' ELSE 'In Progress' END AS status,
        ROUND((85 + random() * 14)::numeric, 1) AS attendance_rate,
        c.enroll_date
    FROM student_list s CROSS JOIN course_list c
)
INSERT INTO enrollments (enrollment_id, student_id, course_id, semester, academic_year,
    status, final_grade, attendance_rate, enrollment_date)
SELECT enrollment_id, student_id, course_id, semester, academic_year,
    status, NULL, attendance_rate, enroll_date
FROM cross_joined
ON CONFLICT (enrollment_id) DO NOTHING;

-- ── 4. Grades (published) ─────────────────────────────────────────────────────

-- CRS001 (S1 2023-2024): Quiz1 x1, Partiel x2, Cas x1, Presentation x2
INSERT INTO grades (student_id, course_id, campus_id, evaluation_name, score, score_max, coefficient, evaluation_date, published_at) VALUES
  ('STU013','CRS001','CAMP001','Quiz 1',13.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU013','CRS001','CAMP001','Partiel intermediaire',11.5,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU013','CRS001','CAMP001','Cas entreprise',14.0,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU013','CRS001','CAMP001','Presentation orale',12.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU014','CRS001','CAMP001','Quiz 1',16.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU014','CRS001','CAMP001','Partiel intermediaire',15.0,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU014','CRS001','CAMP001','Cas entreprise',17.0,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU014','CRS001','CAMP001','Presentation orale',14.5,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU015','CRS001','CAMP001','Quiz 1',10.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU015','CRS001','CAMP001','Partiel intermediaire',9.0,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU015','CRS001','CAMP001','Cas entreprise',11.0,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU015','CRS001','CAMP001','Presentation orale',10.5,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU016','CRS001','CAMP001','Quiz 1',12.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU016','CRS001','CAMP001','Partiel intermediaire',13.0,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU016','CRS001','CAMP001','Cas entreprise',12.5,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU016','CRS001','CAMP001','Presentation orale',13.5,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU017','CRS001','CAMP001','Quiz 1',18.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU017','CRS001','CAMP001','Partiel intermediaire',17.0,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU017','CRS001','CAMP001','Cas entreprise',19.0,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU017','CRS001','CAMP001','Presentation orale',16.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU018','CRS001','CAMP001','Quiz 1',8.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU018','CRS001','CAMP001','Partiel intermediaire',9.5,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU018','CRS001','CAMP001','Cas entreprise',8.5,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU018','CRS001','CAMP001','Presentation orale',7.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU019','CRS001','CAMP001','Quiz 1',14.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU019','CRS001','CAMP001','Partiel intermediaire',12.5,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU019','CRS001','CAMP001','Cas entreprise',15.0,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU019','CRS001','CAMP001','Presentation orale',13.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU020','CRS001','CAMP001','Quiz 1',11.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU020','CRS001','CAMP001','Partiel intermediaire',12.0,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU020','CRS001','CAMP001','Cas entreprise',10.5,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU020','CRS001','CAMP001','Presentation orale',11.5,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU021','CRS001','CAMP001','Quiz 1',15.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU021','CRS001','CAMP001','Partiel intermediaire',14.0,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU021','CRS001','CAMP001','Cas entreprise',16.0,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU021','CRS001','CAMP001','Presentation orale',15.5,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU022','CRS001','CAMP001','Quiz 1',9.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU022','CRS001','CAMP001','Partiel intermediaire',10.0,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU022','CRS001','CAMP001','Cas entreprise',9.5,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU022','CRS001','CAMP001','Presentation orale',8.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU023','CRS001','CAMP001','Quiz 1',13.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU023','CRS001','CAMP001','Partiel intermediaire',14.5,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU023','CRS001','CAMP001','Cas entreprise',12.0,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU023','CRS001','CAMP001','Presentation orale',14.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU024','CRS001','CAMP001','Quiz 1',17.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU024','CRS001','CAMP001','Partiel intermediaire',16.0,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU024','CRS001','CAMP001','Cas entreprise',18.0,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU024','CRS001','CAMP001','Presentation orale',15.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU025','CRS001','CAMP001','Quiz 1',11.5,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU025','CRS001','CAMP001','Partiel intermediaire',10.5,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU025','CRS001','CAMP001','Cas entreprise',12.0,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU025','CRS001','CAMP001','Presentation orale',11.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU026','CRS001','CAMP001','Quiz 1',14.5,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU026','CRS001','CAMP001','Partiel intermediaire',13.5,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU026','CRS001','CAMP001','Cas entreprise',15.5,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU026','CRS001','CAMP001','Presentation orale',12.5,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU027','CRS001','CAMP001','Quiz 1',7.0,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU027','CRS001','CAMP001','Partiel intermediaire',8.0,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU027','CRS001','CAMP001','Cas entreprise',7.5,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU027','CRS001','CAMP001','Presentation orale',9.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU028','CRS001','CAMP001','Quiz 1',16.5,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU028','CRS001','CAMP001','Partiel intermediaire',15.5,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU028','CRS001','CAMP001','Cas entreprise',17.5,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU028','CRS001','CAMP001','Presentation orale',16.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU029','CRS001','CAMP001','Quiz 1',12.5,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU029','CRS001','CAMP001','Partiel intermediaire',11.0,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU029','CRS001','CAMP001','Cas entreprise',13.0,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU029','CRS001','CAMP001','Presentation orale',12.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU030','CRS001','CAMP001','Quiz 1',10.5,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU030','CRS001','CAMP001','Partiel intermediaire',11.5,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU030','CRS001','CAMP001','Cas entreprise',10.0,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU030','CRS001','CAMP001','Presentation orale',12.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU031','CRS001','CAMP001','Quiz 1',15.5,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU031','CRS001','CAMP001','Partiel intermediaire',14.5,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU031','CRS001','CAMP001','Cas entreprise',16.5,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU031','CRS001','CAMP001','Presentation orale',15.0,20,2,'2023-11-28','2023-12-15 10:00:00'),
  ('STU032','CRS001','CAMP001','Quiz 1',9.5,20,1,'2023-10-12','2023-12-15 10:00:00'),
  ('STU032','CRS001','CAMP001','Partiel intermediaire',10.5,20,2,'2023-11-06','2023-12-15 10:00:00'),
  ('STU032','CRS001','CAMP001','Cas entreprise',8.0,20,1,'2023-11-22','2023-12-15 10:00:00'),
  ('STU032','CRS001','CAMP001','Presentation orale',11.0,20,2,'2023-11-28','2023-12-15 10:00:00');

-- CRS002 (S1 2025-2026)
INSERT INTO grades (student_id, course_id, campus_id, evaluation_name, score, score_max, coefficient, evaluation_date, published_at) VALUES
  ('STU013','CRS002','CAMP001','TD note maths',12.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU013','CRS002','CAMP001','Partiel mi-semestre',13.5,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU014','CRS002','CAMP001','TD note maths',16.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU014','CRS002','CAMP001','Partiel mi-semestre',17.0,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU015','CRS002','CAMP001','TD note maths',9.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU015','CRS002','CAMP001','Partiel mi-semestre',10.0,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU016','CRS002','CAMP001','TD note maths',13.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU016','CRS002','CAMP001','Partiel mi-semestre',12.5,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU017','CRS002','CAMP001','TD note maths',18.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU017','CRS002','CAMP001','Partiel mi-semestre',19.0,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU018','CRS002','CAMP001','TD note maths',7.5,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU018','CRS002','CAMP001','Partiel mi-semestre',8.0,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU019','CRS002','CAMP001','TD note maths',14.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU019','CRS002','CAMP001','Partiel mi-semestre',13.0,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU020','CRS002','CAMP001','TD note maths',11.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU020','CRS002','CAMP001','Partiel mi-semestre',12.0,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU021','CRS002','CAMP001','TD note maths',15.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU021','CRS002','CAMP001','Partiel mi-semestre',14.5,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU022','CRS002','CAMP001','TD note maths',8.5,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU022','CRS002','CAMP001','Partiel mi-semestre',9.5,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU023','CRS002','CAMP001','TD note maths',13.5,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU023','CRS002','CAMP001','Partiel mi-semestre',14.0,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU024','CRS002','CAMP001','TD note maths',17.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU024','CRS002','CAMP001','Partiel mi-semestre',16.5,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU025','CRS002','CAMP001','TD note maths',10.5,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU025','CRS002','CAMP001','Partiel mi-semestre',11.0,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU026','CRS002','CAMP001','TD note maths',14.5,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU026','CRS002','CAMP001','Partiel mi-semestre',13.0,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU027','CRS002','CAMP001','TD note maths',6.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU027','CRS002','CAMP001','Partiel mi-semestre',7.5,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU028','CRS002','CAMP001','TD note maths',16.5,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU028','CRS002','CAMP001','Partiel mi-semestre',15.0,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU029','CRS002','CAMP001','TD note maths',12.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU029','CRS002','CAMP001','Partiel mi-semestre',11.5,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU030','CRS002','CAMP001','TD note maths',10.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU030','CRS002','CAMP001','Partiel mi-semestre',11.0,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU031','CRS002','CAMP001','TD note maths',15.5,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU031','CRS002','CAMP001','Partiel mi-semestre',14.0,20,2,'2025-11-05','2025-11-20 10:00:00'),
  ('STU032','CRS002','CAMP001','TD note maths',9.0,20,1,'2025-10-15','2025-11-20 10:00:00'),('STU032','CRS002','CAMP001','Partiel mi-semestre',10.5,20,2,'2025-11-05','2025-11-20 10:00:00');

-- CRS003 (S1 2023-2024)
INSERT INTO grades (student_id, course_id, campus_id, evaluation_name, score, score_max, coefficient, evaluation_date, published_at) VALUES
  ('STU013','CRS003','CAMP001','TP Python 1',12.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU013','CRS003','CAMP001','Projet final',11.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU014','CRS003','CAMP001','TP Python 1',15.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU014','CRS003','CAMP001','Projet final',16.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU015','CRS003','CAMP001','TP Python 1',8.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU015','CRS003','CAMP001','Projet final',9.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU016','CRS003','CAMP001','TP Python 1',13.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU016','CRS003','CAMP001','Projet final',12.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU017','CRS003','CAMP001','TP Python 1',17.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU017','CRS003','CAMP001','Projet final',18.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU018','CRS003','CAMP001','TP Python 1',7.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU018','CRS003','CAMP001','Projet final',8.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU019','CRS003','CAMP001','TP Python 1',14.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU019','CRS003','CAMP001','Projet final',13.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU020','CRS003','CAMP001','TP Python 1',10.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU020','CRS003','CAMP001','Projet final',11.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU021','CRS003','CAMP001','TP Python 1',16.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU021','CRS003','CAMP001','Projet final',15.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU022','CRS003','CAMP001','TP Python 1',9.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU022','CRS003','CAMP001','Projet final',8.5,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU023','CRS003','CAMP001','TP Python 1',12.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU023','CRS003','CAMP001','Projet final',13.5,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU024','CRS003','CAMP001','TP Python 1',16.5,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU024','CRS003','CAMP001','Projet final',17.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU025','CRS003','CAMP001','TP Python 1',11.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU025','CRS003','CAMP001','Projet final',10.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU026','CRS003','CAMP001','TP Python 1',14.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU026','CRS003','CAMP001','Projet final',13.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU027','CRS003','CAMP001','TP Python 1',6.5,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU027','CRS003','CAMP001','Projet final',7.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU028','CRS003','CAMP001','TP Python 1',15.5,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU028','CRS003','CAMP001','Projet final',16.5,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU029','CRS003','CAMP001','TP Python 1',11.5,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU029','CRS003','CAMP001','Projet final',12.0,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU030','CRS003','CAMP001','TP Python 1',10.5,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU030','CRS003','CAMP001','Projet final',9.5,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU031','CRS003','CAMP001','TP Python 1',15.0,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU031','CRS003','CAMP001','Projet final',14.5,20,2,'2023-12-01','2023-12-20 10:00:00'),
  ('STU032','CRS003','CAMP001','TP Python 1',8.5,20,1,'2023-10-20','2023-12-20 10:00:00'),('STU032','CRS003','CAMP001','Projet final',9.0,20,2,'2023-12-01','2023-12-20 10:00:00');

-- CRS004 (S2 2023-2024)
INSERT INTO grades (student_id, course_id, campus_id, evaluation_name, score, score_max, coefficient, evaluation_date, published_at) VALUES
  ('STU013','CRS004','CAMP001','Partiel S2',11.0,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU013','CRS004','CAMP001','Projet marketing',12.5,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU014','CRS004','CAMP001','Partiel S2',14.5,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU014','CRS004','CAMP001','Projet marketing',15.5,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU015','CRS004','CAMP001','Partiel S2',8.5,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU015','CRS004','CAMP001','Projet marketing',9.0,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU016','CRS004','CAMP001','Partiel S2',12.5,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU016','CRS004','CAMP001','Projet marketing',13.0,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU017','CRS004','CAMP001','Partiel S2',16.0,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU017','CRS004','CAMP001','Projet marketing',17.5,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU018','CRS004','CAMP001','Partiel S2',7.0,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU018','CRS004','CAMP001','Projet marketing',8.5,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU019','CRS004','CAMP001','Partiel S2',13.5,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU019','CRS004','CAMP001','Projet marketing',12.0,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU020','CRS004','CAMP001','Partiel S2',11.5,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU020','CRS004','CAMP001','Projet marketing',10.5,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU021','CRS004','CAMP001','Partiel S2',14.0,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU021','CRS004','CAMP001','Projet marketing',15.0,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU022','CRS004','CAMP001','Partiel S2',9.0,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU022','CRS004','CAMP001','Projet marketing',8.0,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU023','CRS004','CAMP001','Partiel S2',13.0,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU023','CRS004','CAMP001','Projet marketing',14.0,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU024','CRS004','CAMP001','Partiel S2',16.5,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU024','CRS004','CAMP001','Projet marketing',16.0,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU025','CRS004','CAMP001','Partiel S2',10.0,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU025','CRS004','CAMP001','Projet marketing',11.5,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU026','CRS004','CAMP001','Partiel S2',13.5,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU026','CRS004','CAMP001','Projet marketing',12.5,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU027','CRS004','CAMP001','Partiel S2',6.0,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU027','CRS004','CAMP001','Projet marketing',7.5,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU028','CRS004','CAMP001','Partiel S2',15.5,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU028','CRS004','CAMP001','Projet marketing',16.5,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU029','CRS004','CAMP001','Partiel S2',12.0,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU029','CRS004','CAMP001','Projet marketing',11.0,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU030','CRS004','CAMP001','Partiel S2',10.5,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU030','CRS004','CAMP001','Projet marketing',11.0,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU031','CRS004','CAMP001','Partiel S2',14.5,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU031','CRS004','CAMP001','Projet marketing',15.5,20,2,'2024-05-20','2024-06-10 10:00:00'),
  ('STU032','CRS004','CAMP001','Partiel S2',9.5,20,2,'2024-03-15','2024-06-10 10:00:00'),('STU032','CRS004','CAMP001','Projet marketing',8.5,20,2,'2024-05-20','2024-06-10 10:00:00');

-- CRS005 (S1 2024-2025)
INSERT INTO grades (student_id, course_id, campus_id, evaluation_name, score, score_max, coefficient, evaluation_date, published_at) VALUES
  ('STU013','CRS005','CAMP001','QCM IA',10.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU013','CRS005','CAMP001','Projet IA',12.0,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU014','CRS005','CAMP001','QCM IA',14.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU014','CRS005','CAMP001','Projet IA',15.0,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU015','CRS005','CAMP001','QCM IA',8.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU015','CRS005','CAMP001','Projet IA',9.0,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU016','CRS005','CAMP001','QCM IA',12.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU016','CRS005','CAMP001','Projet IA',11.0,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU017','CRS005','CAMP001','QCM IA',17.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU017','CRS005','CAMP001','Projet IA',16.0,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU018','CRS005','CAMP001','QCM IA',6.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU018','CRS005','CAMP001','Projet IA',7.5,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU019','CRS005','CAMP001','QCM IA',13.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU019','CRS005','CAMP001','Projet IA',12.5,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU020','CRS005','CAMP001','QCM IA',9.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU020','CRS005','CAMP001','Projet IA',10.5,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU021','CRS005','CAMP001','QCM IA',15.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU021','CRS005','CAMP001','Projet IA',14.0,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU022','CRS005','CAMP001','QCM IA',7.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU022','CRS005','CAMP001','Projet IA',8.0,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU023','CRS005','CAMP001','QCM IA',11.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU023','CRS005','CAMP001','Projet IA',13.0,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU024','CRS005','CAMP001','QCM IA',16.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU024','CRS005','CAMP001','Projet IA',17.5,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU025','CRS005','CAMP001','QCM IA',10.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU025','CRS005','CAMP001','Projet IA',9.5,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU026','CRS005','CAMP001','QCM IA',13.5,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU026','CRS005','CAMP001','Projet IA',12.0,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU027','CRS005','CAMP001','QCM IA',5.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU027','CRS005','CAMP001','Projet IA',6.5,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU028','CRS005','CAMP001','QCM IA',15.5,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU028','CRS005','CAMP001','Projet IA',16.0,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU029','CRS005','CAMP001','QCM IA',11.5,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU029','CRS005','CAMP001','Projet IA',10.0,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU030','CRS005','CAMP001','QCM IA',9.5,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU030','CRS005','CAMP001','Projet IA',10.5,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU031','CRS005','CAMP001','QCM IA',14.5,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU031','CRS005','CAMP001','Projet IA',15.5,20,3,'2024-11-25','2024-12-10 10:00:00'),
  ('STU032','CRS005','CAMP001','QCM IA',8.0,20,1,'2024-10-10','2024-12-10 10:00:00'),('STU032','CRS005','CAMP001','Projet IA',7.0,20,3,'2024-11-25','2024-12-10 10:00:00');

-- CRS007 (S2 2024-2025)
INSERT INTO grades (student_id, course_id, campus_id, evaluation_name, score, score_max, coefficient, evaluation_date, published_at) VALUES
  ('STU013','CRS007','CAMP001','Analyse exploratoire',11.5,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU013','CRS007','CAMP001','Rapport final data',12.5,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU014','CRS007','CAMP001','Analyse exploratoire',14.5,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU014','CRS007','CAMP001','Rapport final data',15.5,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU015','CRS007','CAMP001','Analyse exploratoire',8.0,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU015','CRS007','CAMP001','Rapport final data',9.0,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU016','CRS007','CAMP001','Analyse exploratoire',12.0,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU016','CRS007','CAMP001','Rapport final data',11.0,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU017','CRS007','CAMP001','Analyse exploratoire',17.0,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU017','CRS007','CAMP001','Rapport final data',18.0,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU018','CRS007','CAMP001','Analyse exploratoire',7.0,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU018','CRS007','CAMP001','Rapport final data',8.0,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU019','CRS007','CAMP001','Analyse exploratoire',13.0,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU019','CRS007','CAMP001','Rapport final data',12.0,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU020','CRS007','CAMP001','Analyse exploratoire',10.5,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU020','CRS007','CAMP001','Rapport final data',11.5,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU021','CRS007','CAMP001','Analyse exploratoire',15.0,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU021','CRS007','CAMP001','Rapport final data',14.0,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU022','CRS007','CAMP001','Analyse exploratoire',9.5,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU022','CRS007','CAMP001','Rapport final data',8.5,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU023','CRS007','CAMP001','Analyse exploratoire',13.5,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU023','CRS007','CAMP001','Rapport final data',14.5,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU024','CRS007','CAMP001','Analyse exploratoire',16.5,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU024','CRS007','CAMP001','Rapport final data',17.5,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU025','CRS007','CAMP001','Analyse exploratoire',10.0,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU025','CRS007','CAMP001','Rapport final data',11.0,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU026','CRS007','CAMP001','Analyse exploratoire',12.5,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU026','CRS007','CAMP001','Rapport final data',13.5,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU027','CRS007','CAMP001','Analyse exploratoire',6.0,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU027','CRS007','CAMP001','Rapport final data',7.0,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU028','CRS007','CAMP001','Analyse exploratoire',15.5,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU028','CRS007','CAMP001','Rapport final data',16.5,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU029','CRS007','CAMP001','Analyse exploratoire',11.0,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU029','CRS007','CAMP001','Rapport final data',12.0,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU030','CRS007','CAMP001','Analyse exploratoire',9.5,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU030','CRS007','CAMP001','Rapport final data',10.5,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU031','CRS007','CAMP001','Analyse exploratoire',14.0,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU031','CRS007','CAMP001','Rapport final data',15.0,20,2,'2025-05-20','2025-06-05 10:00:00'),
  ('STU032','CRS007','CAMP001','Analyse exploratoire',8.5,20,2,'2025-03-12','2025-06-05 10:00:00'),('STU032','CRS007','CAMP001','Rapport final data',9.5,20,2,'2025-05-20','2025-06-05 10:00:00');

-- CRS008 (S2 2023-2024)
INSERT INTO grades (student_id, course_id, campus_id, evaluation_name, score, score_max, coefficient, evaluation_date, published_at) VALUES
  ('STU013','CRS008','CAMP001','Examen Eco Int.',12.0,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU014','CRS008','CAMP001','Examen Eco Int.',15.5,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU015','CRS008','CAMP001','Examen Eco Int.',9.0,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU016','CRS008','CAMP001','Examen Eco Int.',11.5,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU017','CRS008','CAMP001','Examen Eco Int.',17.0,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU018','CRS008','CAMP001','Examen Eco Int.',8.0,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU019','CRS008','CAMP001','Examen Eco Int.',13.0,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU020','CRS008','CAMP001','Examen Eco Int.',11.0,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU021','CRS008','CAMP001','Examen Eco Int.',14.5,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU022','CRS008','CAMP001','Examen Eco Int.',9.5,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU023','CRS008','CAMP001','Examen Eco Int.',13.5,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU024','CRS008','CAMP001','Examen Eco Int.',16.0,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU025','CRS008','CAMP001','Examen Eco Int.',10.5,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU026','CRS008','CAMP001','Examen Eco Int.',12.5,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU027','CRS008','CAMP001','Examen Eco Int.',7.5,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU028','CRS008','CAMP001','Examen Eco Int.',15.0,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU029','CRS008','CAMP001','Examen Eco Int.',11.0,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU030','CRS008','CAMP001','Examen Eco Int.',10.0,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU031','CRS008','CAMP001','Examen Eco Int.',14.0,20,2,'2024-05-10','2024-06-01 10:00:00'),
  ('STU032','CRS008','CAMP001','Examen Eco Int.',8.5,20,2,'2024-05-10','2024-06-01 10:00:00');

-- CRS009 (S1 2024-2025)
INSERT INTO grades (student_id, course_id, campus_id, evaluation_name, score, score_max, coefficient, evaluation_date, published_at) VALUES
  ('STU013','CRS009','CAMP001','Examen droit',13.5,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU014','CRS009','CAMP001','Examen droit',16.0,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU015','CRS009','CAMP001','Examen droit',9.5,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU016','CRS009','CAMP001','Examen droit',12.0,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU017','CRS009','CAMP001','Examen droit',17.5,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU018','CRS009','CAMP001','Examen droit',7.0,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU019','CRS009','CAMP001','Examen droit',13.0,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU020','CRS009','CAMP001','Examen droit',11.5,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU021','CRS009','CAMP001','Examen droit',15.5,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU022','CRS009','CAMP001','Examen droit',8.5,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU023','CRS009','CAMP001','Examen droit',14.0,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU024','CRS009','CAMP001','Examen droit',17.0,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU025','CRS009','CAMP001','Examen droit',10.5,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU026','CRS009','CAMP001','Examen droit',13.0,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU027','CRS009','CAMP001','Examen droit',6.5,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU028','CRS009','CAMP001','Examen droit',15.0,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU029','CRS009','CAMP001','Examen droit',12.0,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU030','CRS009','CAMP001','Examen droit',11.0,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU031','CRS009','CAMP001','Examen droit',14.5,20,2,'2024-12-10','2025-01-10 10:00:00'),
  ('STU032','CRS009','CAMP001','Examen droit',9.0,20,2,'2024-12-10','2025-01-10 10:00:00');

-- CRS010 (S2 2024-2025)
INSERT INTO grades (student_id, course_id, campus_id, evaluation_name, score, score_max, coefficient, evaluation_date, published_at) VALUES
  ('STU013','CRS010','CAMP001','Projet web',12.5,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU014','CRS010','CAMP001','Projet web',15.0,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU015','CRS010','CAMP001','Projet web',8.5,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU016','CRS010','CAMP001','Projet web',11.5,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU017','CRS010','CAMP001','Projet web',18.0,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU018','CRS010','CAMP001','Projet web',7.5,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU019','CRS010','CAMP001','Projet web',13.5,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU020','CRS010','CAMP001','Projet web',10.5,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU021','CRS010','CAMP001','Projet web',14.5,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU022','CRS010','CAMP001','Projet web',9.0,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU023','CRS010','CAMP001','Projet web',13.0,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU024','CRS010','CAMP001','Projet web',16.5,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU025','CRS010','CAMP001','Projet web',10.0,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU026','CRS010','CAMP001','Projet web',12.5,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU027','CRS010','CAMP001','Projet web',6.0,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU028','CRS010','CAMP001','Projet web',16.0,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU029','CRS010','CAMP001','Projet web',11.5,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU030','CRS010','CAMP001','Projet web',10.0,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU031','CRS010','CAMP001','Projet web',15.5,20,2,'2025-05-15','2025-06-05 10:00:00'),
  ('STU032','CRS010','CAMP001','Projet web',8.0,20,2,'2025-05-15','2025-06-05 10:00:00');

-- ── 5. Extra schedule entry forcing a room conflict for planning UI testing ────
-- SCH001 already books ROOM101 on Monday 09:00-12:00 (semester 1, 2023-2024).
-- This entry overlaps the same room/day/semester/year with a different course
-- and instructor, producing a visible room conflict in the planning views.
INSERT INTO schedules (schedule_id, course_id, instructor_id, room_id, day_of_week, start_time, end_time, semester, academic_year, status)
VALUES
  ('SCH011','CRS003','INST002','ROOM101','Monday','10:00:00','13:00:00',1,'2023-2024','Active')
ON CONFLICT (schedule_id) DO NOTHING;

-- ── 6. Verify ─────────────────────────────────────────────────────────────────
SELECT 'students added'   AS label, COUNT(*) AS n FROM students     WHERE student_id >= 'STU013'
UNION ALL
SELECT 'users added',               COUNT(*)       FROM users        WHERE "studentId" >= 'STU013'
UNION ALL
SELECT 'enrollments added',         COUNT(*)       FROM enrollments  WHERE student_id >= 'STU013'
UNION ALL
SELECT 'grades added',              COUNT(*)       FROM grades       WHERE student_id >= 'STU013'
UNION ALL
SELECT 'schedules added',           COUNT(*)       FROM schedules    WHERE schedule_id = 'SCH011';
