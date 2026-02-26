import React, { useMemo } from "react";

export default function ProjectionLeaderboard({ leaderboard }) {
  const sorted = useMemo(() => {
    if (!leaderboard || !leaderboard.length) return [];
    return [...leaderboard].sort((a, b) => (b.points || 0) - (a.points || 0));
  }, [leaderboard]);

  if (!sorted.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
            Session Leaderboard
          </p>
          <p className="text-[10px] md:text-[11px] text-gray-500">
            Updates every few seconds
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-500">
          No points awarded yet.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
          Session Leaderboard
        </p>
        <p className="text-[10px] md:text-[11px] text-gray-500">
          Updates every few seconds
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {sorted.slice(0, 4).map((entry, index) => {
          const isLeader = index === 0;
          return (
            <div
              key={entry.party || index}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-xs md:text-sm ${
                isLeader
                  ? "border-saffron bg-saffron/10"
                  : "border-gray-100 bg-gray-50"
              }`}
            >
              <div className="flex flex-col items-center justify-center">
                <span className="h-7 w-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-500 tabular-nums">
                  {(index + 1).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-semibold truncate ${
                    isLeader ? "text-neutral-dark" : "text-gray-700"
                  }`}
                >
                  {entry.party}
                </p>
                <p className="text-[11px] text-gray-400">pts</p>
              </div>
              <span
                className={`font-extrabold tabular-nums ${
                  isLeader ? "text-saffron" : "text-neutral-dark"
                }`}
              >
                {entry.points ?? 0}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

