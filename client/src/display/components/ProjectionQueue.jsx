import React, { useMemo } from "react";

export default function ProjectionQueue({ queue, activeSpeaker }) {
  const waitingQueue = useMemo(
    () => (queue || []).filter((entry) => entry?.status === "waiting"),
    [queue],
  );

  const topQueue = waitingQueue.slice(0, 5);
  const activeId =
    activeSpeaker?.member?.id || activeSpeaker?.id || activeSpeaker?.member_id;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5 md:p-6 flex flex-col h-full">
      <div className="mb-4">
        <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
          Priority Queue
        </p>
        <p className="text-xs md:text-sm text-gray-500 mt-1">
          Top {Math.min(topQueue.length || 0, 5)} speakers in line.
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-hidden">
        {topQueue.length > 0 ? (
          topQueue.map((entry, index) => {
            const member = entry?.member || {};
            const name = member.name || "Member";
            const party = member.party || "Independent";
            const isActive =
              !!activeId && (member.id === activeId || entry.id === activeId);

            return (
              <div
                key={entry.id || `${name}-${index}`}
                className={`flex items-center gap-3 md:gap-4 px-3 py-2.5 rounded-xl border text-xs md:text-sm ${
                  isActive
                    ? "border-amber-300 bg-amber-50"
                    : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm tabular-nums ${
                      isActive
                        ? "bg-saffron text-white"
                        : "bg-white text-gray-500 border border-gray-200"
                    }`}
                  >
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-dark truncate">
                    {name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">
                    {entry.speech_type || "Normal Speech"}
                  </p>
                </div>
                <span className="px-2 py-1 rounded-full bg-saffron/10 text-saffron text-[10px] font-bold uppercase tracking-wide">
                  {party}
                </span>
              </div>
            );
          })
        ) : (
          <div className="mt-4 flex flex-col items-center justify-center text-sm text-gray-500 border border-dashed border-gray-300 rounded-xl py-6 px-4">
            <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">
              hourglass_empty
            </span>
            <p>Waiting for next entry…</p>
          </div>
        )}
      </div>
    </div>
  );
}

