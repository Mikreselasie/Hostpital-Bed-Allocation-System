const WARDS = ['ICU', 'Cardiology', 'General', 'Pediatrics'];
const { db, getAllBeds: getAllBedsFromDB, updateBed, insertBed, deleteBed } = require('../db');

/**
 * Loads all beds from SQLite database into the global HashMap.
 */
function initializeBeds() {
    console.log("Loading beds from database...");
    global.beds.clear();

    const bedsFromDB = getAllBedsFromDB();

    for (const bed of bedsFromDB) {
        global.beds.set(bed.id, bed);
    }

    console.log(`Loaded ${bedsFromDB.length} beds from database`);
}

/**
 * Updates a bed's status.
 * Data Structure: Hash Map allows O(1) retrieval and update.
 */
function updateBedStatus(bedId, newStatus) {
    if (!global.beds.has(bedId)) {
        return null;
    }

    const bed = global.beds.get(bedId);
    bed.status = newStatus;

    // Persist to database
    updateBed(bedId, { status: newStatus, patientData: bed.patient });

    // Core Requirement: WebSocket Update
    if (global.io) {
        global.io.emit('bedUpdate', bed);
    }

    return bed;
}

/**
 * Helper to get all beds as array for API response, optionally filtered.
 * Logic: If statusFilter is null, returns all beds from the Hash Table.
 * If statusFilter is provided, return only matching beds.
 */
function getAllBeds(statusFilter = null) {
    const allBeds = Array.from(global.beds.values());
    if (statusFilter) {
        return allBeds.filter(bed => bed.status.toLowerCase() === statusFilter.toLowerCase());
    }
    return allBeds;
}

/**
 * Transfers a patient from one bed to another.
 * Logic: Source (Occupied) -> Cleaning. Target (Available) -> Occupied.
 */
function transferPatient(sourceBedId, targetBedId) {
    const sourceBed = global.beds.get(sourceBedId);
    const targetBed = global.beds.get(targetBedId);

    if (!sourceBed || sourceBed.status !== 'Occupied') {
        throw new Error('Source bed must be Occupied');
    }
    if (!targetBed || targetBed.status !== 'Available') {
        throw new Error('Target bed must be Available');
    }

    // Perform Transfer (Atomic-like in-memory)
    // Move patient data to target
    targetBed.status = 'Occupied';
    targetBed.patient = sourceBed.patient;

    // Clear source
    sourceBed.status = 'Cleaning';
    sourceBed.patient = null;

    // Persist to database
    updateBed(targetBedId, { status: 'Occupied', patientData: targetBed.patient });
    updateBed(sourceBedId, { status: 'Cleaning', patientData: null });

    // Real-time Updates
    if (global.io) {
        global.io.emit('bedUpdate', sourceBed);
        global.io.emit('bedUpdate', targetBed);
    }

    return { sourceBed, targetBed };
}

/**
 * Discharges a patient (Sets status to Cleaning)
 */
function dischargePatient(bedId) {
    const bed = global.beds.get(bedId);
    if (!bed) return null;

    bed.status = 'Cleaning';
    bed.patient = null;

    // Persist to database
    updateBed(bedId, { status: 'Cleaning', patientData: null });

    if (global.io) global.io.emit('bedUpdate', bed);
    return bed;
}

/**
 * Manually assigns a specific bed.
 */
function assignBedManual(bedId, patient) {
    const bed = global.beds.get(bedId);
    if (!bed) throw new Error('Bed not found');
    if (bed.status !== 'Available') throw new Error('Bed is not available');

    bed.status = 'Occupied';
    bed.patient = patient; // Store full patient object

    // Persist to database
    updateBed(bedId, { status: 'Occupied', patientData: patient });

    if (global.io) global.io.emit('bedUpdate', bed);
    return bed;
}

/**
 * Smart Assignment (Greedy Algorithm)
 * Logic:
 * 1. Filter for Available beds matching the Medical Requirement (Ward).
 * 2. Greedy Choice: Pick the one with Minimum Distance from station.
 */
function assignBedGreedy(patientProfile) {
    const { needs, patient } = patientProfile; // e.g. 'ICU', 'General'

    // O(N) scan to find candidates
    let candidates = [];

    // 1. Try to find beds matching the specific need
    for (const bed of global.beds.values()) {
        if (bed.status === 'Available' && bed.ward === needs) {
            candidates.push(bed);
        }
    }

    // 2. Fallback: If no beds match the need, find ANY available bed
    if (candidates.length === 0) {
        for (const bed of global.beds.values()) {
            if (bed.status === 'Available') {
                candidates.push(bed);
            }
        }
    }

    if (candidates.length === 0) {
        return null; // No bed found at all
    }

    // Greedy Step: Find min distance
    // Using a simple loop is O(M) where M is num candidates.
    let bestBed = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
        if (candidates[i].distanceFromStation < bestBed.distanceFromStation) {
            bestBed = candidates[i];
        }
    }

    // Occupy the bed
    bestBed.status = 'Occupied';
    bestBed.patient = patient; // Store patient data

    // Persist to database
    updateBed(bestBed.id, { status: 'Occupied', patientData: patient });

    if (global.io) global.io.emit('bedUpdate', bestBed);
    return bestBed;
}

/**
 * Adds a new bed to a specific ward.
 */
function addBed(ward) {
    let idNum = global.beds.size + 1;
    let bedId = `BED-${idNum}`;
    while (global.beds.has(bedId)) {
        idNum++;
        bedId = `BED-${idNum}`;
    }

    const bed = {
        id: bedId,
        ward: ward,
        status: 'Available',
        distanceFromStation: Math.floor(Math.random() * 100) + 1,
        type: ward === 'ICU' ? 'Critical' : 'Standard'
    };

    global.beds.set(bedId, bed);

    // Persist to database
    insertBed(bed);

    if (global.io) {
        global.io.emit('bedUpdate', bed);
    }
    return bed;
}

/**
 * Removes a bed from the system.
 */
function removeBed(bedId) {
    const bed = global.beds.get(bedId);
    if (!bed) throw new Error('Bed not found');

    if (bed.status === 'Occupied') {
        throw new Error('Cannot remove an occupied bed');
    }

    global.beds.delete(bedId);

    // Persist to database
    deleteBed(bedId);

    if (global.io) {
        global.io.emit('bedRemoved', bedId);
    }
    return true;
}

module.exports = {
    initializeBeds,
    updateBedStatus,
    getAllBeds,
    assignBedGreedy,
    transferPatient,
    dischargePatient,
    assignBedManual,
    addBed,
    removeBed
};
