import { useState } from "react";
import { raiseHand, lowerHand } from "../../shared/services/api";
import useRaiseHandWindowStore from "../../store/useRaiseHandWindowStore";
import { MAX_SPEECHES_PER_BILL } from "../../shared/constants";

export default function RaiseHandButton({ queueEntry, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const { isWindowActive, hasRaisedHand, timeRemaining } = useRaiseHandWindowStore();

  const isWaiting = queueEntry?.status === "waiting";
  const isSpeaking = queueEntry?.status === "speaking";
  const speechesLeft = Math.max(
    0,
    MAX_SPEECHES_PER_BILL - (queueEntry?.member?.speeches_count || 0),
  );
  const noChancesLeft = speechesLeft === 0;

  async function handleRaise(e) {
    if (noChancesLeft || !isWindowActive || hasRaisedHand) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setLoading(true);
    try {
      await raiseHand();
      onUpdate();
    } catch (e) {
      if (e.response?.status !== 409) {
        console.error("Failed to raise hand:", e);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLower() {
    setLoading(true);
    try {
      await lowerHand();
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  /* ── 1. Speaking State (Priority) ── */
  if (isSpeaking) {
    return (
      <button
        disabled
        className="col-span-8 group relative overflow-hidden rounded-xl bg-saffron text-white p-5 flex flex-col justify-between h-32 shadow-lg shadow-saffron/20"
      >
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
          <span className="material-symbols-outlined text-[120px]">mic</span>
        </div>
        <div className="flex items-center justify-between w-full">
          <span className="material-symbols-outlined text-3xl bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            mic
          </span>
          <span className="bg-white/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest animate-pulse">
            Speaking
          </span>
        </div>
        <span className="text-xl font-black tracking-tighter text-left mt-2 uppercase">
          Speaker Floor
        </span>
      </button>
    );
  }

  /* ── 2. Waiting (In Queue) State ── */
  if (isWaiting) {
    return (
      <button
        onClick={handleLower}
        disabled={loading}
        className="col-span-8 group relative overflow-hidden rounded-xl bg-amber-500 text-white p-5 flex flex-col justify-between h-32 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
      >
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
          <span className="material-symbols-outlined text-[120px]">
            hourglass_top
          </span>
        </div>
        <div className="flex items-center justify-between w-full">
          <span className="material-symbols-outlined text-3xl bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            front_hand
          </span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
            In Queue
          </span>
        </div>
        <span className="text-xl font-black tracking-tighter text-left mt-2">
          {loading ? "LOWERING..." : "LOWER HAND"}
        </span>
      </button>
    );
  }

  /* ── 3. STRICT CONTRACT: Hand Raised (Acknowledged) -> ORANGE (Disabled) ── */
  if (hasRaisedHand) {
    return (
      <div className="col-span-8 relative overflow-hidden rounded-xl p-5 flex flex-col justify-between h-32 bg-orange-500 text-white shadow-lg shadow-orange-500/20 opacity-90 cursor-default">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
          <span className="material-symbols-outlined text-[120px]">
            check_circle
          </span>
        </div>
        <div className="flex items-center justify-between w-full">
          <span className="material-symbols-outlined text-3xl bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            front_hand
          </span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
            Recorded
          </span>
        </div>
        <span className="text-xl font-black tracking-tighter text-left mt-2">
          HAND RAISED
        </span>
      </div>
    );
  }

  /* ── 4. STRICT CONTRACT: Window Active & Not Raised -> GREEN (Enabled) ── */
  if (isWindowActive && !hasRaisedHand) {
    return (
      <button
        onClick={handleRaise}
        disabled={loading || noChancesLeft}
        className={`col-span-8 group relative overflow-hidden rounded-xl p-5 flex flex-col justify-between h-32 transition-all active:scale-[0.98] ${noChancesLeft
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-india-green text-white shadow-lg shadow-india-green/20"
          }`}
      >
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
          <span className="material-symbols-outlined text-[120px]">
            front_hand
          </span>
        </div>
        <div className="flex items-center justify-between w-full">
          <span className="material-symbols-outlined text-3xl bg-white/20 p-2 rounded-lg backdrop-blur-sm">
            front_hand
          </span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
            {timeRemaining > 0 ? `${Math.ceil(timeRemaining / 1000)}s` : "5s"}
          </span>
        </div>
        <span className="text-xl font-black tracking-tighter text-left mt-2">
          {noChancesLeft ? "NO CHANCES LEFT" : loading ? "RAISING..." : "RAISE HAND"}
        </span>
      </button>
    );
  }

  /* ── 5. STRICT CONTRACT: Window Closed & Not Raised -> GREY (Disabled) ── */
  return (
    <div className="col-span-8 relative overflow-hidden rounded-xl p-5 flex flex-col justify-between h-32 bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed">
      <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
        <span className="material-symbols-outlined text-[120px]">
          lock
        </span>
      </div>
      <div className="flex items-center justify-between w-full">
        <span className="material-symbols-outlined text-3xl bg-white/20 p-2 rounded-lg backdrop-blur-sm">
          front_hand
        </span>
      </div>
      <span className="text-sm font-black tracking-widest text-left mt-2 uppercase opacity-60">
        Raise Hand Closed
      </span>
    </div>
  );
}
