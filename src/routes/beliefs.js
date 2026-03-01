const express = require('express');
const router = express.Router();
const beliefService = require('../services/beliefService');

router.post('/beliefs', async (req, res) => {
    try {
        const { text, attributeCode, confidence } = req.body;
        const result = await beliefService.createBelief(text, attributeCode, confidence);
        res.json({ success: true, id: result.lastID });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.get('/beliefs', async (req, res) => {
    try {
        const beliefs = await beliefService.getBeliefs();
        res.json(beliefs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/beliefs/:id/update', async (req, res) => {
    try {
        const { id } = req.params;
        const { text, confidence } = req.body;
        await beliefService.updateBelief(id, text, confidence);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/beliefs/:id/archive', async (req, res) => {
    try {
        const { id } = req.params;
        await beliefService.archiveBelief(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/beliefs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await beliefService.deleteBelief(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.post('/beliefs/:id/evidence', async (req, res) => {
    try {
        const { id } = req.params;
        const { text, type } = req.body;
        await beliefService.addEvidence(id, text, type);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.delete('/evidence/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await beliefService.deleteEvidence(id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
