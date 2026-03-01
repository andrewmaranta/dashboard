const express = require('express');
const router = express.Router();
const stateLogService = require('../services/stateLogService');
const interoceptiveService = require('../services/interoceptiveService');
const taskService = require('../services/taskService');

// State Logs (Whole Trait Theory)
router.post('/state-logs', async (req, res) => {
    try {
        const { attributeCode, value, context, location, socialContext } = req.body;
        console.log(`Received state log: attributeCode=${attributeCode}, value=${value}, context=${context}, location=${location}, socialContext=${socialContext}`);
        const result = await stateLogService.logState(attributeCode, value, context, location, socialContext);
        res.json({ success: true, id: result.lastID });
    } catch (e) {
        console.error(`Error logging state: ${e.message}`);
        res.status(500).json({ error: e.message });
    }
});

router.get('/state-logs', async (req, res) => {
    try {
        const { attributeCode, startDate } = req.query;
        const logs = await stateLogService.getStateLogs(attributeCode, startDate);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Interoceptive Logs (Somatic Awareness)
router.post('/interoceptive-logs', async (req, res) => {
    try {
        const { feeling, intensity, vagalZone } = req.body;
        const result = await interoceptiveService.logInteroception(feeling, intensity, vagalZone);
        res.json({ success: true, id: result.lastID });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/interoceptive-logs', async (req, res) => {
    try {
        const { limit } = req.query;
        const logs = await interoceptiveService.getInteroceptiveLogs(limit ? parseInt(limit) : 100);
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
