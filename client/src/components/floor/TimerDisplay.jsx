import { motion as Motion } from 'framer-motion';

export default function TimerDisplay({ timer, timerLimit, isRunning, isFrozen }) {
    const remaining = Math.max(0, timerLimit - timer);
    const progress = timerLimit > 0 ? Math.min(1, timer / timerLimit) : 0;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const strokeColor = isFrozen
        ? '#94a3b8'
        : remaining <= 5
            ? '#ef4444'
            : remaining <= 15
                ? '#eab308'
                : '#22c55e';

    const isShaking = remaining <= 5 && isRunning && !isFrozen;
    const isFlashing = remaining === 0 && isRunning;

    return (
        <Motion.div
            className="relative"
            animate={isShaking ? { x: [0, -2, 2, -1, 1, 0] } : {}}
            transition={isShaking ? { duration: 0.4, repeat: Infinity, repeatDelay: 0.6 } : {}}
        >
            <svg width="140" height="140" viewBox="0 0 120 120" className="transform -rotate-90">
                {/* Background track */}
                <circle
                    cx="60" cy="60" r={radius}
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="8"
                />
                {/* Progress arc */}
                <Motion.circle
                    cx="60" cy="60" r={radius}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    animate={{ strokeDashoffset, stroke: strokeColor }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Motion.span
                    className={`font-mono text-2xl font-black tabular-nums ${isFlashing ? 'text-red-500' : 'text-neutral-dark'}`}
                    animate={isFlashing ? { opacity: [1, 0.3, 1] } : {}}
                    transition={isFlashing ? { duration: 0.8, repeat: Infinity } : {}}
                >
                    {fmt(remaining)}
                </Motion.span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                    {isFrozen ? 'Frozen' : isRunning ? 'Live' : remaining > 0 ? 'Paused' : 'Done'}
                </span>
            </div>
        </Motion.div>
    );
}
