const express = require('express');
const router = express.Router();
const explorerService = require('../services/explorerService');

router.get('/tables', async (req, res) => {
    try {
        const tables = await explorerService.getTables();
        res.json(tables);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch tables' });
    }
});

router.get('/table/:name', async (req, res) => {
    try {
        const data = await explorerService.getTableData(req.params.name);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch table data' });
    }
});

module.exports = router;
