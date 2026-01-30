const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PATCH"]
    }
});

app.use(cors());
app.use(express.json());

// In-Memory Data Stores
// Bed Status (Hash Table): Map<BedID, Data> for O(1) access
global.beds = new Map();
// Patients Queue (Array for sorting)
global.patientQueue = [];
// All Patients (Array for searching)
global.patients = [];

// Make io accessible globally
global.io = io;

const PORT = process.env.PORT || 5000;

// Initialize System (Mock Data)
// Note: We require services after defining globals or we pass globals to them. 
// Ideally, we shouldn't rely on globals, but for this specific DSA demo request it's allowed/implied for simplicity.
// A better architecture would be dependency injection, but let's stick to the prompt's simplicity.
const { initializeBeds } = require('./services/bedService');
const { initializePatients } = require('./services/patientService');

initializeBeds();
initializePatients();

// Import Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
    res.send('Hospital Bed Management API is running');
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
