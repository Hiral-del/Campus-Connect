-- ============================================
-- Smart Class Manager
-- Database Schema (SQLite)
-- ============================================

-- Users table: supports admin, teacher, student roles
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'teacher', 'student')) NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Classes table: represents a class section
CREATE TABLE classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    section TEXT DEFAULT 'A',
    room_number TEXT,
    academic_year TEXT DEFAULT '2025-2026',
    created_at TEXT DEFAULT (datetime('now'))
);

-- Teachers table: linked to users
CREATE TABLE teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    department TEXT,
    phone TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Students table: linked to users and enrolled in a class
CREATE TABLE students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE,
    name TEXT NOT NULL,
    class_id INTEGER,
    roll_number INTEGER,
    guardian_name TEXT,
    performance_status TEXT DEFAULT 'Average'
        CHECK(performance_status IN ('Excellent','Good','Average','At Risk','Failing')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE SET NULL
);

-- Subjects table: linked to a class and a teacher
CREATE TABLE subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class_id INTEGER NOT NULL,
    teacher_id INTEGER,
    max_score INTEGER DEFAULT 100,
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY(teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

-- Marks table: student scores per subject
CREATE TABLE marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    exam_type TEXT DEFAULT 'Midterm'
        CHECK(exam_type IN ('Midterm', 'Final', 'Quiz', 'Assignment', 'Mid-Sem', 'End-Sem')),
    recorded_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Attendance table: per student per class per day
CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    class_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT CHECK(status IN ('Present','Absent','Late')) NOT NULL,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Assignments table: class-level, linked to a subject
CREATE TABLE assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    max_score INTEGER DEFAULT 100,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Assignment submissions: per student
CREATE TABLE assignment_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    score INTEGER,
    submitted_date TEXT,
    status TEXT DEFAULT 'Pending'
        CHECK(status IN ('Pending','Submitted','Graded','Late')),
    FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Timetable: weekly schedule for classes
CREATE TABLE timetable (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    day_of_week TEXT CHECK(day_of_week IN
        ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday')) NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

-- Announcements: class-specific or global
CREATE TABLE announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    class_id INTEGER,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- VIEWS — Complex JOINs for Analytics
-- ============================================

-- View 1: Class overview with student count and teachers
CREATE VIEW class_overview AS
SELECT
    c.id AS class_id, c.name AS class_name, c.grade, c.section,
    c.room_number, c.academic_year,
    COUNT(DISTINCT s.id) AS student_count,
    GROUP_CONCAT(DISTINCT t.name) AS teacher_names
FROM classes c
LEFT JOIN students s ON c.id = s.class_id
LEFT JOIN subjects sub ON c.id = sub.class_id
LEFT JOIN teachers t ON sub.teacher_id = t.id
GROUP BY c.id;

-- View 2: Student average score with class info
CREATE VIEW student_average_score AS
SELECT
    s.id AS student_id, s.name, s.class_id,
    c.name AS class_name, s.performance_status,
    ROUND(AVG(m.score), 2) AS average_score,
    COUNT(m.id) AS total_exams
FROM students s
LEFT JOIN marks m ON s.id = m.student_id
LEFT JOIN classes c ON s.class_id = c.id
GROUP BY s.id;

-- View 3: Class performance summary (multi-JOIN aggregation)
CREATE VIEW class_performance_summary AS
SELECT
    c.id AS class_id, c.name AS class_name, c.grade,
    COUNT(DISTINCT s.id) AS total_students,
    ROUND(AVG(m.score), 2) AS class_average,
    MAX(m.score) AS highest_score,
    MIN(m.score) AS lowest_score,
    SUM(CASE WHEN s.performance_status='Excellent' THEN 1 ELSE 0 END) AS excellent_count,
    SUM(CASE WHEN s.performance_status IN ('At Risk','Failing') THEN 1 ELSE 0 END) AS at_risk_count
FROM classes c
LEFT JOIN students s ON c.id = s.class_id
LEFT JOIN marks m ON s.id = m.student_id
GROUP BY c.id;

-- View 4: Full student dashboard summary
CREATE VIEW student_dashboard_summary AS
SELECT
    s.id AS student_id, s.name, s.class_id,
    c.name AS class_name, s.roll_number, s.performance_status,
    COALESCE(ma.avg_score, 0) AS avg_score,
    COALESCE(ma.total_exams, 0) AS total_exams,
    COALESCE(aa.total_days, 0) AS total_attendance_days,
    COALESCE(aa.present_days, 0) AS present_days,
    CASE WHEN aa.total_days > 0
        THEN ROUND(aa.present_days * 100.0 / aa.total_days, 1) ELSE 0
    END AS attendance_percentage,
    COALESCE(sa.total_submissions, 0) AS total_submissions,
    COALESCE(sa.graded_submissions, 0) AS graded_submissions,
    COALESCE(sa.avg_sub_score, 0) AS avg_submission_score
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN (
    SELECT student_id, ROUND(AVG(score),2) AS avg_score, COUNT(*) AS total_exams
    FROM marks GROUP BY student_id
) ma ON s.id = ma.student_id
LEFT JOIN (
    SELECT student_id, COUNT(*) AS total_days,
           SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) AS present_days
    FROM attendance GROUP BY student_id
) aa ON s.id = aa.student_id
LEFT JOIN (
    SELECT student_id, COUNT(*) AS total_submissions,
           SUM(CASE WHEN status='Graded' THEN 1 ELSE 0 END) AS graded_submissions,
           ROUND(AVG(CASE WHEN score IS NOT NULL THEN score END),2) AS avg_sub_score
    FROM assignment_submissions GROUP BY student_id
) sa ON s.id = sa.student_id;

-- View 5: Subject-wise performance (3-way JOIN)
CREATE VIEW subject_wise_performance AS
SELECT
    s.id AS student_id, s.name AS student_name,
    sub.id AS subject_id, sub.name AS subject_name,
    c.name AS class_name,
    ROUND(AVG(m.score), 2) AS avg_score,
    MAX(m.score) AS highest_score, MIN(m.score) AS lowest_score,
    COUNT(m.id) AS exam_count
FROM students s
JOIN marks m ON s.id = m.student_id
JOIN subjects sub ON m.subject_id = sub.id
JOIN classes c ON sub.class_id = c.id
GROUP BY s.id, sub.id;

-- View 6: Student GPA (maps avg score to 4.0 scale)
CREATE VIEW student_gpa AS
SELECT
    s.id AS student_id, s.name,
    c.name AS class_name,
    ROUND(AVG(m.score), 2) AS average_score,
    CASE
        WHEN AVG(m.score) >= 90 THEN 4.0  WHEN AVG(m.score) >= 80 THEN 3.5
        WHEN AVG(m.score) >= 70 THEN 3.0  WHEN AVG(m.score) >= 60 THEN 2.5
        WHEN AVG(m.score) >= 50 THEN 2.0  WHEN AVG(m.score) >= 40 THEN 1.5
        ELSE 0.0
    END AS gpa,
    CASE
        WHEN AVG(m.score) >= 90 THEN 'A+'  WHEN AVG(m.score) >= 80 THEN 'A'
        WHEN AVG(m.score) >= 70 THEN 'B'   WHEN AVG(m.score) >= 60 THEN 'C'
        WHEN AVG(m.score) >= 50 THEN 'D'   WHEN AVG(m.score) >= 40 THEN 'E'
        ELSE 'F'
    END AS letter_grade
FROM students s
LEFT JOIN marks m ON s.id = m.student_id
LEFT JOIN classes c ON s.class_id = c.id
GROUP BY s.id;

-- ============================================
-- TRIGGERS — Auto-update & Validation
-- ============================================

-- Trigger 1: Validate score on INSERT (0-100 range)
CREATE TRIGGER validate_score_insert
BEFORE INSERT ON marks
BEGIN
    SELECT CASE WHEN NEW.score < 0 OR NEW.score > 100 THEN
        RAISE(ABORT, 'Score must be between 0 and 100')
    END;
END;

-- Trigger 2: Validate score on UPDATE
CREATE TRIGGER validate_score_update
BEFORE UPDATE ON marks
BEGIN
    SELECT CASE WHEN NEW.score < 0 OR NEW.score > 100 THEN
        RAISE(ABORT, 'Score must be between 0 and 100')
    END;
END;

-- Trigger 3: Auto-update performance status after marks INSERT
CREATE TRIGGER auto_update_performance_status
AFTER INSERT ON marks
BEGIN
    UPDATE students
    SET performance_status = (
        SELECT CASE
            WHEN AVG(score) >= 85 THEN 'Excellent'
            WHEN AVG(score) >= 70 THEN 'Good'
            WHEN AVG(score) >= 55 THEN 'Average'
            WHEN AVG(score) >= 40 THEN 'At Risk'
            ELSE 'Failing'
        END
        FROM marks WHERE student_id = NEW.student_id
    )
    WHERE id = NEW.student_id;
END;

-- Trigger 4: Auto-update performance status after marks UPDATE
CREATE TRIGGER auto_update_performance_status_on_update
AFTER UPDATE ON marks
BEGIN
    UPDATE students
    SET performance_status = (
        SELECT CASE
            WHEN AVG(score) >= 85 THEN 'Excellent'
            WHEN AVG(score) >= 70 THEN 'Good'
            WHEN AVG(score) >= 55 THEN 'Average'
            WHEN AVG(score) >= 40 THEN 'At Risk'
            ELSE 'Failing'
        END
        FROM marks WHERE student_id = NEW.student_id
    )
    WHERE id = NEW.student_id;
END;
