import { useState } from 'react';
import { usePowerCard } from '../../shared/services/api';

const CARD_DATA = {
    'interrupt': {
        icon: 'flash_on',
        name: 'Interrupt',
        desc: 'Pause the current speaker & take the floor for 20s. (Not valid in 1v1 stages)',
        color: 'bg-amber-100 text-amber-700',
        ring: 'ring-amber-300'
    },
    'add_time': {
        icon: 'more_time',
        name: 'Add Time',
        desc: 'Get an extra 60s for your next speech.',
        color: 'bg-emerald-100 text-emerald-700',
        ring: 'ring-emerald-300'
    },
    'challenge': {
        icon: 'sports_mma',
        name: 'Challenge',
        desc: 'Challenge a speaker for a 1.5 - 2min face-off. (Valid only in 1v1 stages)',
        color: 'bg-rose-100 text-rose-700',
        ring: 'ring-rose-300'
    }
};

export default function PowerCards({ cards, session, onUpdate }) {
    const [activatingId, setActivatingId] = useState(null);
    const [error, setError] = useState('');

    if (!cards || cards.length === 0) return null;

    const handleActivate = async (card) => {
        setError('');

        // Basic frontend validation
        const is1v1Stage = session?.stage === 'BILL1_R2' || session?.stage === 'BILL2_R2';

        if (card.card_type === 'challenge' && !is1v1Stage) {
            setError('Challenge card can only be used during 1v1 stages.');
            return;
        }

        if (card.card_type === 'interrupt' && is1v1Stage) {
            setError('Interrupt card cannot be used during 1v1 stages.');
            return;
        }

        if (!confirm(`Activate ${CARD_DATA[card.card_type].name}?`)) return;

        setActivatingId(card.id);
        try {
            await usePowerCard(card.id, session?.current_speaker?.id); // Send current speaker as target if needed
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to activate card');
        } finally {
            setActivatingId(null);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-4 mb-5">
            <h3 className="text-sm font-bold text-neutral-dark mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-saffron">view_carousel</span>
                Available Power Cards
            </h3>

            {error && <p className="text-xs text-red-500 font-bold mb-3">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cards.map(card => {
                    const data = CARD_DATA[card.card_type];
                    const isActivating = activatingId === card.id;

                    return (
                        <div
                            key={card.id}
                            className={`relative rounded-xl border p-4 transition-all overflow-hidden ${data.color} border-transparent ring-1 ${data.ring}`}
                        >
                            <div className="flex items-start justify-between">
                                <span className="material-symbols-outlined text-3xl opacity-80">{data.icon}</span>
                                <button
                                    onClick={() => handleActivate(card)}
                                    disabled={isActivating}
                                    className="bg-white/80 hover:bg-white text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm transition-all disabled:opacity-50"
                                >
                                    {isActivating ? 'Using...' : 'Use'}
                                </button>
                            </div>
                            <h4 className="font-extrabold mt-3 text-lg leading-tight">{data.name}</h4>
                            <p className="text-xs font-medium mt-1 leading-snug opacity-90">{data.desc}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
