const fs = require('fs');
const writeQueue = new Map();

async function safeWriteFile(filepath, content) {
    if (writeQueue.has(filepath)) {
        await writeQueue.get(filepath);
    }
    const promise = fs.promises.writeFile(filepath, content, 'utf8');
    writeQueue.set(filepath, promise);
    try {
        await promise;
    } finally {
        writeQueue.delete(filepath);
    }
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

module.exports = {
    safeWriteFile,
    parseCSVLine
};
