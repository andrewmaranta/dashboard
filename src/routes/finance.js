const express = require('express');
const router = express.Router();
const financeService = require('../services/financeService');

router.get('/finance', async (req, res) => {
    try {
        const data = await financeService.getFinanceData();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to read finance data' });
    }
});

router.post('/finance', async (req, res) => {
    try {
        const data = req.body;
        await financeService.updateFinanceData(data);
        req.io.emit('financeUpdated', data);
        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update finance data' });
    }
});

module.exports = router;
