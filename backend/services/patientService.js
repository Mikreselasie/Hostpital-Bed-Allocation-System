// Core Requirements:
// 1. Search: Find by Name or ID ($O(n)$ or $O(\log n)$)
// 2. Sort: Rank Queue by Triage Level (1-5)

const { db, getAllPatients, insertPatient, deletePatient } = require('../db');

function initializePatients() {
    console.log("Loading patients from database...");
    global.patients = [];
    global.patientQueue = [];

    const patientsFromDB = getAllPatients();

    for (const p of patientsFromDB) {
        global.patients.push(p);
        global.patientQueue.push(p);
    }

    console.log(`Loaded ${patientsFromDB.length} patients from database`);
}

/**
 * Search Function
 * Requirement: Find patients by Name or ID.
 * Implementation: Linear Search O(N).
 */
function searchPatients(query) {
    if (!query) return global.patients;

    const lowerQuery = query.toLowerCase();

    // Linear Search: O(N)
    return global.patients.filter(p =>
        p.id.toLowerCase().includes(lowerQuery) ||
        p.name.toLowerCase().includes(lowerQuery)
    );
}

/**
 * Sort Function
 * Requirement: Rank Queue by Triage Level (1-5) and Wait Time.
 * Logic: Effective Score = TriageLevel - (WaitHours).
 * Lower Score = Higher Priority.
 */
function getSortedQueue() {
    // Clone to safely sort
    const queueState = [...global.patientQueue];
    const now = Date.now();

    // Sorting Logic
    queueState.sort((a, b) => {
        const waitA = a.joinedAt ? (now - a.joinedAt) / (1000 * 60 * 60) : 0;
        const waitB = b.joinedAt ? (now - b.joinedAt) / (1000 * 60 * 60) : 0;

        const scoreA = a.triageLevel - waitA;
        const scoreB = b.triageLevel - waitB;

        return scoreA - scoreB; // Ascending Order of Score
    });

    return queueState;
}

/**
 * Adds a new patient to the queue
 */
function addPatient(patientData) {
    const newPatient = {
        id: `P-${Math.floor(Math.random() * 10000)}`, // Simple Random ID
        joinedAt: Date.now(), // Track entry time
        condition: 'Stable', // Default condition
        ...patientData
    };

    global.patients.push(newPatient);
    global.patientQueue.push(newPatient);

    // Persist to database
    insertPatient(newPatient);

    // Real-time update
    if (global.io) {
        global.io.emit('queueUpdate', getSortedQueue());
    }

    return newPatient;
}

/**
 * Removes a patient from the queue (and system).
 */
function removePatient(patientId) {
    const pIndex = global.patients.findIndex(p => p.id === patientId);
    if (pIndex === -1) return false;

    global.patients.splice(pIndex, 1);

    const qIndex = global.patientQueue.findIndex(p => p.id === patientId);
    if (qIndex !== -1) {
        global.patientQueue.splice(qIndex, 1);
    }

    // Persist to database
    deletePatient(patientId);

    if (global.io) {
        global.io.emit('queueUpdate', getSortedQueue());
    }
    return true;
}

module.exports = {
    initializePatients,
    searchPatients,
    getSortedQueue,
    addPatient,
    removePatient
};
