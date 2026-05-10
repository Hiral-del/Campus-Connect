const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const schemaPath = path.resolve(__dirname, 'schema.sql');
const seedPath = path.resolve(__dirname, 'seed.sql');

if (fs.existsSync(dbPath)) {
    console.log('Database already exists. Removing it to start fresh...');
    fs.unlinkSync(dbPath);
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error creating database', err.message);
        process.exit(1);
    }
    console.log('Created SQLite database file.');
});

db.serialize(() => {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql, (err) => {
        if (err) {
            console.error('Error executing schema.sql', err.message);
            process.exit(1);
        }
        console.log('Schema created successfully.');

        const seedSql = fs.readFileSync(seedPath, 'utf8');
        db.exec(seedSql, (err) => {
            if (err) {
                console.error('Error executing seed.sql', err.message);
                process.exit(1);
            }
            console.log('Seed data inserted successfully.');
            
            db.close((err) => {
                if (err) {
                    console.error('Error closing database', err.message);
                } else {
                    console.log('Database initialization complete.');
                }
            });
        });
    });
});
