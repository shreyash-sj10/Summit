import { useState, useEffect } from "react";
import { raiseHand } from "../../shared/services/api";
import useRaiseHandWindowStore from "../../store/useRaiseHandWindowStore";
import useSessionStore from "../../store/useSessionStore";

export default function RaiseHandButton({ queueEntry, session, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const { isEnabled, isWindowActive, timeRemaining } =
    useRaiseHandWindowStore();
  const { session: storeSession } = useSessionStore();
  const [teamHasPressed, setTeamHasPressed] = useState(false);

  const isSpeaking = queueEntry?.status === "speaking";
  const speechesLeft = Math.max(
    0,
    2 - (queueEntry?.member?.speeches_count || 0),
  );
  const noChancesLeft = speechesLeft === 0;

  // Derive raise-hand enabled flag from server-updated window store
  const raiseHandEnabled = Boolean(isEnabled);

  // Allowed stages guard
  const allowedStages = new Set([
    "BILL1_R1",
    "BILL1_R2",
    "BILL2_R1",
    "BILL2_R2",
  ]);
  const currentStage = session?.stage || storeSession?.stage;
  const stageAllowed = allowedStages.has(currentStage);

  // Whenever the server window closes or raising is disabled, clear local pressed flag
  useEffect(() => {
    if (!isWindowActive || !raiseHandEnabled || !stageAllowed) {
      setTeamHasPressed(false);
    }
  }, [isWindowActive, raiseHandEnabled, stageAllowed]);

  async function handleRaise(e) {
    if (noChancesLeft || !raiseHandEnabled || teamHasPressed || !stageAllowed) {
      e?.preventDefault?.();
      e?.stopPropagation?.();
      return;
    }
    setLoading(true);
    try {
      await raiseHand();
      // Mark locally that this team has pressed during the active window
      setTeamHasPressed(true);
      onUpdate?.();
    } catch (err) {
      if (err.response?.status !== 409) {
        console.error("Failed to raise hand:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  // If the participant is currently speaking, show speaking state unchanged
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

  // Stage guard or disabled by server -> Disabled state (gray)
  if (!stageAllowed || !raiseHandEnabled) {
    return (
      <button
        disabled
        className="col-span-8 group relative overflow-hidden rounded-xl p-5 flex flex-col justify-between h-32 bg-gray-100 border border-gray-200 opacity-70 cursor-not-allowed"
      >
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4">
          <span className="material-symbols-outlined text-[120px]">
            front_hand
          </span>
        </div>
        <div className="flex items-center justify-between w-full">
          <span className="material-symbols-outlined text-3xl bg-white/40 p-2 rounded-lg backdrop-blur-sm text-gray-400">
            front_hand
          </span>
          <span className="bg-white/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Cannot Raise Hand
          </span>
        </div>
        <span className="text-xs font-medium text-gray-500 mt-2">
          You can raise your hand only during active debate stages.
        </span>
      </button>
    );
  }

  // Pressed state (orange) when teamHasPressed === true
  if (teamHasPressed) {
    return (
      <button
        disabled
        className="col-span-8 group relative overflow-hidden rounded-xl bg-amber-500 text-white p-5 flex flex-col justify-between h-32 shadow-lg shadow-amber-500/20 cursor-not-allowed"
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
            Hand Raised
          </span>
        </div>
        <span className="text-xl font-black tracking-tighter text-left mt-2">
          HAND RAISED
        </span>
      </button>
    );
  }

  // Enabled state (green)
  return (
    <button
      onClick={handleRaise}
      disabled={loading || noChancesLeft}
      className={`col-span-8 group relative overflow-hidden rounded-xl p-5 flex flex-col justify-between h-32 transition-all ${
        noChancesLeft ? "cursor-not-allowed opacity-60" : "active:scale-[0.98]"
      } ${noChancesLeft ? "bg-gray-300 text-gray-500" : "bg-india-green text-white shadow-lg shadow-india-green/20"}`}
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
            {timeRemaining > 0
              ? `${Math.ceil(timeRemaining / 1000)}s`
              : "Priority"}
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
