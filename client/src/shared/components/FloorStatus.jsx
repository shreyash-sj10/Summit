import FloorCenter from '../../components/floor/FloorCenter';
import { motion as Motion, AnimatePresence } from 'framer-motion';

export default function FloorStatus({ queue }) {
    const waiting = (queue || []).filter(q => q.status === 'waiting');

    return (
        <div className="flex flex-col gap-4">
            {/* Cinematic Floor Center */}
            <FloorCenter />

            {/* Queue up next */}
            <section className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden transition-shadow hover:shadow-md">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-neutral-dark flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-india-green">group</span>
                        Up Next
                    </h3>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        {waiting.length} waiting
                    </span>
                </div>
                <div className="p-3 flex flex-col gap-1">
                    {waiting.length === 0 && (
                        <div className="py-6 text-center border-2 border-dashed border-gray-100 rounded-lg">
                            <span className="material-symbols-outlined text-3xl text-gray-200 block mb-1">hourglass_empty</span>
                            <p className="text-sm text-gray-300 italic">Queue is currently empty</p>
                        </div>
                    )}
                    <AnimatePresence initial={false}>
                        {waiting.slice(0, 5).map((entry, idx) => (
                            <Motion.div
                                key={entry.id}
                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors cursor-default"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.25, delay: idx * 0.05 }}
                                layout
                            >
                                <span className="text-xs font-black text-gray-300 w-5 text-center tabular-nums">
                                    {idx + 1}
                                </span>
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 border border-gray-200 shadow-sm">
                                    {entry.member?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-neutral-dark truncate">{entry.member?.name}</p>
                                    <p className="text-[10px] text-gray-500 uppercase font-medium">{entry.member?.party}</p>
                                </div>
                            </Motion.div>
                        ))}
                    </AnimatePresence>
                    {waiting.length > 5 && (
                        <p className="text-[10px] text-gray-400 text-center pt-2 font-medium">
                            +{waiting.length - 5} more in queue
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
