import express from 'express';
import { supabase } from '../supabase.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// GET /party/:party
// Fetches the party details for a specific party
router.get('/:party', authMiddleware, async (req, res) => {
    try {
        const { party } = req.params;
        const requestedParty = String(party || '').trim().toUpperCase();

        if (req.user.role !== 'moderator' && req.user.party !== requestedParty) {
            return res.status(403).json({ error: 'Access denied for requested party' });
        }

        const { data, error } = await supabase
            .from('party_details')
            .select('*')
            .eq('party', requestedParty)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching party details:', error);
            return res.status(500).json({ error: 'Failed to fetch party details' });
        }

        if (!data) {
            return res.status(404).json({ message: 'Party details not found' });
        }

        return res.json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /party
// Creates or updates party details
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { party, total_members, members_data, logo_url } = req.body;
        const normalizedParty = String(party || '').trim().toUpperCase();

        if (!normalizedParty || !total_members || !members_data || !logo_url) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (req.user.role !== 'moderator' && req.user.party !== normalizedParty) {
            return res.status(403).json({ error: 'Access denied for requested party' });
        }

        const { data, error } = await supabase
            .from('party_details')
            .upsert({
                party: normalizedParty,
                total_members,
                members_data,
                logo_url
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving party details:', error);
            return res.status(500).json({ error: 'Failed to save party details' });
        }

        return res.json(data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
