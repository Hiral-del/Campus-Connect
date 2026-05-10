const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const studentsData = [
    { enrollment: '24100BTCSFB117551', name: 'Samiksha Jha' },
    { enrollment: '24100BTCSFB118254', name: 'Sumit Surana' },
    { enrollment: '24100BTCSFB117552', name: 'Sarthak Bajpai' },
    { enrollment: '24100BTCSFB117544', name: 'Krishna Sayar' },
    { enrollment: '24100BTCSFB117542', name: 'Hiral Sharma' },
    { enrollment: '24100BTCSFB117549', name: 'Radhika Upadhyay' },
    { enrollment: '24100BTCSFB117538', name: 'Anjali Rathore' },
    { enrollment: '24100BTCSFB117548', name: 'Pragya Vyas' },
    { enrollment: '24100BTCSFB117501', name: 'Akshat Bakshi' },
    { enrollment: '24100BTCSFB117506', name: 'Gaurang Patil' },
    { enrollment: '24100BTCSFB117500', name: 'Abhay Upadhyay' },
    { enrollment: '24100BTCSFB117509', name: 'Muskan Mandloi' },
    { enrollment: '24100BTCSFB117516', name: 'Harshay Thakur' },
    { enrollment: '24100BTCSFB117502', name: 'Archie Verma' },
    { enrollment: '24100BTCSFB117503', name: 'Asmi Goyal' },
    { enrollment: '24100BTCSFB117507', name: 'Kanak Malviya' },
    { enrollment: '24100BTCSFB114417', name: 'Aditya Tiwari' },
    { enrollment: '24100BTCSFB114170', name: 'Prerna Kesharwani' }
];

db.serialize(() => {
    console.log('Starting logbook import...');

    // 1. Create Class
    db.run(`INSERT INTO classes (name, grade, section, room_number, academic_year) 
            VALUES (?, ?, ?, ?, ?)`, 
            ['B.Tech CSE', 'Sem III', 'ISCC-A', 'NCL', '2025-2026'], function(err) {
        if (err) return console.error(err.message);
        const classId = this.lastID;
        console.log(`Created Class with ID: ${classId}`);

        // 2. Create Subject
        db.run(`INSERT INTO subjects (name, class_id) VALUES (?, ?)`, ['FDS Lab', classId], function(err) {
            if (err) return console.error(err.message);
            console.log(`Created Subject: FDS Lab`);

            // 3. Process Students
            studentsData.forEach((student, index) => {
                const username = student.enrollment.toLowerCase();
                db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`, 
                    [username, 'student123', 'student'], function(err) {
                    if (err) return console.error(`Error creating user ${username}:`, err.message);
                    const userId = this.lastID;

                    db.run(`INSERT INTO students (user_id, name, class_id, roll_number) VALUES (?, ?, ?, ?)`,
                        [userId, student.name, classId, index + 1], function(err) {
                        if (err) return console.error(`Error creating student ${student.name}:`, err.message);
                        const studentId = this.lastID;

                        // 4. Mark Attendance
                        db.run(`INSERT INTO attendance (student_id, class_id, date, status) VALUES (?, ?, ?, ?)`,
                            [studentId, classId, '2025-10-29', 'Present'], function(err) {
                            if (err) return console.error(`Error marking attendance for ${student.name}:`, err.message);
                            console.log(`Successfully imported: ${student.name}`);
                        });
                    });
                });
            });
        });
    });
});
