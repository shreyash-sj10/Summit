import { useEffect, useMemo, useState } from "react";
import useUserStore from "../../store/useUserStore";
import useSessionStore from "../../store/useSessionStore";
import useQueueStore from "../../store/useQueueStore";
import { normalizeStageValue } from "../../shared/utils/stageBehaviors";
import UnifiedProjectionLayout from "../components/UnifiedProjectionLayout";
import ProjectionLeaderboard from "../components/ProjectionLeaderboard";

const WAITING_DURATION_SECONDS = 300;

function formatTime(seconds) {
  const clamped = Math.max(0, Math.floor(seconds));
  const mins = String(Math.floor(clamped / 60)).padStart(2, "0");
  const secs = String(clamped % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function WaitingProjection({ totalTeams }) {
  const [remaining, setRemaining] = useState(WAITING_DURATION_SECONDS);

  useEffect(() => {
    const resetId = window.setTimeout(() => {
      setRemaining(WAITING_DURATION_SECONDS);
    }, 0);
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(resetId);
      clearInterval(id);
    };
  }, []);

  const safeTotal = Number.isFinite(totalTeams) ? totalTeams : 0;

  return (
    <div className="bg-background-light font-display text-neutral-dark flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
      {/* Dot pattern bg */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Top Tricolor Stripe */}
      <div className="absolute top-0 w-full h-2 flex z-10">
        <div className="flex-1 bg-saffron" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-india-green" />
      </div>

      {/* Header */}
      <header className="absolute top-2 w-full px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-saffron/10 rounded-lg flex items-center justify-center border border-saffron/20 shadow-sm">
            <span className="material-symbols-outlined text-saffron">account_balance</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-neutral-dark uppercase">
              Summit
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gray-400">
              Debate Projection Screen
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-saffron/10">
            <span className="w-2 h-2 rounded-full bg-india-green animate-pulse" />
            <span className="text-sm font-medium text-neutral-dark">Live Server</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl px-6 text-center z-10 relative mt-20">
        {/* Logo */}
        <div className="w-40 h-40 md:w-48 md:h-48 rounded-full flex items-center justify-center overflow-hidden mb-8 transition-transform duration-300 relative">
          <div className="absolute inset-0 bg-saffron/20 blur-2xl rounded-full mix-blend-multiply" />
          <img
            src="/logo.png"
            alt="Summit"
            className="w-full h-full object-contain relative z-10 drop-shadow-lg"
          />
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-2 text-neutral-dark">
          Summit
        </h1>

        <div className="h-1 w-24 bg-saffron mx-auto rounded-full mb-4" />

        <p className="text-xl md:text-2xl font-medium text-gray-500 mb-4">
          Debate will start soon
        </p>

        {/* Countdown */}
        <div className="mb-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-400 mb-2">
            Starting In
          </p>
          <div
            className="font-mono font-extrabold text-4xl md:text-5xl lg:text-6xl text-ashoka-blue tracking-[0.25em]"
            style={{
              textShadow: "0 0 18px rgba(15,23,42,0.25)",
            }}
          >
            {formatTime(remaining)}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          {/* Session Status */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col items-start gap-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-saffron">groups</span>
                <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                  Session Status
                </span>
              </div>
              <span className="flex items-center gap-2 text-saffron font-bold text-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-saffron" />
                </span>
                Waiting Room
              </span>
            </div>
            <p className="text-lg font-bold text-left text-neutral-dark">
              Moderators are joining...
            </p>

            <p className="text-xs font-semibold text-gray-500">
              Participants Connected: <span className="text-neutral-dark">{safeTotal}</span>
            </p>

            <div className="w-full mt-auto">
              <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                <span>Loading</span>
                <span>85% Ready</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-saffron via-saffron to-india-green w-[85%] rounded-full shadow-inner" />
              </div>
            </div>
          </div>

          {/* Next Agenda */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col items-start gap-4 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-india-green">event_note</span>
              <span className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Next Agenda
              </span>
            </div>
            <div className="flex flex-col items-start">
              <p className="text-lg font-bold text-neutral-dark">Public Policy Reform</p>
              <div className="flex items-center gap-2 text-gray-500 mt-1">
                <span className="material-symbols-outlined text-sm">schedule</span>
                <span className="text-sm font-medium">Debate Will Begin Shortly</span>
              </div>
            </div>
            <div className="flex -space-x-2 mt-auto pt-4">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300" />
              <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400" />
              <div className="w-8 h-8 rounded-full border-2 border-white bg-saffron flex items-center justify-center text-[10px] text-white font-bold">
                +12
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Decorative Element */}
      <div className="absolute bottom-0 w-full h-1 flex z-10 opacity-50">
        <div className="flex-1 bg-saffron" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-india-green" />
      </div>
    </div>
  );
}

function WinnerProjection({ sessionTitle, leaderboard }) {
  const sorted = useMemo(
    () =>
      [...(leaderboard || [])].sort(
        (a, b) => (b.points || 0) - (a.points || 0),
      ),
    [leaderboard],
  );
  const winner = sorted[0];

  return (
    <div className="min-h-screen w-screen bg-background-light font-display text-neutral-dark flex flex-col relative overflow-hidden">
      <div className="absolute top-0 w-full h-2 flex z-10">
        <div className="flex-1 bg-saffron" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-india-green" />
      </div>

      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />

      <header className="relative z-10 px-6 lg:px-12 pt-10 pb-6 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-saffron via-accent to-india-green flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-white text-2xl">
              emoji_events
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-400">
              Summit · Session complete
            </p>
            <h1 className="text-xl lg:text-2xl font-extrabold text-neutral-dark tracking-tight">
              {sessionTitle || "Parliamentary session"}
            </h1>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center px-6 lg:px-12 py-10 max-w-5xl mx-auto w-full gap-10">
        {winner ? (
          <section className="w-full text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-saffron">
              Leading party
            </p>
            <div className="inline-flex flex-col items-center gap-3 rounded-2xl border-2 border-saffron bg-gradient-to-b from-saffron/15 to-white px-10 py-8 shadow-xl">
              <span className="text-6xl lg:text-8xl font-black text-neutral-dark tracking-tighter">
                {winner.party}
              </span>
              <p className="text-sm font-semibold text-gray-600">
                {winner.points ?? 0}{" "}
                <span className="text-gray-400 font-medium">points</span>
              </p>
            </div>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Final standings are locked for this session. Thank you to all
              participants.
            </p>
          </section>
        ) : (
          <p className="text-center text-gray-500 text-sm">
            No leaderboard data for this session yet.
          </p>
        )}

        <section className="w-full flex-1 min-h-[200px]">
          <ProjectionLeaderboard leaderboard={leaderboard} />
        </section>
      </main>

      <div className="absolute bottom-0 w-full h-2 flex z-10 opacity-80">
        <div className="flex-1 bg-saffron" />
        <div className="flex-1 bg-white" />
        <div className="flex-1 bg-india-green" />
      </div>
    </div>
  );
}

export default function ProjectionPage() {
  const { initRealtimeUser } = useUserStore();
  const {
    stage,
    session,
    initRealtimeSession,
    leaderboard,
    activeSpeaker,
    timer,
    timerLimit,
    billData,
  } = useSessionStore();
  const { queue, initQueueRealtime } = useQueueStore();

  useEffect(() => {
    initRealtimeSession();
    initQueueRealtime();
    initRealtimeUser();
  }, [initRealtimeSession, initQueueRealtime, initRealtimeUser]);

  const normalizedStage = normalizeStageValue(stage ?? session?.stage);

  const isUnifiedStage =
    normalizedStage === "BILL1_SETUP" ||
    normalizedStage === "BILL2_SETUP_PREP" ||
    normalizedStage === "BILL1_R1" ||
    normalizedStage === "BILL2_R1" ||
    normalizedStage === "BILL1_R2" ||
    normalizedStage === "BILL2_R2";

  const totalTeams = useMemo(() => {
    const uniqueTeams = new Set();
    (queue || []).forEach((entry) => {
      const team =
        entry.member?.party ||
        entry.member?.team_name ||
        entry.member?.team ||
        entry.member?.id;
      if (team) uniqueTeams.add(team);
    });
    return uniqueTeams.size || (queue || []).length || 0;
  }, [queue]);

  const isBill1Stage = normalizedStage?.startsWith("BILL1_");
  const isBill2Stage = normalizedStage?.startsWith("BILL2_");

  const currentBill = useMemo(() => {
    if (!normalizedStage) return null;
    if (isBill1Stage) {
      return (
        session?.bill_1_data ||
        billData?.bill1 ||
        session?.bill_data?.bill1 ||
        null
      );
    }
    if (isBill2Stage) {
      return (
        session?.bill_2_data ||
        billData?.bill2 ||
        session?.bill_data?.bill2 ||
        null
      );
    }
    return null;
  }, [normalizedStage, isBill1Stage, isBill2Stage, session, billData]);

  if (normalizedStage === "WAITING") {
    return <WaitingProjection totalTeams={totalTeams} />;
  }

  if (normalizedStage === "WINNER") {
    return (
      <WinnerProjection
        sessionTitle={session?.title}
        leaderboard={leaderboard}
      />
    );
  }

  if (isUnifiedStage) {
    return (
      <div className="min-h-screen w-screen bg-background-light font-display text-neutral-dark flex flex-col">
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="h-1 flex w-full">
            <div className="flex-1 bg-saffron" />
            <div className="flex-1 bg-white border-y border-gray-200" />
            <div className="flex-1 bg-india-green" />
          </div>
          <div className="px-4 lg:px-8 py-3 flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-saffron via-accent to-india-green flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-white text-2xl">
                  gavel
                </span>
              </div>
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-neutral-dark leading-none">
                  Summit
                </h1>
                <p className="text-xs font-medium text-gray-500 mt-0.5 uppercase tracking-wide">
                  Moderator Panel
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-dark">
              {session && (
                <span className="bg-white/80 px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                  Active: {queue?.length ?? 0}
                </span>
              )}
            </div>
          </div>
          {session && (
            <div className="px-4 lg:px-8 py-1.5 bg-gradient-to-r from-saffron/10 via-white to-india-green/10 border-y border-gray-100 flex items-center justify-between text-xs font-bold text-neutral-dark w-full">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-saffron" />
                </span>
                <span className="uppercase tracking-wider">
                  Live: {session.title}
                </span>
              </div>
            </div>
          )}
        </div>

        <UnifiedProjectionLayout
          stage={normalizedStage}
          bill={currentBill}
          queue={queue}
          leaderboard={leaderboard}
          activeSpeaker={activeSpeaker}
          timer={timer}
          timerLimit={timerLimit}
        />
      </div>
    );
  }

  return null;
}

