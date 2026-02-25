import { useState } from "react";
import { raiseHand, lowerHand } from "../../shared/services/api";
import useRaiseHandStore from "../../store/useRaiseHandStore";
import useRaiseHandWindowStore from "../../store/useRaiseHandWindowStore";

export default function RaiseHandButton({ queueEntry, session, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const { raiseHandEnabled } = useRaiseHandStore();
  const { isWindowActive, timeRemaining } = useRaiseHandWindowStore();

  const isWaiting = queueEntry?.status === "waiting";
  const isSpeaking = queueEntry?.status === "speaking";
  const speechesLeft = Math.max(
    0,
    2 - (queueEntry?.member?.speeches_count || 0),
  );
  const noChancesLeft = speechesLeft === 0;

  async function handleRaise(e) {
    if (noChancesLeft || !isWindowActive) {
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
        <span className="text-xl font-black tracking-tighter text-left mt-2">
          YOU'RE ON!
        </span>
      </button>
    );
  }

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
          <span className="material-symbols-outlined text-3xl bg-white/20 p-2 rounded-lg backdrop-blur-sm animate-bounce">
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

  if (!raiseHandEnabled || !isWindowActive) {
    return (
      <div className="col-span-8 relative overflow-hidden rounded-xl p-5 flex flex-col justify-between h-32 bg-red-100 border border-red-300 opacity-60 cursor-not-allowed">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
          <span className="material-symbols-outlined text-[120px]">
            front_hand
          </span>
        </div>
        <div className="flex items-center justify-between w-full">
          <span className="material-symbols-outlined text-3xl bg-white/20 p-2 rounded-lg backdrop-blur-sm text-red-600">
            front_hand
          </span>
        </div>
        <span className="text-xl font-black tracking-tighter text-left mt-2 text-red-600">
          NOT ALLOWED
        </span>
      </div>
    );
  }

  return (
    <button
      onClick={handleRaise}
      disabled={loading || noChancesLeft}
      className={`col-span-8 group relative overflow-hidden rounded-xl p-5 flex flex-col justify-between h-32 transition-all ${
        noChancesLeft ? "cursor-not-allowed opacity-60" : "active:scale-[0.98]"
      } ${
        noChancesLeft
          ? "bg-gray-300 text-gray-500"
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
        {!noChancesLeft && (
          <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
            {timeRemaining > 0 ? `${Math.ceil(timeRemaining / 1000)}s` : "Priority"}
          </span>
        )}
      </div>
      <span className="text-xl font-black tracking-tighter text-left mt-2">
        {noChancesLeft
          ? "NO CHANCES LEFT"
          : loading
            ? "RAISING..."
            : "RAISE HAND"}
      </span>
    </button>
  );
}
