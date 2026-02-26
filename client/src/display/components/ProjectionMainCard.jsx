import React from "react";

function formatTimer(remainingSeconds) {
  const safe = Math.max(0, Math.floor(remainingSeconds || 0));
  const mins = String(Math.floor(safe / 60)).padStart(2, "0");
  const secs = String(safe % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function ProjectionMainCard({
  stage,
  bill,
  activeSpeaker,
  timer,
  timerLimit,
}) {
  const isSetupStage = stage === "BILL1_SETUP" || stage === "BILL2_SETUP_PREP";
  const isR1Stage = stage === "BILL1_R1" || stage === "BILL2_R1";
  const isOneVsOneStage = stage === "BILL1_R2" || stage === "BILL2_R2";

  const title = bill?.name || bill?.title || "Bill title pending";
  const summary =
    bill?.summary ||
    bill?.description ||
    "Moderators will shortly announce the agenda details for this round.";

  const remaining =
    isR1Stage && typeof timer === "number"
      ? Math.max(0, (timerLimit || 60) - timer)
      : null;

  const speakerName =
    activeSpeaker?.name || activeSpeaker?.member?.name || "Awaiting Speaker";
  const speakerParty =
    activeSpeaker?.party || activeSpeaker?.member?.party || "—";
  const speakerConstituency =
    activeSpeaker?.constituency ||
    activeSpeaker?.member?.constituency ||
    "";

  const affiliation =
    activeSpeaker?.affiliation ||
    activeSpeaker?.member?.affiliation ||
    "Front Bench";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 md:p-8 flex flex-col h-full">
      <div className="border-t-4 border-saffron rounded-2xl -mt-6 pt-4 px-2 md:px-4 bg-gradient-to-br from-white to-gray-50">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-neutral-dark leading-tight">
          {title}
        </h2>
        <p className="mt-3 text-sm md:text-base text-gray-600 max-w-2xl">
          {summary}
        </p>
      </div>

      {!isOneVsOneStage && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 flex-1 items-center">
          <div className="space-y-4">
            {isR1Stage && (
              <>
                <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                  Currently Speaking
                </p>
                <p className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-neutral-dark">
                  {speakerName}
                </p>
                <div className="space-y-1">
                  <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.25em] text-gray-400">
                    Affiliation
                  </p>
                  <p className="text-sm md:text-base font-semibold text-saffron">
                    {affiliation}
                  </p>
                  {speakerConstituency && (
                    <p className="text-xs md:text-sm text-gray-500">
                      {speakerConstituency}
                    </p>
                  )}
                </div>
              </>
            )}

            {isSetupStage && (
              <div className="space-y-3">
                <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                  Upcoming Round
                </p>
                <p className="text-xl md:text-2xl font-extrabold text-neutral-dark">
                  Teams preparing…
                </p>
                <p className="text-sm md:text-base text-gray-600 max-w-md">
                  Delegates are aligning strategy and reviewing notes. The floor
                  will open shortly.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            {isR1Stage && remaining !== null ? (
              <div className="relative w-40 h-40 md:w-52 md:h-52 lg:w-60 lg:h-60">
                <div className="absolute inset-0 rounded-full border-4 md:border-8 border-gray-200 bg-white shadow-2xl" />
                <div className="absolute inset-3 md:inset-4 rounded-full border-[6px] md:border-[8px] border-saffron" />
                <div className="absolute inset-8 md:inset-9 rounded-full bg-white flex flex-col items-center justify-center">
                  <span className="font-mono text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-[0.15em] text-neutral-dark">
                    {formatTimer(remaining)}
                  </span>
                  <span className="mt-1 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                    Seconds Left
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-xs md:max-w-sm aspect-[3/1] rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center">
                <span className="text-xs md:text-sm text-gray-500 tracking-[0.3em] uppercase">
                  Timer inactive
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {isOneVsOneStage && (
        <div className="grid grid-cols-12 gap-6 mt-8 items-center flex-1">
          <div className="col-span-12 md:col-span-4 flex flex-col items-center text-center gap-3">
            <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
              For the Motion
            </p>
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400">
              {speakerName?.charAt(0) || "A"}
            </div>
            <div>
              <p className="text-xl md:text-2xl font-black text-neutral-dark">
                {speakerName}
              </p>
              <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-saffron mt-1">
                {speakerParty}
              </p>
              {speakerConstituency && (
                <p className="text-[11px] md:text-xs text-gray-500 mt-1">
                  {speakerConstituency}
                </p>
              )}
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 flex items-center justify-center">
            <div className="relative w-44 h-44 md:w-56 md:h-56 lg:w-64 lg:h-64">
              <div className="absolute inset-0 rounded-full border-4 md:border-8 border-gray-200 bg-white shadow-2xl" />
              <div className="absolute inset-3 md:inset-4 rounded-full border-[6px] md:border-[8px] border-saffron" />
              <div className="absolute inset-7 md:inset-8 rounded-full bg-white flex flex-col items-center justify-center">
                <span className="font-mono text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-[0.2em] text-neutral-dark">
                  03:00
                </span>
                <span className="mt-1 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
                  Seconds Left
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 flex flex-col items-center text-center gap-3">
            <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
              Against the Motion
            </p>
            <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400">
              B
            </div>
            <div>
              <p className="text-xl md:text-2xl font-black text-neutral-dark">
                To be announced
              </p>
              <p className="text-[11px] md:text-xs font-bold uppercase tracking-[0.2em] text-saffron mt-1">
                Opposition Bench
              </p>
              <p className="text-[11px] md:text-xs text-gray-500 mt-1">
                —
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

