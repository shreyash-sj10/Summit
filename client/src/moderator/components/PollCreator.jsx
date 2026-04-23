import { useState } from 'react';
import { createPoll, closePoll } from '../../shared/services/api';

export default function PollCreator({ activePoll, parties, onUpdate }) {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [closeParty, setCloseParty] = useState('');
    const [closePoints, setClosePoints] = useState(10);
    const [loading, setLoading] = useState(false);

    async function handleCreate(e) {
        e.preventDefault();
        const validOptions = options.filter(o => o.trim());
        if (!question.trim() || validOptions.length < 2) return;
        setLoading(true);
        try {
            await createPoll(question.trim(), validOptions);
            setQuestion(''); setOptions(['', '']);
            onUpdate();
        } catch (e) {
            console.error('Create poll failed:', e);
        } finally { setLoading(false); }
    }

    async function handleClose() {
        if (!activePoll) return;
        setLoading(true);
        try {
            await closePoll(activePoll.id, closeParty || null, closeParty ? closePoints : null);
            onUpdate();
        } catch (e) {
            console.error('Close poll failed:', e);
        } finally { setLoading(false); }
    }

    const addOption = () => setOptions(o => [...o, '']);
    const removeOption = (i) => setOptions(o => o.filter((_, idx) => idx !== i));
    const updateOption = (i, val) => setOptions(o => o.map((opt, idx) => idx === i ? val : opt));

    return (
        <div className="flex flex-col gap-4">
            {/* Active poll view */}
            {activePoll && (
                <div className="bg-white rounded-xl border-2 border-saffron p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-bold text-neutral-dark text-sm">{activePoll.question}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-india-green/10 text-india-green border border-india-green/20 uppercase">Live</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">{activePoll.total_votes || 0} votes · {(activePoll.options || []).length} options</p>

                    {/* Vote bar per option */}
                    {(activePoll.options || []).map(opt => {
                        const count = activePoll.vote_counts?.[opt.id] || 0;
                        const pct = activePoll.total_votes > 0 ? Math.round((count / activePoll.total_votes) * 100) : 0;
                        return (
                            <div key={opt.id} className="mb-2">
                                <div className="flex justify-between text-xs mb-0.5">
                                    <span className="font-semibold text-neutral-dark">{opt.text}</span>
                                    <span className="text-gray-500">{pct}% ({count})</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-saffron transition-all" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}

                    {/* Close + award points */}
                    <div className="border-t border-gray-100 pt-3 mt-3 flex flex-col gap-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Close Poll & Award Points</p>
                        <div className="flex gap-2">
                            <select
                                value={closeParty}
                                onChange={e => setCloseParty(e.target.value)}
                                className="flex-1 text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-saffron"
                            >
                                <option value="">No party award</option>
                                {(parties || []).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <input
                                type="number" min={1} max={100}
                                value={closePoints}
                                onChange={e => setClosePoints(parseInt(e.target.value) || 10)}
                                className="w-20 text-sm border border-gray-200 rounded-lg px-2 py-2 focus:outline-none focus:border-saffron text-center"
                            />
                        </div>
                        <button onClick={handleClose} disabled={loading}
                            className="w-full bg-alert-red text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                            <span className="material-symbols-outlined text-base">lock</span>
                            {loading ? 'Closing...' : 'Close Poll'}
                        </button>
                    </div>
                </div>
            )}

            {/* Create new poll */}
            {!activePoll && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-4">
                    <h3 className="font-bold text-neutral-dark mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-saffron">add_chart</span>
                        Create Poll
                    </h3>
                    <form onSubmit={handleCreate} className="flex flex-col gap-3">
                        <input
                            value={question} onChange={e => setQuestion(e.target.value)}
                            placeholder="Poll question..."
                            className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-saffron"
                        />
                        {options.map((opt, i) => (
                            <div key={i} className="flex gap-2">
                                <input
                                    value={opt} onChange={e => updateOption(i, e.target.value)}
                                    placeholder={`Option ${i + 1}`}
                                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-saffron"
                                />
                                {options.length > 2 && (
                                    <button type="button" onClick={() => removeOption(i)} className="text-red-400 hover:text-red-600">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addOption} className="text-saffron text-sm font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">add</span>
                            Add Option
                        </button>
                        <button type="submit" disabled={loading || !question.trim() || options.filter(o => o.trim()).length < 2}
                            className="w-full bg-saffron text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                            <span className="material-symbols-outlined text-base">bar_chart</span>
                            {loading ? 'Creating...' : 'Launch Poll'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
