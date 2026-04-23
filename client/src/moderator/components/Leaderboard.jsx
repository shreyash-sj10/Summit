import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function Leaderboard({ leaderboard, alwaysShowAll = false }) {
    const [showAll, setShowAll] = useState(alwaysShowAll);

    if (!leaderboard?.length) {
        return (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100 shadow-soft">
                <span className="material-symbols-outlined text-5xl text-gray-200">emoji_events</span>
                <p className="text-gray-400 mt-3 font-medium">No points awarded yet.</p>
            </div>
        );
    }

    const partyColors = ['bg-saffron/20 text-saffron', 'bg-india-green/20 text-india-green', 'bg-ashoka-blue/20 text-ashoka-blue', 'bg-amber-100 text-amber-600', 'bg-purple-100 text-purple-600'];

    const sorted = [...leaderboard].sort((a, b) => b.points - a.points);
    const displayList = showAll ? sorted : sorted.slice(0, 10);

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <span className="material-symbols-outlined text-saffron">leaderboard</span>
                <h3 className="font-bold text-neutral-dark">Team Leaderboard</h3>
            </div>
            <div className="flex flex-col">
                <AnimatePresence initial={false}>
                    {displayList.map((entry, idx) => (
                        <Motion.div
                            key={entry.party}
                            className={`flex items-center gap-4 px-4 py-3.5 ${idx < sorted.length - 1 ? 'border-b border-gray-50' : ''} ${idx < 3 ? 'bg-gradient-to-r from-transparent to-transparent hover:from-saffron/5 hover:to-transparent' : ''} transition-colors`}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.35, delay: idx * 0.05 }}
                        >
                            <div className="w-8 text-center relative">
                                {idx === 0 && (
                                    <Motion.span
                                        className="absolute -top-3 left-1/2 -translate-x-1/2 text-base"
                                        animate={{ y: [0, -2, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        👑
                                    </Motion.span>
                                )}
                                <span className={`text-lg font-black ${idx === 0 ? 'text-saffron' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-gray-300'}`}>
                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                                </span>
                            </div>
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-black ${partyColors[idx % partyColors.length]} shadow-sm`}>
                                {entry.party?.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-neutral-dark">{entry.party}</p>
                            </div>
                            <div className="text-right">
                                <Motion.span
                                    key={entry.points}
                                    className={`text-2xl font-black tabular-nums ${idx === 0 ? 'text-saffron' : 'text-neutral-dark'}`}
                                    initial={{ scale: 1.3, color: '#22c55e' }}
                                    animate={{ scale: 1, color: idx === 0 ? '#FF9933' : '#1a1a2e' }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {entry.points}
                                </Motion.span>
                                <p className="text-[10px] text-gray-400 uppercase tracking-wide">pts</p>
                            </div>
                        </Motion.div>
                    ))}
                </AnimatePresence>
            </div>
            {sorted.length > 10 && !alwaysShowAll && (
                <div className="p-3 border-t border-gray-100 bg-gray-50/30">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="w-full py-2 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-neutral-dark transition-colors flex items-center justify-center gap-1"
                    >
                        {showAll ? (
                            <>
                                <span className="material-symbols-outlined text-[16px]">expand_less</span>
                                Show Top 10 Only
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-[16px]">expand_more</span>
                                Show All {sorted.length} Teams
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
