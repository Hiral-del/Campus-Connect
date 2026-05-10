const fs = require('fs');

const teachers = [
    { name: 'Dr. A. Sharma', dept: 'Computer Science', username: 'dr_sharma' },
    { name: 'Prof. R. Patel', dept: 'Information Tech', username: 'prof_patel' },
    { name: 'Dr. K. Gupta', dept: 'Computer Science', username: 'dr_gupta' },
    { name: 'Prof. S. Singh', dept: 'Software Eng', username: 'prof_singh' },
    { name: 'Dr. M. Reddy', dept: 'Computer Science', username: 'dr_reddy' }
];

const firstNames = ['Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna','Ishaan','Shaurya','Atharva','Kabir','Ojas','Rudra','Ananya','Diya','Suhana','Myra','Saanvi','Aadhya','Kiara','Navya','Zara','Kavya','Pari','Anika','Ira','Sara','Riya'];
const lastNames = ['Sharma','Patel','Kumar','Singh','Reddy','Gupta','Das','Bose','Verma','Nair','Mehta','Chauhan','Joshi','Yadav','Rajput'];

const students = [];
for(let i=0; i<30; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    students.push({
        name: `${fn} ${ln}`,
        username: `${fn.toLowerCase()}${i}`,
        guardian: `Mr. ${ln}`
    });
}

const subjects = [
    { name: 'Data Structures', isLab: false, tIdx: 0 },
    { name: 'Operating Systems', isLab: false, tIdx: 1 },
    { name: 'DBMS', isLab: false, tIdx: 2 },
    { name: 'Computer Networks', isLab: false, tIdx: 3 },
    { name: 'Software Engineering', isLab: false, tIdx: 4 },
    { name: 'DSA Lab', isLab: true, tIdx: 0 },
    { name: 'OS Lab', isLab: true, tIdx: 1 }
];

let sql = `-- ============================================
-- Auto-Generated Seed Data for Campus Connect
-- 5 Teachers, 30 Students, 7 Subjects
-- ============================================

-- Admin
INSERT INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin');\n\n`;

// Teachers Users & Records
sql += `-- Teachers\n`;
teachers.forEach(t => {
    sql += `INSERT INTO users (username, password, role) VALUES ('${t.username}', 'prof123', 'teacher');\n`;
});
let uid = 2;
teachers.forEach((t, i) => {
    sql += `INSERT INTO teachers (user_id, name, department, phone) VALUES (${uid}, '${t.name}', '${t.dept}', '987654321${i}');\n`;
    uid++;
});

// Classes
sql += `\n-- Classes\n`;
sql += `INSERT INTO classes (name, grade, section, room_number, academic_year) VALUES ('B.Tech CSE', 'Sem 4', 'A', 'Lab 101', '2025-2026');\n`;
sql += `INSERT INTO classes (name, grade, section, room_number, academic_year) VALUES ('B.Tech CSE', 'Sem 4', 'B', 'Lab 102', '2025-2026');\n`;

// Students Users & Records
sql += `\n-- Students\n`;
let classId = 1, roll = 101;
students.forEach((s, i) => {
    if (i === 15) { classId = 2; roll = 201; }
    sql += `INSERT INTO users (username, password, role) VALUES ('${s.username}', 'student123', 'student');\n`;
    
    // Determine performance status purely for seeding randomly
    const p = Math.random();
    let status = p > 0.8 ? 'Excellent' : p > 0.4 ? 'Good' : p > 0.15 ? 'Average' : 'At Risk';
    
    sql += `INSERT INTO students (user_id, name, class_id, roll_number, guardian_name, performance_status) VALUES (${uid}, '${s.name}', ${classId}, ${roll}, '${s.guardian}', '${status}');\n`;
    s.id = i + 1;
    s.classId = classId;
    s.status = status;
    uid++; roll++;
});

// Subjects
sql += `\n-- Subjects\n`;
let subId = 1;
const classSubjects = []; // stores { classId, subjectId, tIdx }
[1, 2].forEach(cid => {
    subjects.forEach(sub => {
        sql += `INSERT INTO subjects (name, class_id, teacher_id) VALUES ('${sub.name}', ${cid}, ${sub.tIdx + 1});\n`;
        classSubjects.push({ cid, subId, isLab: sub.isLab });
        subId++;
    });
});

// Marks
sql += `\n-- Marks\n`;
students.forEach(s => {
    const mySubjects = classSubjects.filter(sub => sub.cid === s.classId);
    let baseScore = s.status === 'Excellent' ? 85 : s.status === 'Good' ? 70 : s.status === 'Average' ? 50 : 35;
    
    mySubjects.forEach(sub => {
        const midScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 20 - 10)));
        const endScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 20 - 5)));
        sql += `INSERT INTO marks (student_id, subject_id, score, exam_type) VALUES (${s.id}, ${sub.subId}, ${midScore}, 'Mid-Sem');\n`;
        sql += `INSERT INTO marks (student_id, subject_id, score, exam_type) VALUES (${s.id}, ${sub.subId}, ${endScore}, 'End-Sem');\n`;
    });
});

// Attendance (Generate 10 days)
sql += `\n-- Attendance\n`;
const dates = ['2026-04-01','2026-04-02','2026-04-03','2026-04-04','2026-04-07','2026-04-08','2026-04-09','2026-04-10','2026-04-11','2026-04-14'];
students.forEach(s => {
    let attProb = s.status === 'Excellent' ? 0.95 : s.status === 'Good' ? 0.85 : s.status === 'Average' ? 0.70 : 0.50;
    dates.forEach(d => {
        const r = Math.random();
        const status = r < attProb ? 'Present' : r < (attProb + 0.05) ? 'Late' : 'Absent';
        sql += `INSERT INTO attendance (student_id, class_id, date, status) VALUES (${s.id}, ${s.classId}, '${d}', '${status}');\n`;
    });
});

// Write to file
fs.writeFileSync('seed.sql', sql);
console.log('seed.sql generated successfully with large dataset!');
