import { useState, useRef, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

export default function CustomSelect({ value, onChange, options }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative w-full md:max-w-[280px]" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-gray-50 hover:bg-white border border-gray-200 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-saffron focus:border-transparent transition-all shadow-sm"
            >
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-saffron/10 text-saffron">
                        <span className="material-symbols-outlined text-[18px]">{selectedOption.icon}</span>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-neutral-dark">{selectedOption.label}</div>
                        <div className="text-[10px] text-gray-500 font-medium">{selectedOption.description}</div>
                    </div>
                </div>
                <span className="material-symbols-outlined text-gray-400 transition-transform duration-300" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    keyboard_arrow_down
                </span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <Motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute z-[100] w-full mt-2 bg-white rounded-xl shadow-2xl shadow-saffron/10 border border-gray-100 overflow-hidden"
                    >
                        <ul className="py-2">
                            {options.map((option) => (
                                <li key={option.value}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${value === option.value ? 'bg-saffron/5' : ''
                                            }`}
                                    >
                                        <div className={`mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg ${value === option.value ? 'bg-saffron text-white shadow-md shadow-saffron/20' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                                        </div>
                                        <div>
                                            <div className={`text-sm font-bold ${value === option.value ? 'text-saffron' : 'text-neutral-dark'}`}>
                                                {option.label}
                                            </div>
                                            <div className="text-[11px] text-gray-500 mt-0.5">
                                                {option.description}
                                            </div>
                                        </div>
                                        {value === option.value && (
                                            <span className="material-symbols-outlined text-saffron ml-auto self-center">check</span>
                                        )}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </Motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
