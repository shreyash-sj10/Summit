import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSessionStore from '../../store/useSessionStore';
import { getStageBehavior } from '../../shared/utils/stageBehaviors';

export default function StageOverlay() {
    const { stage } = useSessionStore();
    const prevStage = useRef(stage);
    const [show, setShow] = useState(false);
    const [label, setLabel] = useState('');
    const timerRef = useRef(null);

    useEffect(() => {
        if (prevStage.current !== stage && prevStage.current !== null) {
            setLabel(getStageBehavior(stage)?.label || stage);
            setShow(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setShow(false), 3000);
        }
        prevStage.current = stage;
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [stage]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key="stage-overlay"
                    className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-neutral-dark/30 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />
                    {/* Banner */}
                    <motion.div
                        className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-3 border border-gray-100 max-w-md mx-auto"
                        initial={{ opacity: 0, y: -60, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.9 }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <span className="material-symbols-outlined text-4xl text-saffron">auto_awesome_motion</span>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">Stage Transition</p>
                        <h2 className="text-2xl font-black text-neutral-dark text-center leading-tight">{label}</h2>
                        <div className="h-1 w-20 rounded-full bg-gradient-to-r from-saffron via-accent to-india-green mt-1" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
