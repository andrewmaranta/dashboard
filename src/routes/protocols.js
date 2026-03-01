const express = require('express');
const router = express.Router();
const protocolService = require('../services/protocolService');

router.get('/protocols', async (req, res) => {
    try {
        const protocols = await protocolService.getProtocols();
        res.json(protocols);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/protocols', async (req, res) => {
    try {
        const { trigger, action, difficulty, attribute } = req.body;
        await protocolService.createProtocol(trigger, action, difficulty, attribute);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/protocols/:id/log', async (req, res) => {
    try {
        const { id } = req.params;
        const { hit } = req.body; // true/false
        await protocolService.logProtocol(id, hit, req.io);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/protocols/:id/archive', async (req, res) => {
    try {
        const { id } = req.params;
        await protocolService.archiveProtocol(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/protocols/:id/update', async (req, res) => {
    try {
        const { id } = req.params;
        const { trigger, action, difficulty, attribute } = req.body;
        await protocolService.updateProtocol(id, trigger, action, difficulty, attribute);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
