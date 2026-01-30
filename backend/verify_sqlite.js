const http = require('http');

const API_URL = 'http://localhost:5000/api';

async function request(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_URL}${path}`);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`Status: ${res.statusCode}, Body: ${data}`));
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function verifyPersistence() {
    try {
        console.log('--- Step 1: Add a patient to the queue ---');
        const patientData = { name: 'Persistence Test Patient', triageLevel: 1, condition: 'Testing' };
        const addedPatient = await request('/queue/add', 'POST', patientData);
        console.log('Patient added:', addedPatient);

        console.log('--- Step 2: Check queue ---');
        const queue = await request('/queue');
        console.log('Current queue length:', queue.length);
        const exists = queue.some(p => p.name === 'Persistence Test Patient');
        console.log('Patient in queue:', exists);

        if (!exists) throw new Error('Patient not found in queue after addition');

        console.log('\n--- VERIFICATION INSTRUCTIONS ---');
        console.log('1. I will now kill the server.');
        console.log('2. I will start the server again.');
        console.log('3. I will check the queue again to see if "Persistence Test Patient" is still there.');

    } catch (error) {
        console.error('Verification failed:', error.message);
    }
}

verifyPersistence();
