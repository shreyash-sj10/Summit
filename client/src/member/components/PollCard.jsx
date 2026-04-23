import { useState } from 'react';
import { castVote } from '../../shared/services/api';

export default function PollCard({ poll, onVoted }) {
    const [voting, setVoting] = useState(false);

    async function handleVote(optionId) {
        if (poll.my_vote || !poll.is_active) return;
        setVoting(true);
        try {
            await castVote(poll.id, optionId);
            onVoted?.();
        } catch (e) {
            console.error('Vote failed:', e);
        } finally { setVoting(false); }
    }

    const totalVotes = poll.total_votes || 0;

    const barColors = ['bg-saffron', 'bg-india-green', 'bg-ashoka-blue', 'bg-amber-400', 'bg-purple-500'];

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-4 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
                <h4 className="font-bold text-neutral-dark text-sm leading-snug">{poll.question}</h4>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0 ${poll.is_active ? 'bg-india-green/10 text-india-green border border-india-green/20' : 'bg-gray-100 text-gray-400'}`}>
                    {poll.is_active ? 'Live' : 'Closed'}
                </span>
            </div>

            {/* Options */}
            <div className="flex flex-col gap-2">
                {(poll.options || []).map((opt, idx) => {
                    const count = poll.vote_counts?.[opt.id] || 0;
                    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const isMyVote = poll.my_vote === opt.id;
                    const voted = !!poll.my_vote;

                    return (
                        <button
                            key={opt.id}
                            onClick={() => handleVote(opt.id)}
                            disabled={voted || !poll.is_active || voting}
                            className={`relative w-full text-left rounded-lg border overflow-hidden transition-all active:scale-[0.98] ${isMyVote ? 'border-saffron' : 'border-gray-200'} ${!voted && poll.is_active ? 'hover:border-saffron cursor-pointer' : 'cursor-default'}`}
                        >
                            {/* Progress bar */}
                            {voted && (
                                <div
                                    className={`absolute inset-y-0 left-0 ${barColors[idx % barColors.length]} opacity-10 transition-all`}
                                    style={{ width: `${pct}%` }}
                                />
                            )}
                            <div className="relative flex items-center justify-between px-3 py-2.5">
                                <div className="flex items-center gap-2">
                                    {isMyVote && <span className="material-symbols-outlined text-saffron text-sm">check_circle</span>}
                                    <span className="text-sm font-semibold text-neutral-dark">{opt.text}</span>
                                </div>
                                {voted && <span className="text-xs font-bold text-gray-500">{pct}%</span>}
                            </div>
                        </button>
                    );
                })}
            </div>

            <p className="text-[10px] text-gray-400 font-medium">{totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast</p>
        </div>
    );
}
