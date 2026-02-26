import useQueueStore from '../../store/useQueueStore';
import useUserStore from '../../store/useUserStore';
import useSessionStore from '../../store/useSessionStore';
import { MAX_SPEECHES_PER_BILL } from '../../shared/constants';

const DONE_UNLOCK_SECONDS = 60; // 1 minute

// ── Done-button with unlock countdown ────────────────────────────────────────
function DoneButton({ timer, onClick, loading }) {
    const remaining = Math.max(0, DONE_UNLOCK_SECONDS - timer);
    const unlocked = remaining === 0;

    return (
        <button
            onClick={onClick}
            disabled={!unlocked || loading}
            className={`flex-1 font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-sm
                ${unlocked
                    ? 'bg-india-green hover:bg-india-green/90 text-white shadow-sm hover:shadow active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
        >
            <span className="material-symbols-outlined text-base">check_circle</span>
            {loading ? 'Marking...' : unlocked ? 'DONE' : `DONE (${remaining}s)`}
        </button>
    );
}

export default function SpeakerQueue() {
    const {
        queue,
        approveSpeaker,
        revokeSpeaker,
        markDone,
        isQueueLoading
    } = useQueueStore();

    const { session, timer, isTimerRunning, pauseTimer, startTimer } = useSessionStore();
    const { role } = useUserStore();

    const currentSpeaker = session?.current_speaker;
    const isJudge = role === 'judge';

    async function handle(action, id = null) {
        if (action === 'approve') {
            if (currentSpeaker) {
                await revokeSpeaker();
            }
            await approveSpeaker(id);
        }
        else if (action === 'revoke') await revokeSpeaker();
        else if (action === 'done') await markDone();
    }

    const waiting = (queue || []).filter(q => q.status === 'waiting');

    const fmtTimer = () => {
        const mins = String(Math.floor(timer / 60)).padStart(2, '0');
        const secs = String(timer % 60).padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Currently Speaking */}
            <section className="space-y-3">
                <h2 className="text-lg font-bold text-neutral-dark">Currently Speaking</h2>
                {currentSpeaker ? (
                    <div className="bg-white rounded-xl shadow-soft hover:shadow-md transition-shadow border border-gray-100 overflow-hidden relative">
                        {/* Status bar */}
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-saffron to-accent"></div>

                        <div className="p-4 flex gap-4 pt-5">
                            <div className="h-16 w-16 rounded-xl bg-saffron/10 flex items-center justify-center text-saffron text-2xl font-black shrink-0 border border-saffron/20 shadow-sm">
                                {currentSpeaker.name?.charAt(0) || '?'}
                            </div>
                            <div className="flex flex-col justify-between py-1 flex-1">
                                <div>
                                    <p className="text-lg font-bold text-neutral-dark">{currentSpeaker.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{currentSpeaker.party} · {currentSpeaker.constituency}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-saffron tracking-widest uppercase animate-pulse flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-saffron"></div>
                                        MIC ON
                                    </span>
                                    {isTimerRunning && (
                                        <>
                                            <span className="text-gray-300">·</span>
                                            <span className="font-mono text-xs font-bold text-saffron tracking-wider">
                                                {fmtTimer()}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50/80 border-t border-gray-100 p-3 flex gap-2">
                            {/* Judges cannot mark done or revoke, only Moderators */}
                            {!isJudge ? (
                                <>
                                    <DoneButton
                                        timer={timer}
                                        onClick={() => handle('done')}
                                        loading={isQueueLoading}
                                    />
                                    {isTimerRunning ? (
                                        <button
                                            onClick={pauseTimer}
                                            disabled={isQueueLoading}
                                            className="flex-1 bg-white border border-amber-500 hover:bg-amber-500 text-amber-500 hover:text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-sm shadow-sm active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-base">pause</span>
                                            PAUSE
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => startTimer(null, timer)}
                                            disabled={isQueueLoading}
                                            className="flex-1 bg-white border border-india-green hover:bg-india-green text-india-green hover:text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-sm shadow-sm active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-base">play_arrow</span>
                                            RESUME
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handle('revoke')}
                                        disabled={isQueueLoading}
                                        className="flex-1 bg-white border border-alert-red hover:bg-alert-red text-alert-red hover:text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-sm shadow-sm active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-base">mic_off</span>
                                        REVOKE
                                    </button>
                                </>
                            ) : (
                                <div className="flex-1 text-center py-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                    Moderator manages the floor. Please grade below.
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200 shadow-sm transition-all hover:bg-gray-50/50">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">mic_none</span>
                        <p className="text-gray-400 text-sm font-medium">No one is speaking. Approve someone below.</p>
                    </div>
                )}
            </section>

            {/* Queue */}
            <section className="space-y-3">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-neutral-dark">Speaker Queue</h2>
                    <span className="text-[10px] py-1 px-2 rounded-full bg-saffron/10 font-bold text-saffron border border-saffron/20">{waiting.length} waiting</span>
                </div>
                <div className="flex flex-col gap-2">
                    {waiting.length === 0 && (
                        <div className="bg-white border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm italic shadow-sm hover:bg-gray-50 transition-colors">
                            The queue is currently empty
                        </div>
                    )}
                    {waiting.slice(0, 10).map((entry, idx) => {
                        const chancesAvailable = Math.max(0, MAX_SPEECHES_PER_BILL - (entry.member?.speeches_count || 0));
                        return (
                            <div key={entry.id} className="group flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-soft hover:shadow-md transition-all">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-400 w-5 text-center">{idx + 1}</span>
                                    <div className="h-10 w-10 rounded-full bg-saffron/10 border border-saffron/20 flex items-center justify-center text-saffron font-bold text-sm shadow-sm">
                                        {entry.member?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-neutral-dark group-hover:text-saffron transition-colors">{entry.member?.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase">{entry.member?.party} · {chancesAvailable} chance{chancesAvailable !== 1 ? 's' : ''} available</p>
                                    </div>
                                </div>
                                {!isJudge && (
                                    <button
                                        onClick={() => handle('approve', entry.id)}
                                        disabled={isQueueLoading}
                                        className="h-9 px-4 rounded-lg bg-india-green/10 text-india-green font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 hover:bg-india-green hover:text-white transition-all hover:shadow-md active:scale-95 border border-india-green/20 hover:border-transparent"
                                    >
                                        <span className="material-symbols-outlined text-base">check_circle</span>
                                        Approve
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}
