-- ============================================================================
--  NovaCampus Alliance ERP — PostgreSQL transactional schema
--  Layer: "Data and storage" -> PostgreSQL (ACID: enrolments, grades, payments)
--  Multi-tenancy: shared-database / shared-schema with campus_id discriminator
--  (matches Deliverable 1, sections 3.5 and 6.3)
-- ============================================================================

DROP TABLE IF EXISTS payments     CASCADE;
DROP TABLE IF EXISTS enrollments  CASCADE;
DROP TABLE IF EXISTS schedules    CASCADE;
DROP TABLE IF EXISTS courses      CASCADE;
DROP TABLE IF EXISTS students     CASCADE;
DROP TABLE IF EXISTS rooms        CASCADE;
DROP TABLE IF EXISTS instructors  CASCADE;
DROP TABLE IF EXISTS programs     CASCADE;
DROP TABLE IF EXISTS campuses     CASCADE;

-- ---- Tenants -------------------------------------------------------------
CREATE TABLE campuses (
    campus_id        VARCHAR(10)  PRIMARY KEY,
    campus_name      VARCHAR(120) NOT NULL,
    address          VARCHAR(160),
    city             VARCHAR(80),
    zip_code         VARCHAR(10),
    region           VARCHAR(80),
    campus_director  VARCHAR(120),
    phone            VARCHAR(20),
    email            VARCHAR(120),
    capacity_students INTEGER,
    opening_date     DATE,
    status           VARCHAR(20)  DEFAULT 'Active'
);

-- ---- Catalog -------------------------------------------------------------
CREATE TABLE programs (
    program_id       VARCHAR(10)  PRIMARY KEY,
    program_name     VARCHAR(160) NOT NULL,
    program_type     VARCHAR(20),                       -- Bachelor / Master
    duration_years   SMALLINT,
    annual_tuition   NUMERIC(10,2),
    campus_id        VARCHAR(10)  NOT NULL REFERENCES campuses(campus_id),
    department       VARCHAR(60),
    coordinator      VARCHAR(120),
    max_students     INTEGER,
    status           VARCHAR(20)  DEFAULT 'Active'
);

CREATE TABLE instructors (
    instructor_id    VARCHAR(10)  PRIMARY KEY,
    first_name       VARCHAR(60),
    last_name        VARCHAR(60),
    email            VARCHAR(120) UNIQUE,
    phone            VARCHAR(20),
    campus_id        VARCHAR(10)  NOT NULL REFERENCES campuses(campus_id),
    department       VARCHAR(60),
    status           VARCHAR(20)  DEFAULT 'Active',
    hire_date        DATE,
    specialization   VARCHAR(120)
);

CREATE TABLE rooms (
    room_id          VARCHAR(10)  PRIMARY KEY,
    room_name        VARCHAR(120),
    campus_id        VARCHAR(10)  NOT NULL REFERENCES campuses(campus_id),
    building         VARCHAR(60),
    floor            SMALLINT,
    capacity         INTEGER,
    room_type        VARCHAR(40),
    equipment        TEXT,
    status           VARCHAR(20)  DEFAULT 'Available'
);

-- ---- People (students) ---------------------------------------------------
CREATE TABLE students (
    student_id       VARCHAR(10)  PRIMARY KEY,
    first_name       VARCHAR(60),
    last_name        VARCHAR(60),
    email            VARCHAR(120) UNIQUE,
    phone            VARCHAR(20),
    date_of_birth    DATE,
    campus_id        VARCHAR(10)  NOT NULL REFERENCES campuses(campus_id),
    program_id       VARCHAR(10)  NOT NULL REFERENCES programs(program_id),
    enrollment_year  SMALLINT,
    status           VARCHAR(20)  DEFAULT 'Active',
    payment_status   VARCHAR(20),                       -- Up to date / Delay
    address          VARCHAR(160),
    city             VARCHAR(80),
    zip_code         VARCHAR(10),
    emergency_contact VARCHAR(120),
    emergency_phone  VARCHAR(20)
);

CREATE TABLE courses (
    course_id        VARCHAR(10)  PRIMARY KEY,
    course_name      VARCHAR(160) NOT NULL,
    course_code      VARCHAR(20)  UNIQUE,
    program_id       VARCHAR(10)  NOT NULL REFERENCES programs(program_id),
    semester         SMALLINT,
    credits          SMALLINT,
    hours_total      INTEGER,
    instructor_id    VARCHAR(10)  REFERENCES instructors(instructor_id),
    room_id          VARCHAR(10)  REFERENCES rooms(room_id),
    status           VARCHAR(20)  DEFAULT 'Active'
);

CREATE TABLE schedules (
    schedule_id      VARCHAR(10)  PRIMARY KEY,
    course_id        VARCHAR(10)  NOT NULL REFERENCES courses(course_id),
    instructor_id    VARCHAR(10)  REFERENCES instructors(instructor_id),
    room_id          VARCHAR(10)  REFERENCES rooms(room_id),
    day_of_week      VARCHAR(12),
    start_time       TIME,
    end_time         TIME,
    semester         SMALLINT,
    academic_year    VARCHAR(12),
    status           VARCHAR(20)  DEFAULT 'Active',
    last_modified    TIMESTAMP
);

-- ---- Academic / financial transactions -----------------------------------
CREATE TABLE enrollments (
    enrollment_id    VARCHAR(10)  PRIMARY KEY,
    student_id       VARCHAR(10)  NOT NULL REFERENCES students(student_id),
    course_id        VARCHAR(10)  NOT NULL REFERENCES courses(course_id),
    semester         SMALLINT,
    academic_year    VARCHAR(12),
    status           VARCHAR(20),                       -- In progress / Validated
    final_grade      NUMERIC(4,2),                      -- NULL while in progress
    attendance_rate  NUMERIC(5,2),
    enrollment_date  DATE,
    UNIQUE (student_id, course_id, academic_year)
);

CREATE TABLE payments (
    payment_id       VARCHAR(10)  PRIMARY KEY,
    student_id       VARCHAR(10)  NOT NULL REFERENCES students(student_id),
    invoice_date     DATE,
    due_date         DATE,
    amount           NUMERIC(10,2),
    status           VARCHAR(20),                       -- Paid / Delay
    payment_date     DATE,                              -- NULL if unpaid
    payment_method   VARCHAR(40),
    academic_year    VARCHAR(12),
    semester         SMALLINT,
    notes            VARCHAR(160)
);

-- ---- Indexes on the tenant discriminator + hot lookups -------------------
CREATE INDEX idx_programs_campus    ON programs(campus_id);
CREATE INDEX idx_instructors_campus ON instructors(campus_id);
CREATE INDEX idx_rooms_campus       ON rooms(campus_id);
CREATE INDEX idx_students_campus    ON students(campus_id);
CREATE INDEX idx_students_program   ON students(program_id);
CREATE INDEX idx_courses_program    ON courses(program_id);
CREATE INDEX idx_enroll_student     ON enrollments(student_id);
CREATE INDEX idx_enroll_course      ON enrollments(course_id);
CREATE INDEX idx_payments_student   ON payments(student_id);
CREATE INDEX idx_payments_status    ON payments(status);

-- ---- Row-Level Security on sensitive tables (Deliverable 1, 6.3 / 6.7) ----
-- Enforces tenant isolation at the DB layer. The table owner (used by the
-- seeder) bypasses RLS, so seeding works; application roles must set
--   SET app.campus_id = 'CAMP001';
-- before querying. FORCE is intentionally NOT set so the owner can seed.
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_students ON students;
CREATE POLICY tenant_isolation_students ON students
    USING (campus_id = current_setting('app.campus_id', true));

DROP POLICY IF EXISTS tenant_isolation_payments ON payments;
CREATE POLICY tenant_isolation_payments ON payments
    USING (student_id IN (
        SELECT student_id FROM students
        WHERE campus_id = current_setting('app.campus_id', true)
    ));
