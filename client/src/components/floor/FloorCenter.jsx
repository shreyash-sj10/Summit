import { motion, AnimatePresence } from 'framer-motion';
import useSessionStore from '../../store/useSessionStore';
import TimerDisplay from './TimerDisplay';
import { getStageBehavior } from '../../shared/utils/stageBehaviors';

export default function FloorCenter() {
    const {
        session,
        timer,
        timerLimit,
        isTimerRunning,
        interruptInfo,
        challengeInfo,
        stage
    } = useSessionStore();

    const currentSpeaker = session?.current_speaker;
    const timeRemaining = Math.max(0, timerLimit - timer);
    const isUrgent = timeRemaining <= 10 && isTimerRunning;
    const isFrozen = !!(interruptInfo || challengeInfo);

    const stageLabel = getStageBehavior(stage)?.label || stage;

    const statusLabel = interruptInfo
        ? 'Interrupted'
        : challengeInfo
            ? `Challenge Phase ${challengeInfo.phase}`
            : isTimerRunning
                ? 'Speaking'
                : currentSpeaker
                    ? 'Paused'
                    : 'Idle';

    const statusColor = interruptInfo
        ? 'text-amber-500'
        : challengeInfo
            ? 'text-rose-500'
            : isTimerRunning
                ? 'text-india-green'
                : 'text-gray-400';

    return (
        <section className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="font-bold text-neutral-dark flex items-center gap-2">
                    <span className="material-symbols-outlined text-saffron">podium</span>
                    Floor Center
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 uppercase">
                        {stageLabel}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusColor} ${interruptInfo || challengeInfo ? 'bg-rose-50 border border-rose-200' : 'bg-india-green/10 border border-india-green/20'}`}>
                        {statusLabel}
                    </span>
                </div>
            </div>

            <div className="p-6 flex flex-col items-center gap-5 relative">
                {/* Glow background when active */}
                <AnimatePresence>
                    {currentSpeaker && isTimerRunning && !isFrozen && (
                        <motion.div
                            key="glow"
                            className="absolute inset-0 bg-gradient-to-b from-saffron/5 via-transparent to-transparent pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                        />
                    )}
                </AnimatePresence>

                {/* Frozen overlay */}
                <AnimatePresence>
                    {isFrozen && (
                        <motion.div
                            key="frozen"
                            className="absolute inset-0 bg-neutral-dark/5 backdrop-blur-[1px] pointer-events-none z-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                        />
                    )}
                </AnimatePresence>

                {/* Timer circle */}
                <TimerDisplay
                    timer={timer}
                    timerLimit={timerLimit}
                    isRunning={isTimerRunning}
                    isFrozen={isFrozen}
                />

                {/* Speaker info with AnimatePresence */}
                <AnimatePresence mode="wait">
                    {currentSpeaker ? (
                        <motion.div
                            key={currentSpeaker.id}
                            className="flex flex-col items-center gap-2 text-center relative z-20"
                            initial={{ opacity: 0, scale: 0.92, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: -10 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                        >
                            <motion.div
                                className={`h-16 w-16 rounded-full flex items-center justify-center text-2xl font-black text-saffron shadow-md border-2 ${isFrozen ? 'border-rose-400 bg-rose-50' : 'border-saffron bg-saffron/10'}`}
                                animate={isUrgent && !isFrozen ? { scale: [1, 1.06, 1] } : {}}
                                transition={isUrgent ? { duration: 1, repeat: Infinity } : {}}
                            >
                                {currentSpeaker.name?.charAt(0) || '?'}
                            </motion.div>
                            <p className="text-xl font-black text-neutral-dark leading-none">
                                {currentSpeaker.name}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold bg-saffron/10 text-saffron px-2 py-0.5 rounded border border-saffron/20 uppercase">
                                    {currentSpeaker.party}
                                </span>
                                {currentSpeaker.constituency && (
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        · {currentSpeaker.constituency}
                                    </span>
                                )}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty"
                            className="flex flex-col items-center gap-2 text-center opacity-60 relative z-20"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.6 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="h-16 w-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                                <span className="material-symbols-outlined text-3xl">mic_off</span>
                            </div>
                            <p className="text-sm text-gray-400 font-medium italic">
                                No speaker on the floor
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Interrupt / Challenge info bar */}
                <AnimatePresence>
                    {interruptInfo && (
                        <motion.div
                            key="interrupt-bar"
                            className="w-full bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between relative z-20"
                            initial={{ opacity: 0, y: 20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: 20, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-600">flash_on</span>
                                <div>
                                    <p className="text-sm font-bold text-amber-800">INTERRUPT</p>
                                    <p className="text-xs text-amber-600">{interruptInfo.name} has the floor</p>
                                </div>
                            </div>
                            <span className="text-xl font-black text-amber-700 tabular-nums font-mono">
                                {String(Math.floor(interruptInfo.time_left / 60)).padStart(2, '0')}:{String(interruptInfo.time_left % 60).padStart(2, '0')}
                            </span>
                        </motion.div>
                    )}
                    {challengeInfo && (
                        <motion.div
                            key="challenge-bar"
                            className="w-full bg-rose-50 border border-rose-200 rounded-lg p-3 flex items-center justify-between relative z-20"
                            initial={{ opacity: 0, y: 20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: 20, height: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-rose-600">sports_mma</span>
                                <div>
                                    <p className="text-sm font-bold text-rose-800">CHALLENGE · Phase {challengeInfo.phase}</p>
                                    <p className="text-xs text-rose-600">
                                        {challengeInfo.phase === 1 ? challengeInfo.name1 : challengeInfo.name2} speaking
                                    </p>
                                </div>
                            </div>
                            <span className="text-xl font-black text-rose-700 tabular-nums font-mono">
                                {String(Math.floor(challengeInfo.time_left / 60)).padStart(2, '0')}:{String(challengeInfo.time_left % 60).padStart(2, '0')}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}
