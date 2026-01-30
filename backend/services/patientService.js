// Core Requirements:
// 1. Search: Find by Name or ID ($O(n)$ or $O(\log n)$)
// 2. Sort: Rank Queue by Triage Level (1-5)

const FIRST_NAMES = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
const LAST_NAMES = ['Smith', 'Doe', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore'];

function initializePatients() {
    console.log("Initializing Mock Patients...");
    global.patients = [];
    global.patientQueue = [];

    // Create 20 mock patients
    for (let i = 1; i <= 20; i++) {
        const p = {
            id: `P-${i}`,
            name: `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`,
            triageLevel: Math.floor(Math.random() * 5) + 1, // 1 (Critical) to 5 (Non-urgent)
            condition: 'Stable',
            joinedAt: Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 4) // Joined 0-4 hours ago
        };
        global.patients.push(p);
        global.patientQueue.push(p);
    }
}

/**
 * Search Function
 * Requirement: Find patients by Name or ID.
 * Implementation: Linear Search O(N).
 * Note: For O(log N), we would need to maintain a sorted array or BST.
 * Given "Unsorted" nature of names usually, O(N) is standard unless indexed.
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
 * Example: Triage 3 waiting 2 hours = 3 - 2 = 1 (Same priority as "Fresh" Triage 1).
 */
function getSortedQueue() {
    // Clone to safely sort
    const queueState = [...global.patientQueue];
    const now = Date.now();

    // Sorting Logic
    queueState.sort((a, b) => {
        // Calculate wait time in hours (mock data might need mock joinedAt)
        // If joinedAt is missing, assume 0 wait (newly added)
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
        ...patientData
    };
    global.patients.push(newPatient);
    global.patientQueue.push(newPatient);

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
