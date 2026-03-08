const { getStreaks } = require('./src/services/healthService');
getStreaks().then(console.log).catch(console.error);
