const express = require('express');
const router = express.Router();
const bedService = require('../services/bedService');
const patientService = require('../services/patientService');

// -- Bed Routes --

// GET /api/beds - Retrieve all beds (with optional status filter)
router.get('/beds', (req, res) => {
    const { status } = req.query;
    const beds = bedService.getAllBeds(status);
    res.json(beds);
});

// PATCH /api/beds/:id/status - Update bed status
// Requirement: O(1) update via Hash Map
router.patch('/beds/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
        return res.status(400).json({ error: 'Status is required' });
    }

    const updatedBed = bedService.updateBedStatus(id, status);

    if (!updatedBed) {
        return res.status(404).json({ error: 'Bed not found' });
    }

    res.json(updatedBed);
});

// POST /api/beds - Create new bed
router.post('/beds', (req, res) => {
    const { ward } = req.body;
    if (!ward) return res.status(400).json({ error: 'Ward is required' });

    try {
        const bed = bedService.addBed(ward);
        res.json({ success: true, bed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/beds/:id - Remove a bed
router.delete('/beds/:id', (req, res) => {
    try {
        bedService.removeBed(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST /api/beds/assign - Smart or Manual Assignment
router.post('/beds/assign', (req, res) => {
    const { needs, urgency, bedId, patientId } = req.body;

    // Lookup the patient object from patientId
    let patient = null;
    if (patientId) {
        // Search in global patients array
        const allPatients = patientService.searchPatients(patientId);
        patient = allPatients.find(p => p.id === patientId);
    }

    if (!patient) {
        return res.status(400).json({ error: 'Valid Patient ID is required for assignment' });
    }

    try {
        let assignedBed;

        if (bedId) {
            // Manual Assignment - pass patient object
            assignedBed = bedService.assignBedManual(bedId, patient);
        } else {
            // Smart (Greedy) Assignment - pass patient object
            if (!needs) {
                return res.status(400).json({ error: 'Patient needs (ward type) are required for smart assignment' });
            }
            assignedBed = bedService.assignBedGreedy({ needs, urgency, patient });
        }

        if (!assignedBed) {
            return res.status(404).json({
                error: 'No available beds found',
                suggestion: 'Consider transferring patient or waiting.'
            });
        }

        // AUTO-REMOVE from Queue
        patientService.removePatient(patient.id);

        res.json({
            success: true,
            message: 'Bed assigned successfully',
            bed: assignedBed
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /api/beds/transfer - Transfer Patient
router.post('/beds/transfer', (req, res) => {
    const { sourceBedId, targetBedId } = req.body;

    if (!sourceBedId || !targetBedId) {
        return res.status(400).json({ error: 'Source and Target Bed IDs are required' });
    }

    try {
        const result = bedService.transferPatient(sourceBedId, targetBedId);
        res.json({
            success: true,
            message: 'Transfer successful',
            ...result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PATCH /api/beds/:id/discharge - Discharge Patient
router.patch('/beds/:id/discharge', (req, res) => {
    try {
        const bed = bedService.dischargePatient(req.params.id);
        res.json({ success: true, bed });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// -- Patient Routes --

// GET /api/patients - Search patients
router.get('/patients', (req, res) => {
    const { query } = req.query; // ?query=John
    const results = patientService.searchPatients(query);
    res.json(results);
});

// GET /api/patients/directory - Master List (Queue + Admitted)
router.get('/patients/directory', (req, res) => {
    // 1. Get Waiting Patients
    const queue = patientService.getSortedQueue().map(p => ({
        ...p,
        status: 'Waiting', // UI can show "Queue"
        location: 'Waiting Room'
    }));

    // 2. Get Admitted Patients (from Beds)
    const admitted = bedService.getAllBeds()
        .filter(b => b.status === 'Occupied' && b.patient)
        .map(b => ({
            ...b.patient,
            status: 'Admitted',
            location: b.id, // e.g. BED-1
            ward: b.ward,
            bedId: b.id
        }));

    // Combine
    const allPatients = [...queue, ...admitted];
    res.json(allPatients);
});

// GET /api/queue - Get sorted patient queue
// Requirement: Sorted by Triage Level
router.get('/queue', (req, res) => {
    const sortedQueue = patientService.getSortedQueue();
    res.json(sortedQueue);
});

// POST /api/queue/add - Add patient to queue
router.post('/queue/add', (req, res) => {
    const { name, triageLevel } = req.body;
    if (!name || !triageLevel) {
        return res.status(400).json({ error: 'Name and Triage Level are required' });
    }

    try {
        const newPatient = patientService.addPatient({
            name,
            triageLevel: parseInt(triageLevel)
        });
        res.json({ success: true, patient: newPatient });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/queue/:id - Remove patient from queue
router.delete('/queue/:id', (req, res) => {
    try {
        const success = patientService.removePatient(req.params.id);
        if (success) {
            res.json({ success: true });
        } else {
            res.status(404).json({ error: 'Patient not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
