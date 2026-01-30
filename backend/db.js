const Database = require('better-sqlite3');
const path = require('path');

// Initialize database
const dbPath = path.join(__dirname, 'hospital.db');
const db = new Database(dbPath);

console.log('SQLite database initialized at:', dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
function initializeSchema() {
    // Beds table
    db.exec(`
        CREATE TABLE IF NOT EXISTS beds (
            id TEXT PRIMARY KEY,
            ward TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Available',
            distanceFromStation INTEGER NOT NULL,
            type TEXT NOT NULL,
            patientData TEXT
        )
    `);

    // Patients table (for queue)
    db.exec(`
        CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            triageLevel INTEGER NOT NULL,
            condition TEXT NOT NULL,
            joinedAt INTEGER NOT NULL
        )
    `);

    console.log('Database schema initialized');
}

// Seed initial beds if table is empty
function seedBeds() {
    const count = db.prepare('SELECT COUNT(*) as count FROM beds').get();

    if (count.count === 0) {
        console.log('Seeding initial 50 beds...');

        const insert = db.prepare(`
            INSERT INTO beds (id, ward, status, distanceFromStation, type, patientData)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        const beds = [];

        // ICU: 10 beds
        for (let i = 1; i <= 10; i++) {
            beds.push({
                id: `BED-${i}`,
                ward: 'ICU',
                status: 'Available',
                distanceFromStation: Math.floor(Math.random() * 10) + 1,
                type: 'Critical',
                patientData: null
            });
        }

        // Cardiology: 10 beds
        for (let i = 11; i <= 20; i++) {
            beds.push({
                id: `BED-${i}`,
                ward: 'Cardiology',
                status: 'Available',
                distanceFromStation: Math.floor(Math.random() * 10) + 1,
                type: 'Standard',
                patientData: null
            });
        }

        // General: 20 beds
        for (let i = 21; i <= 40; i++) {
            beds.push({
                id: `BED-${i}`,
                ward: 'General',
                status: 'Available',
                distanceFromStation: Math.floor(Math.random() * 10) + 1,
                type: 'Standard',
                patientData: null
            });
        }

        // Pediatrics: 10 beds
        for (let i = 41; i <= 50; i++) {
            beds.push({
                id: `BED-${i}`,
                ward: 'Pediatrics',
                status: 'Available',
                distanceFromStation: Math.floor(Math.random() * 10) + 1,
                type: 'Standard',
                patientData: null
            });
        }

        // Insert all beds in a transaction
        const insertMany = db.transaction((beds) => {
            for (const bed of beds) {
                insert.run(bed.id, bed.ward, bed.status, bed.distanceFromStation, bed.type, bed.patientData);
            }
        });

        insertMany(beds);
        console.log(`Seeded ${beds.length} beds successfully`);
    } else {
        console.log(`Database already contains ${count.count} beds, skipping seed`);
    }
}

// Initialize database
initializeSchema();
seedBeds();

// Export database and helper functions
module.exports = {
    db,

    // Bed operations
    getAllBeds() {
        const rows = db.prepare('SELECT * FROM beds').all();
        return rows.map(row => ({
            ...row,
            patient: row.patientData ? JSON.parse(row.patientData) : null,
            patientData: undefined // Remove raw JSON field
        }));
    },

    updateBed(id, updates) {
        const { status, patientData } = updates;
        const stmt = db.prepare(`
            UPDATE beds 
            SET status = ?, patientData = ?
            WHERE id = ?
        `);
        stmt.run(status, patientData ? JSON.stringify(patientData) : null, id);
    },

    insertBed(bed) {
        const stmt = db.prepare(`
            INSERT INTO beds (id, ward, status, distanceFromStation, type, patientData)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(bed.id, bed.ward, bed.status, bed.distanceFromStation, bed.type, null);
    },

    deleteBed(id) {
        const stmt = db.prepare('DELETE FROM beds WHERE id = ?');
        stmt.run(id);
    },

    // Patient operations
    getAllPatients() {
        return db.prepare('SELECT * FROM patients').all();
    },

    insertPatient(patient) {
        const stmt = db.prepare(`
            INSERT INTO patients (id, name, triageLevel, condition, joinedAt)
            VALUES (?, ?, ?, ?, ?)
        `);
        stmt.run(patient.id, patient.name, patient.triageLevel, patient.condition, patient.joinedAt);
    },

    deletePatient(id) {
        const stmt = db.prepare('DELETE FROM patients WHERE id = ?');
        stmt.run(id);
    }
};
