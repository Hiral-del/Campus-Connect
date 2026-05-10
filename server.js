const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'frontend')));

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Error opening database', err.message);
    else console.log('Connected to the SQLite database.');
});
db.run('PRAGMA foreign_keys = ON');

// ==================== AUTH ====================
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT id, username, role FROM users WHERE username = ? AND password = ?`,
        [username, password], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });

        if (row.role === 'student') {
            db.get(`SELECT id, name, class_id FROM students WHERE user_id = ?`, [row.id], (e, s) => {
                if (e) return res.status(500).json({ error: e.message });
                res.json({ ...row, student_id: s?.id, name: s?.name, class_id: s?.class_id });
            });
        } else if (row.role === 'teacher') {
            db.get(`SELECT id, name, department FROM teachers WHERE user_id = ?`, [row.id], (e, t) => {
                if (e) return res.status(500).json({ error: e.message });
                res.json({ ...row, teacher_id: t?.id, name: t?.name, department: t?.department });
            });
        } else {
            res.json(row);
        }
    });
});

// ==================== CLASSES ====================
app.get('/api/classes', (req, res) => {
    db.all(`SELECT * FROM class_overview`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ classes: rows });
    });
});

app.get('/api/classes/:id', (req, res) => {
    db.get(`SELECT * FROM class_overview WHERE class_id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Class not found' });
        res.json({ class: row });
    });
});

app.post('/api/classes', (req, res) => {
    const { name, grade, section, room_number, academic_year } = req.body;
    db.run(`INSERT INTO classes (name, grade, section, room_number, academic_year) VALUES (?,?,?,?,?)`,
        [name, grade, section || 'A', room_number, academic_year || '2025-2026'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Class created' });
    });
});

// ==================== TEACHERS ====================
app.get('/api/teachers', (req, res) => {
    db.all(`SELECT t.*, u.username, ROUND(AVG(m.score), 2) AS avg_score
        FROM teachers t 
        JOIN users u ON t.user_id = u.id
        LEFT JOIN subjects s ON s.teacher_id = t.id
        LEFT JOIN marks m ON m.subject_id = s.id
        GROUP BY t.id`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ teachers: rows });
    });
});

app.get('/api/teachers/:id/classes', (req, res) => {
    db.all(`SELECT DISTINCT c.* FROM classes c
        JOIN subjects sub ON c.id = sub.class_id
        WHERE sub.teacher_id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ classes: rows });
    });
});

// ==================== SUBJECTS ====================
app.get('/api/subjects', (req, res) => {
    db.all(`SELECT s.*, c.name AS class_name FROM subjects s JOIN classes c ON s.class_id = c.id`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ subjects: rows });
    });
});

// ==================== STUDENTS ====================
app.get('/api/students', (req, res) => {
    const classId = req.query.class_id;
    let sql = `SELECT s.id, s.name, s.class_id, s.roll_number, s.guardian_name,
        s.performance_status, c.name AS class_name, u.username
        FROM students s JOIN users u ON s.user_id = u.id
        LEFT JOIN classes c ON s.class_id = c.id`;
    const params = [];
    if (classId) { sql += ` WHERE s.class_id = ?`; params.push(classId); }
    sql += ` ORDER BY s.class_id, s.roll_number`;
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ students: rows });
    });
});

app.get('/api/classes/:id/students', (req, res) => {
    db.all(`SELECT * FROM students WHERE class_id = ? ORDER BY roll_number`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ students: rows });
    });
});

// ==================== MARKS ====================
app.get('/api/marks/:id', (req, res) => {
    db.all(`SELECT m.*, s.name AS subject_name 
        FROM marks m JOIN subjects s ON m.subject_id = s.id 
        WHERE m.student_id = ?`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ marks: rows });
    });
});

app.post('/api/marks', (req, res) => {
    const { student_id, subject_id, score, exam_type } = req.body;
    db.run(`INSERT INTO marks (student_id, subject_id, score, exam_type) VALUES (?, ?, ?, ?)`,
        [student_id, subject_id, score, exam_type || 'Midterm'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Marks added' });
    });
});

// ==================== ATTENDANCE ====================
app.get('/api/attendance/:id', (req, res) => {
    db.all(`SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC`, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ attendance: rows });
    });
});

app.post('/api/attendance/bulk', (req, res) => {
    const { class_id, date, records } = req.body;
    if (!records || !records.length) return res.status(400).json({ error: 'No records provided' });

    const placeholder = records.map(() => '(?, ?, ?, ?)').join(', ');
    const params = [];
    records.forEach(r => {
        params.push(r.student_id, class_id, date, r.status);
    });

    db.run(`INSERT INTO attendance (student_id, class_id, date, status) VALUES ${placeholder}`, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Attendance saved successfully', count: records.length });
    });
});



// ==================== SUBJECTS ====================
app.get('/api/subjects', (req, res) => {
    const classId = req.query.class_id;
    let sql = `SELECT sub.*, c.name AS class_name, t.name AS teacher_name
        FROM subjects sub
        JOIN classes c ON sub.class_id = c.id
        LEFT JOIN teachers t ON sub.teacher_id = t.id`;
    const params = [];
    if (classId) { sql += ` WHERE sub.class_id = ?`; params.push(classId); }
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ subjects: rows });
    });
});

// ==================== MARKS ====================
app.get('/api/marks/:studentId', (req, res) => {
    db.all(`SELECT m.id, sub.name AS subject_name, m.score, m.exam_type, m.recorded_at
        FROM marks m JOIN subjects sub ON m.subject_id = sub.id
        WHERE m.student_id = ? ORDER BY m.recorded_at DESC`,
        [req.params.studentId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ marks: rows });
    });
});

app.post('/api/marks', (req, res) => {
    const { student_id, subject_id, score, exam_type } = req.body;
    db.run(`INSERT INTO marks (student_id, subject_id, score, exam_type) VALUES (?,?,?,?)`,
        [student_id, subject_id, score, exam_type || 'Midterm'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Marks added' });
    });
});

// ==================== ATTENDANCE ====================
app.get('/api/attendance/:studentId', (req, res) => {
    db.all(`SELECT date, status FROM attendance WHERE student_id = ? ORDER BY date DESC`,
        [req.params.studentId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ attendance: rows });
    });
});

app.get('/api/classes/:id/attendance', (req, res) => {
    const date = req.query.date;
    let sql = `SELECT a.*, s.name AS student_name, s.roll_number
        FROM attendance a JOIN students s ON a.student_id = s.id WHERE a.class_id = ?`;
    const params = [req.params.id];
    if (date) { sql += ` AND a.date = ?`; params.push(date); }
    sql += ` ORDER BY a.date DESC, s.roll_number`;
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ attendance: rows });
    });
});

app.post('/api/attendance', (req, res) => {
    const { student_id, class_id, date, status } = req.body;
    db.run(`INSERT INTO attendance (student_id, class_id, date, status) VALUES (?,?,?,?)`,
        [student_id, class_id, date, status], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Attendance recorded' });
    });
});

app.post('/api/attendance/bulk', (req, res) => {
    const { class_id, date, records } = req.body;
    const stmt = db.prepare(`INSERT INTO attendance (student_id, class_id, date, status) VALUES (?,?,?,?)`);
    let count = 0;
    db.serialize(() => {
        records.forEach(r => {
            stmt.run([r.student_id, class_id, date, r.status], (err) => {
                if (!err) count++;
            });
        });
        stmt.finalize(() => {
            res.json({ message: `${count} attendance records saved` });
        });
    });
});

// ==================== ASSIGNMENTS ====================
app.get('/api/assignments', (req, res) => {
    const classId = req.query.class_id;
    let sql = `SELECT a.*, sub.name AS subject_name, c.name AS class_name
        FROM assignments a
        JOIN subjects sub ON a.subject_id = sub.id
        JOIN classes c ON sub.class_id = c.id`;
    const params = [];
    if (classId) { sql += ` WHERE sub.class_id = ?`; params.push(classId); }
    sql += ` ORDER BY a.due_date DESC`;
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ assignments: rows });
    });
});

app.post('/api/assignments', (req, res) => {
    const { subject_id, title, description, due_date, max_score } = req.body;
    db.run(`INSERT INTO assignments (subject_id, title, description, due_date, max_score) VALUES (?,?,?,?,?)`,
        [subject_id, title, description, due_date, max_score || 100], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Assignment created' });
    });
});

app.get('/api/assignment-submissions/:studentId', (req, res) => {
    db.all(`SELECT asub.*, a.title, a.due_date, a.max_score, sub.name AS subject_name
        FROM assignment_submissions asub
        JOIN assignments a ON asub.assignment_id = a.id
        JOIN subjects sub ON a.subject_id = sub.id
        WHERE asub.student_id = ? ORDER BY a.due_date DESC`,
        [req.params.studentId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ submissions: rows });
    });
});

// ==================== TIMETABLE ====================
app.get('/api/timetable/:classId', (req, res) => {
    const day = req.query.day;
    let sql = `SELECT tt.*, sub.name AS subject_name, t.name AS teacher_name
        FROM timetable tt
        JOIN subjects sub ON tt.subject_id = sub.id
        LEFT JOIN teachers t ON sub.teacher_id = t.id
        WHERE tt.class_id = ?`;
    const params = [req.params.classId];
    if (day) { sql += ` AND tt.day_of_week = ?`; params.push(day); }
    sql += ` ORDER BY CASE tt.day_of_week
        WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
        WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 END,
        tt.start_time`;
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ timetable: rows });
    });
});

// ==================== ANNOUNCEMENTS ====================
app.get('/api/announcements', (req, res) => {
    const classId = req.query.class_id;
    let sql = `SELECT an.*, u.username AS author, c.name AS class_name
        FROM announcements an
        JOIN users u ON an.user_id = u.id
        LEFT JOIN classes c ON an.class_id = c.id
        WHERE an.class_id IS NULL`;
    const params = [];
    if (classId) { sql = sql.replace('WHERE an.class_id IS NULL', 'WHERE (an.class_id IS NULL OR an.class_id = ?)'); params.push(classId); }
    sql += ` ORDER BY an.created_at DESC`;
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ announcements: rows });
    });
});

app.post('/api/announcements', (req, res) => {
    const { class_id, user_id, title, content } = req.body;
    db.run(`INSERT INTO announcements (class_id, user_id, title, content) VALUES (?,?,?,?)`,
        [class_id || null, user_id, title, content], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, message: 'Announcement posted' });
    });
});

// ==================== ANALYTICS (using VIEWS) ====================
app.get('/api/analytics/summary', (req, res) => {
    const studentId = req.query.student_id;
    let sql = `SELECT * FROM student_dashboard_summary`;
    const params = [];
    if (studentId) {
        sql += ` WHERE student_id = ?`;
        params.push(studentId);
    }
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

app.get('/api/analytics/class-performance', (req, res) => {
    db.all(`SELECT * FROM class_performance_summary`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

app.get('/api/analytics/average-scores', (req, res) => {
    db.all(`SELECT * FROM student_average_score ORDER BY average_score DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

app.get('/api/analytics/subject-performance', (req, res) => {
    db.all(`SELECT * FROM subject_wise_performance ORDER BY student_name, subject_name`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

app.get('/api/analytics/gpa', (req, res) => {
    db.all(`SELECT * FROM student_gpa ORDER BY gpa DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: rows });
    });
});

app.get('/api/analytics/dashboard-stats', (req, res) => {
    const stats = {};
    db.get(`SELECT COUNT(*) as c FROM classes`, [], (e, r) => {
        stats.totalClasses = r?.c || 0;
        db.get(`SELECT COUNT(*) as c FROM students`, [], (e2, r2) => {
            stats.totalStudents = r2?.c || 0;
            db.get(`SELECT COUNT(*) as c FROM teachers`, [], (e3, r3) => {
                stats.totalTeachers = r3?.c || 0;
                db.get(`SELECT ROUND(AVG(score),2) as avg FROM marks`, [], (e4, r4) => {
                    stats.classAverage = r4?.avg || 0;
                    db.get(`SELECT ROUND(SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END)*100.0/COUNT(*),1) as rate FROM attendance`, [], (e5, r5) => {
                        stats.overallAttendance = r5?.rate || 0;
                        db.all(`SELECT performance_status, COUNT(*) as count FROM students GROUP BY performance_status`, [], (e6, r6) => {
                            stats.statusDistribution = r6 || [];
                            res.json({ stats });
                        });
                    });
                });
            });
        });
    });
});

// ==================== USERS (Admin) ====================
app.get('/api/users', (req, res) => {
    db.all(`SELECT id, username, role, created_at FROM users`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ users: rows });
    });
});

// Fallback to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Campus Connect running on http://localhost:${PORT}`);
});
