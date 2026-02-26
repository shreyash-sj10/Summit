export default function OneVsOneLayout({ bill, selection, timer, timerLimit }) {
  const teamA = selection?.teamA ?? "";
  const teamB = selection?.teamB ?? "";

  const total =
    typeof timerLimit === "number" && timerLimit > 0 ? timerLimit : 180;
  const used = typeof timer === "number" && timer >= 0 ? timer : 0;
  const remaining = Math.max(0, total - used);
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");

  return (
    <section className="bg-white rounded-xl p-6 shadow-soft border border-gray-100">
      <div className="text-center mb-6">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
          1v1 Debate
        </p>
        <div className="text-4xl font-black text-neutral-dark mt-2 tabular-nums font-mono">
          {minutes}:{seconds}
        </div>
        <div className="h-1 w-24 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-full mx-auto mt-2" />
        {bill?.name && (
          <p className="mt-3 text-sm font-semibold text-gray-700 max-w-xl mx-auto line-clamp-2">
            {bill.name}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 flex flex-col items-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-700 mb-1">
            Challenger
          </span>
          <div className="h-12 w-12 rounded-full bg-amber-200 flex items-center justify-center text-lg font-black text-amber-800 mb-2">
            {teamA ? teamA.charAt(0) : ""}
          </div>
          <p className="text-base font-black text-neutral-dark truncate max-w-[200px]">
            {teamA}
          </p>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4 flex flex-col items-center text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-700 mb-1">
            Champion
          </span>
          <div className="h-12 w-12 rounded-full bg-indigo-200 flex items-center justify-center text-lg font-black text-indigo-800 mb-2">
            {teamB ? teamB.charAt(0) : ""}
          </div>
          <p className="text-base font-black text-neutral-dark truncate max-w-[200px]">
            {teamB}
          </p>
        </div>
      </div>
    </section>
  );
}

