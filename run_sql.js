const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const sqlPath = path.resolve(__dirname, 'update_username.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Split SQL by semicolon and run each statement
    const statements = sql.split(';')
        .map(s => s.replace(/--.*$/gm, '').trim()) // Remove comments and trim
        .filter(s => s.length > 0);
    
    let count = 0;
    statements.forEach(stmt => {
        db.run(stmt, (err) => {
            if (err) {
                console.error('Error executing statement:', stmt);
                console.error(err.message);
                process.exit(1);
            }
            count++;
            if (count === statements.length) {
                console.log('Successfully executed all SQL statements.');
                db.close();
            }
        });
    });
});
