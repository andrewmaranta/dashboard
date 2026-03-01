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

router.post('/finance/sync', async (req, res) => {
    try {
        const result = await financeService.syncTransactions();
        if (result.error) {
            return res.status(400).json(result);
        }
        req.io.emit('financeUpdated', result.data);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to sync transactions' });
    }
});

module.exports = router;
