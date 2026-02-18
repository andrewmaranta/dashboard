const http = require('http');

const endpoints = [
    '/api/quests',
    '/api/health',
    '/api/daily-stats',
    '/api/finance',
    '/api/streaks',
    '/api/heatmap'
];

function testEndpoint(path) {
    return new Promise((resolve) => {
        http.get(`http://localhost:3000${path}`, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`PASS: ${path} returned ${Object.keys(json).length} keys`);
                    if (path === '/api/daily-stats') console.log('Daily Stats:', json);
                    resolve(true);
                } catch (e) {
                    console.log(`FAIL: ${path} returned invalid JSON: ${data.substring(0, 50)}...`);
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.log(`FAIL: ${path} error: ${err.message}`);
            resolve(false);
        });
    });
}

async function runTests() {
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint);
    }
}

runTests();
