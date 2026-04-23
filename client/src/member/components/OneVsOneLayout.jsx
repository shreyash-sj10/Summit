import React, { useState, useEffect } from "react";
import { getPartyDetails } from "../../shared/services/api";

export default function OneVsOneLayout({
    oneVsOneState,
    teamSelections,
    stage,
    startTime,
    onTimerEnd,
}) {
    const currentKey = stage === "BILL1_R2" ? "bill1Round2" : "bill2Round2";
    const selection = teamSelections?.[currentKey] || { teamA: null, teamB: null };
    const challenger = selection.teamA;
    const opponent = selection.teamB;
    const dbStartTime = selection.startTime;

    // Active when store says so (store syncs from DB startTime on fetch + realtime)
    const isActuallyActive = oneVsOneState === "ACTIVE";

    const effectiveStartTime = startTime || dbStartTime;

    const [challengerLogo, setChallengerLogo] = useState(null);
    const [opponentLogo, setOpponentLogo] = useState(null);
    const [timeLeft, setTimeLeft] = useState(180);

    // Fetch logos
    useEffect(() => {
        if (challenger) {
            getPartyDetails(challenger).then((res) => setChallengerLogo(res.data?.logo_url));
        }
        if (opponent) {
            getPartyDetails(opponent).then((res) => setOpponentLogo(res.data?.logo_url));
        }
    }, [challenger, opponent]);

    // Timer logic for ACTIVE mode
    useEffect(() => {
        if (!isActuallyActive || !effectiveStartTime) {
            const resetId = window.setTimeout(() => setTimeLeft(180), 0);
            return () => clearTimeout(resetId);
        }

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - effectiveStartTime) / 1000);
            const remaining = Math.max(0, 180 - elapsed);
            setTimeLeft(remaining);

            if (remaining === 0) {
                clearInterval(interval);
                onTimerEnd();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isActuallyActive, effectiveStartTime, onTimerEnd]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    if (!isActuallyActive) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-2xl shadow-soft border border-gray-100 text-center animate-in fade-in zoom-in-95">
                <div className="h-16 w-16 bg-saffron/10 rounded-full flex items-center justify-center mb-4">
                    <span className="material-symbols-outlined text-3xl text-saffron">
                        groups
                    </span>
                </div>
                <h2 className="text-2xl font-black text-neutral-dark mb-2">
                    1v1 Debate Round
                </h2>

                {!challenger && !opponent ? (
                    <p className="text-india-green font-bold animate-pulse">
                        Teams will be chosen after buzzer
                    </p>
                ) : (
                    <div className="space-y-4 mt-4 w-full max-w-sm">
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase">Challenger</span>
                            <span className="font-black text-neutral-dark">{challenger || "Selecting..."}</span>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase">Opponent</span>
                            <span className="font-black text-neutral-dark">{opponent || "Selecting..."}</span>
                        </div>
                        <p className="text-saffron font-bold text-sm mt-4 italic">
                            Wait for moderator to start the timer...
                        </p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Timer Display */}
            <div className="bg-neutral-dark text-white rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-saffron/10 via-transparent to-india-green/10 opacity-50" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 text-gray-400 relative z-10">
                    Debate Time Remaining
                </p>
                <div className={`text-7xl font-black tabular-nums relative z-10 transition-colors ${timeLeft <= 20 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            {/* Split Layout */}
            <div className="grid grid-cols-2 gap-4 h-[400px]">
                {/* Left Side: Challenger */}
                <div className="bg-white rounded-2xl shadow-soft border-t-8 border-t-saffron p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <span className="material-symbols-outlined text-6xl">campaign</span>
                    </div>
                    <div className="h-32 w-32 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 shadow-inner border border-gray-100 overflow-hidden transform group-hover:scale-105 transition-transform">
                        {challengerLogo ? (
                            <img src={challengerLogo} alt="Logo" className="w-full h-full object-contain p-4" />
                        ) : (
                            <span className="text-5xl font-black text-saffron">{challenger?.charAt(0)}</span>
                        )}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-saffron/10 text-saffron text-[10px] font-bold uppercase mb-2">Challenger</span>
                    <h2 className="text-3xl font-black text-neutral-dark uppercase tracking-tight">{challenger}</h2>
                </div>

                {/* Right Side: Opponent */}
                <div className="bg-white rounded-2xl shadow-soft border-t-8 border-t-india-green p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 p-4 opacity-10">
                        <span className="material-symbols-outlined text-6xl">shield</span>
                    </div>
                    <div className="h-32 w-32 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 shadow-inner border border-gray-100 overflow-hidden transform group-hover:scale-105 transition-transform">
                        {opponentLogo ? (
                            <img src={opponentLogo} alt="Logo" className="w-full h-full object-contain p-4" />
                        ) : (
                            <span className="text-5xl font-black text-india-green">{opponent?.charAt(0)}</span>
                        )}
                    </div>
                    <span className="px-3 py-1 rounded-full bg-india-green/10 text-india-green text-[10px] font-bold uppercase mb-2">Opponent</span>
                    <h2 className="text-3xl font-black text-neutral-dark uppercase tracking-tight">{opponent}</h2>
                </div>
            </div>
        </div>
    );
}
