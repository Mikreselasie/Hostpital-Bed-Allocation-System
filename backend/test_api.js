const http = require('http');

function testAPI(endpoint) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:5000${endpoint}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('Testing /api/queue...');
    const queue = await testAPI('/api/queue');
    console.log(`Queue has ${queue.length} patients`);
    console.log('First patient:', queue[0]);

    console.log('\nTesting /api/patients/directory...');
    const directory = await testAPI('/api/patients/directory');
    console.log(`Directory has ${directory.length} patients`);
    console.log('First 3 patients:', directory.slice(0, 3));
}

main().catch(console.error);
