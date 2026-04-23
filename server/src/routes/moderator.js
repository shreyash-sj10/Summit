import express from 'express';
import { supabase } from '../supabase.js';
import { authMiddleware, officialOnly } from '../middleware/auth.js';

const router = express.Router();

// GET /moderator/grade/status
// Check if current user has already graded the active speaker for their current turn
router.get('/grade/status', authMiddleware, officialOnly, async (req, res) => {
    // Find active session
    const { data: session } = await supabase
        .from('sessions')
        .select('id, current_speaker_id')
        .eq('is_active', true)
        .single();

    if (!session || !session.current_speaker_id) {
        return res.json({ can_grade: false, reason: 'No active speaker' });
    }

    // Find active queue turn
    const { data: queueEntry } = await supabase
        .from('speaker_queue')
        .select('id')
        .eq('session_id', session.id)
        .eq('member_id', session.current_speaker_id)
        .eq('status', 'speaking')
        .single();

    if (!queueEntry) {
        return res.json({ can_grade: false, reason: 'Speaker is not properly initialized on the floor' });
    }

    // Check if user already graded this queue ID
    const { data: existing } = await supabase
        .from('speaker_grades')
        .select('id')
        .eq('queue_id', queueEntry.id)
        .eq('grader_id', req.user.id)
        .maybeSingle();

    if (existing) {
        return res.json({ can_grade: false, reason: 'Already graded this turn' });
    }

    // If moderator, maybe checking if 3 judges have voted? No, they can vote in any order.
    // Also, tell frontend how many people have graded so far
    const { count } = await supabase
        .from('speaker_grades')
        .select('*', { count: 'exact', head: true })
        .eq('queue_id', queueEntry.id);

    res.json({ can_grade: true, grades_so_far: count || 0 });
});

// POST /moderator/grade
// Submits a single grade. If it's the 4th grade for this turn, triggers final point tally.
router.post('/grade', authMiddleware, officialOnly, async (req, res) => {
    let { session_id, member_id, speaking = 0, relevance = 0, preparedness = 0, poll_score = 0 } = req.body;

    if (!session_id || !member_id) return res.status(400).json({ error: 'Missing session/member ID' });

    // Validate parameters depending on role
    if (req.user.role === 'judge') {
        poll_score = 0; // Judges shouldn't affect polls
        if ([speaking, relevance, preparedness].some(g => isNaN(g) || g < 0 || g > 10)) {
            return res.status(400).json({ error: 'Judge grades must be between 0 and 10' });
        }
    } else if (req.user.role === 'moderator') {
        // Moderator ONLY grades poll score
        speaking = 0; relevance = 0; preparedness = 0;
        if (isNaN(poll_score) || poll_score < 0 || poll_score > 10) {
            return res.status(400).json({ error: 'Moderator poll score must be between 0 and 10' });
        }
    }

    // Find the current active queue turn to bind this grade to
    const { data: queueEntry } = await supabase
        .from('speaker_queue')
        .select('id')
        .eq('session_id', session_id)
        .eq('member_id', member_id)
        .eq('status', 'speaking')
        .single();

    if (!queueEntry) {
        return res.status(400).json({ error: 'Cannot grade. This member is not currently speaking on the floor.' });
    }

    const total_points = speaking + relevance + preparedness + poll_score;

    // 1. Insert grade
    const { error: gradeError } = await supabase.from('speaker_grades').insert({
        session_id,
        member_id,
        queue_id: queueEntry.id,
        grader_id: req.user.id,
        speaking,
        relevance,
        preparedness,
        poll_score,
        total_points
    });

    if (gradeError) {
        if (gradeError.code === '23505') { // Unique constraint violation
            return res.status(400).json({ error: 'You have already submitted a grade for this turn.' });
        }
        console.error('Grade insert error:', gradeError);
        return res.status(500).json({ error: 'Failed to save grades' });
    }

    // 2. Check if this is the final grade needed (4 officials total)
    const { data: allGrades, count } = await supabase
        .from('speaker_grades')
        .select('total_points', { count: 'exact' })
        .eq('queue_id', queueEntry.id);

    if (count === 4) {
        // All 4 have voted! Tally final score
        const final_score = allGrades.reduce((acc, curr) => acc + curr.total_points, 0);
        // 3. Update Team Points
        const { data: member } = await supabase.from('members').select('party').eq('id', member_id).single();
        if (member) {
            const { data: teamPoint } = await supabase
                .from('team_points')
                .select('points')
                .eq('session_id', session_id)
                .eq('party', member.party)
                .single();

            if (teamPoint) {
                await supabase
                    .from('team_points')
                    .update({ points: teamPoint.points + final_score })
                    .eq('session_id', session_id)
                    .eq('party', member.party);
            } else {
                await supabase.from('team_points').insert({
                    session_id,
                    party: member.party,
                    points: final_score
                });
            }
        }

        return res.json({ success: true, message: 'Final grade received. Scored ' + final_score, is_final: true, total_score: final_score });
    }

    res.json({ success: true, message: `Grade logged. ${count}/4 officials have graded so far.`, is_final: false, partial_points: total_points });
});

export default router;


