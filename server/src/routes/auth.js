import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase } from '../supabase.js';

const router = express.Router();

// POST /auth/login
// Body: { member_id: "BJP12345", password: "BJP" }
router.post('/login', async (req, res) => {
    const { member_id, password } = req.body;
    if (!member_id || !password) {
        return res.status(400).json({ error: 'member_id and password required' });
    }

    const normalizedMemberId = String(member_id).trim().toUpperCase();
    const normalizedPassword = String(password).trim().toLowerCase();

    const { data: member, error } = await supabase
        .from('members')
        .select('id,member_id,name,party,constituency,role,speeches_count,password_hash')
        .eq('member_id', normalizedMemberId)
        .maybeSingle();

    // maybeSingle: no row => member null, error null (avoids treating "no rows" as a DB failure)
    if (error) {
        console.error('[auth/login] Supabase error:', error.code, error.message);
        return res.status(500).json({ error: 'Unable to verify credentials' });
    }

    if (!member) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const expectedLegacyPassword = String(member.party || '').trim().toLowerCase();

    let ok = false;
    if (member.password_hash) {
        // Supabase seed uses pgcrypto `crypt(..., gen_salt('bf'))` which is bcrypt-compatible.
        ok = await bcrypt.compare(normalizedPassword, member.password_hash);
    } else {
        // Back-compat for databases that haven't run the password migration yet.
        ok = normalizedPassword === expectedLegacyPassword;
    }

    if (!ok) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
        {
            id: member.id,
            member_id: member.member_id,
            name: member.name,
            party: member.party,
            constituency: member.constituency,
            role: member.role,
            speeches_count: member.speeches_count,
        },
        process.env.JWT_SECRET,
        { expiresIn: '12h' }
    );

    res.json({
        token,
        user: {
            id: member.id,
            member_id: member.member_id,
            name: member.name,
            party: member.party,
            constituency: member.constituency,
            role: member.role,
            speeches_count: member.speeches_count,
        },
    });
});

// GET /auth/me - refresh user info
router.get('/me', async (req, res) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
        const { data: member } = await supabase
            .from('members')
            .select('id,member_id,name,party,constituency,role,speeches_count')
            .eq('id', payload.id)
            .single();
        res.json({ user: member });
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
