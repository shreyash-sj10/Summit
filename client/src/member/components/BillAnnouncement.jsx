export default function BillAnnouncement({ bill }) {
  const name = bill?.name ?? "";
  const summary = bill?.summary ?? "";

  return (
    <section className="bg-white rounded-xl p-5 shadow-soft border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
      <div className="flex items-center justify-between gap-3 relative z-10 mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-saffron text-3xl">
            gavel
          </span>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.25em]">
              Bill Announced
            </p>
            {name && (
              <h2 className="text-lg font-black text-neutral-dark leading-snug">
                {name}
              </h2>
            )}
          </div>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-saffron/10 text-saffron border border-saffron/30">
          Bill Setup
        </span>
      </div>
      {summary && (
        <p className="text-sm text-gray-600 leading-relaxed relative z-10">
          {summary}
        </p>
      )}
      <div className="mt-4 pt-3 border-t border-gray-100 relative z-10">
        <p className="text-xs text-gray-500 font-medium">
          Debate will begin shortly.{" "}
          <span className="font-semibold text-neutral-dark">
            Please prepare your arguments and notes.
          </span>
        </p>
      </div>
    </section>
  );
}

