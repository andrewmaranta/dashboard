const express = require('express');
const router = express.Router();
const bloodPressureService = require('../services/bloodPressureService');

router.get('/blood-pressure', async (req, res) => {
    try {
        const history = await bloodPressureService.getBloodPressureHistory();
        const stats = await bloodPressureService.getBloodPressureStats();
        res.json({ history, ...stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch blood pressure data' });
    }
});

router.post('/blood-pressure', async (req, res) => {
    try {
        await bloodPressureService.logBloodPressure(req.body);
        const history = await bloodPressureService.getBloodPressureHistory();
        const stats = await bloodPressureService.getBloodPressureStats();
        res.json({ success: true, history, ...stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to log blood pressure' });
    }
});

module.exports = router;
