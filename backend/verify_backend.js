const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null }));
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function runTests() {
    console.log("Starting Verification Tests...\n");

    try {
        // 1. Get Beds
        console.log("1. Testing GET /api/beds...");
        const beds = await makeRequest('/api/beds');
        console.log(`   - Retrieved ${beds.data.length} beds.`);
        if (beds.data.length !== 50) throw new Error("Expected 50 beds");

        // 2. Greedy Assignment
        console.log("\n2. Testing Smart Assignment (Greedy) /api/beds/assign...");
        // Request ICU bed
        const assignRes = await makeRequest('/api/beds/assign', 'POST', { needs: 'ICU', urgency: true });
        console.log(`   - Assignment Result: ${assignRes.status}`);
        if (assignRes.status === 200) {
            console.log(`   - Assigned Bed: ${assignRes.data.bed.id} (Ward: ${assignRes.data.bed.ward}, Dist: ${assignRes.data.bed.distanceFromStation})`);
        } else {
            console.log(`   - Failed: ${assignRes.data.error}`);
        }

        // 3. Verify Bed Status Update
        if (assignRes.status === 200) {
            const bedId = assignRes.data.bed.id;
            console.log(`\n3. Verifying Status Update for ${bedId}...`);
            // Check if it's occupied now
            const bedsCheck = await makeRequest('/api/beds');
            const bed = bedsCheck.data.find(b => b.id === bedId);
            console.log(`   - Current Status: ${bed.status}`);
            if (bed.status !== 'Occupied') throw new Error("Bed should be Occupied after assignment");

            // Manually free it
            console.log(`   - Freeing ${bedId}...`);
            await makeRequest(`/api/beds/${bedId}/status`, 'PATCH', { status: 'Available' });
        }

        // 4. Search Patient
        console.log("\n4. Testing Search /api/patients?query=John...");
        const searchRes = await makeRequest('/api/patients?query=John');
        console.log(`   - Found ${searchRes.data.length} matches for 'John'.`);

        // 5. Sorted Queue
        console.log("\n5. Testing Sorted Queue /api/queue...");
        const queueRes = await makeRequest('/api/queue');
        const queue = queueRes.data;
        console.log(`   - Queue length: ${queue.length}`);

        let isSorted = true;
        for (let i = 0; i < queue.length - 1; i++) {
            if (queue[i].triageLevel > queue[i + 1].triageLevel) {
                isSorted = false;
                break;
            }
        }
        console.log(`   - Is Sorted by Triage Level? ${isSorted ? 'YES' : 'NO'} (Top: ${queue[0].triageLevel}, Bottom: ${queue[queue.length - 1].triageLevel})`);

        console.log("\nAll Tests Completed.");
    } catch (err) {
        console.error("Test Failed:", err);
    }
}

// Wait for server to potentially start manually or assume it's running
// For this script, we'll assume the user/agent starts the server first.
runTests();
