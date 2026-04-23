import React, { useState, useEffect } from 'react';
import useSessionStore from '../../store/useSessionStore';
import { getPartyDetails } from '../../shared/services/api';

export default function ActiveSpeakerView() {
    const { timer, timerLimit, activeSpeaker, isTimerRunning } = useSessionStore();
    const [partyDetails, setPartyDetails] = useState(null);

    // Fetch Party details to get the high res logo
    useEffect(() => {
        if (activeSpeaker?.party) {
            getPartyDetails(activeSpeaker.party).then(res => {
                setPartyDetails(res.data);
            }).catch(() => {
                setPartyDetails(null);
            });
        }
    }, [activeSpeaker?.party]);

    // Timer formatting
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const isWarning = timer >= timerLimit - 15; // 15 seconds remaining warming
    const isOver = timer >= timerLimit;

    let timerColor = 'text-india-green';
    let ringColor = 'border-india-green/20 box-shadow-[0_0_60px_rgba(19,136,8,0.2)]';
    if (isOver) {
        timerColor = 'text-red-500';
        ringColor = 'border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.3)] bg-red-500/5';
    } else if (isWarning) {
        timerColor = 'text-saffron';
        ringColor = 'border-saffron/30 shadow-[0_0_60px_rgba(245,153,61,0.2)]';
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">

            <div className="flex flex-col items-center justify-center w-full max-w-6xl relative z-10 gap-8 lg:gap-12 px-4 h-full">

                {/* Speaker Identity */}
                <div className="text-center w-full flex flex-col items-center gap-4 lg:gap-6 shrink-0 mt-8">
                    {/* Minimalist Logo if present */}
                    {partyDetails?.logo_url && (
                        <div className="w-24 h-24 md:w-32 md:h-32 mb-2">
                            <img src={partyDetails.logo_url} alt="Party Logo" className="w-full h-full object-contain drop-shadow-sm" />
                        </div>
                    )}

                    <div className="flex flex-col items-center">
                        <p className="text-lg lg:text-xl font-bold tracking-widest text-saffron uppercase mb-1 lg:mb-2 flex items-center gap-2">
                            {/* Replaced Icon logic for default text fallback if no logo */}
                            {!partyDetails?.logo_url && <span className="material-symbols-outlined pb-0.5">campaign</span>}
                            Active Speaker
                        </p>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-neutral-dark tracking-tighter leading-tight mb-3 lg:mb-4 px-2 truncate max-w-full">{activeSpeaker?.name}</h1>
                        <div className="flex items-center gap-3">
                            <span className="px-5 py-1.5 rounded-full text-lg font-bold bg-neutral-dark text-white shadow-md">
                                {activeSpeaker?.party || 'Independent'}
                            </span>
                            <span className="text-xl font-semibold text-gray-500">
                                {activeSpeaker?.constituency}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Massive Timer */}
                <div className={`mt-auto mb-8 w-full max-w-4xl aspect-[3/1] max-h-[30vh] md:max-h-[35vh] rounded-[100px] border-4 ${ringColor} flex items-center justify-center backdrop-blur-sm transition-all duration-1000 shrink`}>
                    <div className={`text-[8rem] sm:text-[10rem] md:text-[14rem] lg:text-[16rem] font-black tracking-tighter tabular-nums leading-none ${timerColor} transition-colors duration-1000 ${isTimerRunning && isWarning ? 'animate-pulse' : ''} px-6`}>
                        {formatTime(timer)}
                    </div>
                </div>

            </div>
        </div>
    );
}
