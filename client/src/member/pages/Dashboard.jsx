import { useState, useEffect, useCallback, useRef } from "react";
import useUserStore from "../../store/useUserStore";
import useSessionStore from "../../store/useSessionStore";
import useQueueStore from "../../store/useQueueStore";
import useRaiseHandWindowStore from "../../store/useRaiseHandWindowStore";
import BillAnnouncement from "../components/BillAnnouncement";
import OneVsOneLayout from "../components/OneVsOneLayout";
import NormalDebateLayout from "../components/NormalDebateLayout";
import { getPartyDetails, getRaiseHandStatus } from "../../shared/services/api";
import { supabase } from "../../shared/services/supabase";
import TopBar from "../../shared/components/TopBar";
import FloorStatus from "../../shared/components/FloorStatus";
import RaiseHandButton from "../components/RaiseHandButton";
import PollCard from "../components/PollCard";
import PowerCards from "../components/PowerCards";
import PartyDetailsForm from "../components/PartyDetailsForm";
import ChatPanel from "../components/ChatPanel";
import StageOverlay from "../../components/floor/StageOverlay";
import PowerCardAnimation from "../../components/floor/PowerCardAnimation";
import Leaderboard from "../../moderator/components/Leaderboard";
import WaitingRoom from "../components/WaitingRoom";

const TABS = [
  { id: "home", icon: "dashboard", label: "Session" },
  { id: "polls", icon: "leaderboard", label: "Polls" },
  { id: "chat", icon: "forum", label: "Chat" },
];

export default function MemberDashboard() {
  const { user, powerCards, fetchCards, initRealtimeUser } = useUserStore();
  const {
    session,
    poll,
    leaderboard,
    fetchActiveSession,
    initRealtimeSession,
    billData,
    teamSelections,
    timer,
    timerLimit,
  } = useSessionStore();
  const { queue, initQueueRealtime } = useQueueStore();
  const { isWindowActive, timeRemaining, setWindowState, setTimeRemaining } =
    useRaiseHandWindowStore();

  const [partyDetails, setPartyDetails] = useState(undefined); // undefined = loading, null = not found
  const [tab, setTab] = useState("home");
  const [oneVsOneState, setOneVsOneState] = useState(null); // "SELECTION" | "ACTIVE" | null
  const [oneVsOneStartTime, setOneVsOneStartTime] = useState(null);
  const [oneVsOneRemaining, setOneVsOneRemaining] = useState(180);
  const [oneVsOneChallenger, setOneVsOneChallenger] = useState(null);
  const [oneVsOneOpponent, setOneVsOneOpponent] = useState(null);
  const oneVsOneTimerRef = useRef(null);

  const myQueueEntry = queue.find((q) => q.member?.id === user?.id);

  const loadParty = useCallback(async () => {
    if (!user?.party) {
      setPartyDetails(null);
      return;
    }
    try {
      const res = await getPartyDetails(user.party);
      if (!res.data) {
        setPartyDetails(null);
      } else {
        setPartyDetails(res.data);
      }
    } catch (err) {
      // Check specifically for 404 or missing table errors
      if (
        err.response?.status === 404 ||
        err.response?.data?.message?.includes("not found")
      ) {
        setPartyDetails(null);
      } else {
        console.error("Failed to load party details:", err);
        setPartyDetails(null); // Fallback to prompt form rather than stay stuck undefined
      }
    }
  }, [user?.party]);

  // Subscribe to raise hand window broadcasts via Realtime
  useEffect(() => {
    const channel = supabase
      .channel("raise-hand-updates")
      .on("broadcast", { event: "window_state_changed" }, (payload) => {
        const { isEnabled, isWindowActive, timeRemaining } = payload.payload;
        setWindowState(isEnabled, isWindowActive, timeRemaining);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [setWindowState]);

  // Poll for raise hand window status every 500ms when window is active
  useEffect(() => {
    const pollWindowStatus = async () => {
      try {
        const res = await getRaiseHandStatus();
        const {
          isEnabled,
          isWindowActive: active,
          timeRemaining: remaining,
        } = res.data;
        setWindowState(isEnabled, active, remaining);
      } catch (err) {
        console.error("Failed to poll raise hand status:", err);
      }
    };

    // Initial poll immediately
    pollWindowStatus();

    // Set up polling interval - poll frequently to track countdown accurately
    const interval = setInterval(pollWindowStatus, 500);

    return () => clearInterval(interval);
  }, [setWindowState]);

  // Local countdown timer to update UI more smoothly
  useEffect(() => {
    if (!isWindowActive || timeRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(timeRemaining - 100);
    }, 100);

    return () => clearInterval(timer);
  }, [isWindowActive, timeRemaining, setTimeRemaining]);

  useEffect(() => {
    initRealtimeSession();
    initQueueRealtime();
    initRealtimeUser();
    fetchCards();
    loadParty();
  }, [
    initRealtimeSession,
    initQueueRealtime,
    initRealtimeUser,
    fetchCards,
    loadParty,
  ]);

  const speechesLeft = Math.max(0, 2 - (user?.speeches_count || 0));

  // Manage local 1v1 state only for BILL1_R2 / BILL2_R2
  // On stage entry, default to SELECTION unless a valid start timestamp exists (refresh case)
  useEffect(() => {
    const currentStage = session?.stage;
    const isOneVsOneStage =
      currentStage === "BILL1_R2" || currentStage === "BILL2_R2";

    if (!isOneVsOneStage) {
      setOneVsOneState(null);
      setOneVsOneStartTime(null);
      setOneVsOneRemaining(180);
      setOneVsOneChallenger(null);
      setOneVsOneOpponent(null);
      if (oneVsOneTimerRef.current) {
        clearInterval(oneVsOneTimerRef.current);
        oneVsOneTimerRef.current = null;
      }
      return;
    }

    const storageKey = `abhimat_one_vs_one_start_${currentStage}`;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const ts = Number(raw);
        if (!Number.isNaN(ts)) {
          const elapsed = Math.floor((Date.now() - ts) / 1000);
          const remaining = Math.max(0, 180 - elapsed);
          if (remaining > 0) {
            setOneVsOneState("ACTIVE");
            setOneVsOneStartTime(ts);
            setOneVsOneRemaining(remaining);
            return;
          }
          // Expired – clear stored timestamp
          window.localStorage.removeItem(storageKey);
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    // Fallback: selection mode, no active timer
    setOneVsOneState("SELECTION");
    setOneVsOneStartTime(null);
    setOneVsOneRemaining(180);
    setOneVsOneChallenger(null);
    setOneVsOneOpponent(null);
  }, [session?.stage]);

  // Mirror moderator team selection into local challenger/opponent during SELECTION (no active round)
  useEffect(() => {
    const currentStage = session?.stage;
    const isOneVsOneStage =
      currentStage === "BILL1_R2" || currentStage === "BILL2_R2";

    if (!isOneVsOneStage) return;
    if (oneVsOneState !== "SELECTION" || oneVsOneStartTime) return;

    const key = currentStage === "BILL1_R2" ? "bill1Round2" : "bill2Round2";
    const selection =
      session?.team_selections?.[key] || teamSelections?.[key] || null;

    setOneVsOneChallenger(selection?.teamA || null);
    setOneVsOneOpponent(selection?.teamB || null);
  }, [
    session?.stage,
    session?.team_selections,
    teamSelections,
    oneVsOneState,
    oneVsOneStartTime,
  ]);

  // Listen for 1v1 start broadcasts to activate timer with a shared start timestamp
  useEffect(() => {
    const channel = supabase
      .channel("one-vs-one")
      .on("broadcast", { event: "one_vs_one_start" }, (payload) => {
        const { stage: startedStage, startTime } = payload.payload || {};
        const currentStage = session?.stage;
        if (!startedStage || !startTime) return;
        if (currentStage !== startedStage) return;

        const ts = Number(startTime);
        if (Number.isNaN(ts)) return;

        const elapsed = Math.floor((Date.now() - ts) / 1000);
        const remaining = Math.max(0, 180 - elapsed);
        if (remaining <= 0) return;

        setOneVsOneState("ACTIVE");
        setOneVsOneStartTime(ts);
        setOneVsOneRemaining(remaining);

        try {
          const storageKey = `abhimat_one_vs_one_start_${startedStage}`;
          window.localStorage.setItem(storageKey, String(ts));
        } catch {
          // Ignore localStorage errors
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.stage]);

  // 180-second 1v1 timer — derived from a shared start timestamp
  useEffect(() => {
    const currentStage = session?.stage;
    const isOneVsOneStage =
      currentStage === "BILL1_R2" || currentStage === "BILL2_R2";

    if (!isOneVsOneStage || oneVsOneState !== "ACTIVE" || !oneVsOneStartTime) {
      if (oneVsOneTimerRef.current) {
        clearInterval(oneVsOneTimerRef.current);
        oneVsOneTimerRef.current = null;
      }
      return;
    }

    const updateRemaining = () => {
      const elapsed = Math.floor((Date.now() - oneVsOneStartTime) / 1000);
      const remaining = Math.max(0, 180 - elapsed);
      setOneVsOneRemaining(remaining);
      if (remaining <= 0 && oneVsOneTimerRef.current) {
        clearInterval(oneVsOneTimerRef.current);
        oneVsOneTimerRef.current = null;

        // Round ended: return to SELECTION, clear local 1v1 state, but keep stage
        setOneVsOneState("SELECTION");
        setOneVsOneStartTime(null);
        setOneVsOneRemaining(180);
        setOneVsOneChallenger(null);
        setOneVsOneOpponent(null);

        try {
          const storageKey = `abhimat_one_vs_one_start_${session?.stage}`;
          if (storageKey) window.localStorage.removeItem(storageKey);
        } catch {
          // Ignore localStorage errors
        }
      }
    };

    // Initial sync
    updateRemaining();

    if (oneVsOneTimerRef.current) {
      clearInterval(oneVsOneTimerRef.current);
    }

    oneVsOneTimerRef.current = setInterval(updateRemaining, 1000);

    return () => {
      if (oneVsOneTimerRef.current) {
        clearInterval(oneVsOneTimerRef.current);
        oneVsOneTimerRef.current = null;
      }
    };
  }, [session?.stage, oneVsOneState, oneVsOneStartTime]);

  /* ── Desktop sidebar nav ─────────────────────────────────────────── */
  const Sidebar = () => (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-gray-100 min-h-[calc(100vh-64px)] sticky top-[64px] overflow-y-auto transition-transform">
      {/* Profile summary */}
      <div className="p-5 border-b border-gray-100 relative group">
        {partyDetails?.logo_url && (
          <img
            src={partyDetails.logo_url}
            alt="Party Logo"
            className="absolute top-5 right-5 h-8 w-8 object-contain opacity-40 filter drop-shadow hover:opacity-100 transition-opacity"
            title={`${user?.party} Logo`}
          />
        )}
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-saffron/20 to-india-green/20 flex items-center justify-center text-lg font-black text-saffron shadow-sm border border-gray-100 shrink-0 overflow-hidden transform group-hover:scale-105 transition-transform">
            {partyDetails?.logo_url ? (
              <img
                src={partyDetails.logo_url}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              user?.name?.charAt(0) || "?"
            )}
          </div>
          <div className="min-w-0 pr-6">
            <p className="text-sm font-bold text-neutral-dark truncate">
              {user?.name}
            </p>
            <p className="text-[10px] text-saffron font-semibold uppercase">
              Member of Parliament
            </p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 flex flex-col gap-1">
        {TABS.map(({ id, icon, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all hover:bg-gray-50
                            ${
                              tab === id
                                ? "bg-saffron/10 text-saffron shadow-sm"
                                : "text-gray-500 hover:text-neutral-dark"
                            }`}
          >
            <span
              className={`material-symbols-outlined text-xl transition-transform ${tab === id ? "fill-[1] scale-110" : ""}`}
            >
              {icon}
            </span>
            {label}
          </button>
        ))}
      </nav>

      {/* Quick stats in sidebar */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 shadow-inner">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Speeches Left
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-neutral-dark">
                {speechesLeft}
              </span>
              <span className="text-sm font-bold text-gray-400">/ 2</span>
            </div>
            <div className="h-1.5 w-full bg-gray-200 rounded-full mt-2 overflow-hidden shadow-inner">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${(speechesLeft / 2) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Party
            </p>
            <p className="text-lg font-black text-india-green mt-1 tracking-tight">
              {user?.party || "—"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );

  const stage = session?.stage;

  // If stage is WAITING, take over the entire screen for the user
  if (stage === "WAITING") {
    return <WaitingRoom />;
  }

  return (
    <div className="bg-background-light font-display antialiased text-neutral-dark min-h-screen">
      {/* Global overlays */}
      <StageOverlay />
      <PowerCardAnimation />

      {/* Dot pattern bg */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-pattern" />

      <TopBar session={session} liveCount={queue.length} />

      <div className="flex">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 flex flex-col gap-5 p-4 md:p-6 lg:p-8 max-w-md md:max-w-2xl lg:max-w-5xl mx-auto w-full pb-28 lg:pb-8">
          {/* Member card — always visible */}
          <section className="bg-white rounded-xl p-5 shadow-soft border-t-4 border-t-saffron border-x border-b border-gray-100 relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-bl-full -mr-8 -mt-8 transition-transform hover:scale-110" />
            <div className="flex items-start gap-4 relative z-10">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-saffron/20 to-india-green/20 flex items-center justify-center text-2xl font-black text-saffron shadow-sm border border-gray-100 shrink-0 overflow-hidden transition-transform transform hover:scale-105">
                {partyDetails?.logo_url ? (
                  <img
                    src={partyDetails.logo_url}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0) || "?"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-neutral-dark leading-tight truncate">
                  {user?.name}
                </h2>
                <p className="text-saffron text-sm font-semibold mt-1">
                  Member of Parliament
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-india-green/10 text-india-green border border-india-green/20 uppercase shadow-sm">
                    Active
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    · {user?.constituency || user?.party}
                  </span>
                </div>
              </div>
            </div>
            {/* Stats row — visible on mobile/tablet only */}
            <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-gray-100 lg:hidden">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Speeches Left
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-neutral-dark">
                    {speechesLeft}
                  </span>
                  <span className="text-sm font-bold text-gray-400">/ 2</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full mt-2 overflow-hidden shadow-inner">
                  <div
                    className="h-full bg-accent transition-all duration-500"
                    style={{ width: `${(speechesLeft / 2) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Party
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl font-black text-india-green">
                    {user?.party || "—"}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2 font-medium">
                  {user?.member_id}
                </p>
              </div>
            </div>

            {/* Party Members (visible if details exist) */}
            {partyDetails?.members_data?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Party Members
                </p>
                <div className="flex flex-wrap gap-2">
                  {partyDetails.members_data.map((m, i) => (
                    <div
                      key={i}
                      className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5 hover:shadow"
                    >
                      <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-black text-neutral-dark cursor-default">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-dark">
                          {m.name}
                        </p>
                        <p className="text-[9px] text-gray-500 font-medium truncate max-w-[100px]">
                          {m.college}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Stage-driven main content */}
          {(() => {
            const isBill1Stage = stage?.startsWith("BILL1_");
            const isBill2Stage = stage?.startsWith("BILL2_");
            const bill = isBill1Stage
              ? session?.bill_1_data ||
                billData?.bill1 ||
                session?.bill_data?.bill1
              : isBill2Stage
                ? session?.bill_2_data ||
                  billData?.bill2 ||
                  session?.bill_data?.bill2
                : null;

            switch (stage) {
              case "BILL1_SETUP":
              case "BILL2_SETUP_PREP":
                return <BillAnnouncement bill={bill} />;

              case "BILL1_R2":
              case "BILL2_R2": {
                const selection = {
                  teamA: oneVsOneChallenger,
                  teamB: oneVsOneOpponent,
                };
                const hasChallenger = !!oneVsOneChallenger;
                const hasOpponent = !!oneVsOneOpponent;

                // ACTIVE mode — render split layout with real 180s timer
                if (
                  oneVsOneState === "ACTIVE" &&
                  hasChallenger &&
                  hasOpponent
                ) {
                  const total = 180;
                  const elapsed = Math.max(0, total - oneVsOneRemaining);
                  return (
                    <OneVsOneLayout
                      bill={bill}
                      selection={selection}
                      timer={elapsed}
                      timerLimit={total}
                    />
                  );
                }

                // SELECTION mode – no split layout or timer
                return (
                  <section className="bg-white rounded-xl p-6 shadow-soft border border-dashed border-amber-300">
                    <div className="flex flex-col lg:flex-row items-center gap-6">
                      <div className="flex-1 text-center lg:text-left">
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.3em] mb-3">
                          1v1 Debate Round
                        </p>
                        {!hasChallenger && !hasOpponent ? (
                          <p className="text-sm text-gray-600 mb-4">
                            Teams will be chosen after buzzer.
                          </p>
                        ) : (
                          <p className="text-sm text-gray-600 mb-4">
                            Teams below reflect moderator selection.
                          </p>
                        )}

                        <div className="flex items-center justify-center lg:justify-start gap-4">
                          <div className="min-w-[140px] p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase">
                              Challenger
                            </p>
                            <p className="text-sm font-bold text-neutral-dark mt-1">
                              {selection.teamA || "—"}
                            </p>
                          </div>

                          <div className="text-sm font-semibold text-gray-500">
                            vs
                          </div>

                          <div className="min-w-[140px] p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="text-[10px] text-gray-400 uppercase">
                              Opponent
                            </p>
                            <p className="text-sm font-bold text-neutral-dark mt-1">
                              {selection.teamB || "—"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="w-full lg:w-56">
                        <div className="flex justify-center lg:justify-end">
                          <RaiseHandButton
                            queueEntry={myQueueEntry}
                            session={session}
                            onUpdate={fetchActiveSession}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                );
              }

              case "WINNER":
                return (
                  <section className="bg-white rounded-xl p-6 shadow-soft border border-gray-100 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
                      Session Locked
                    </p>
                    <h2 className="text-xl font-black text-neutral-dark mt-2">
                      Winner has been declared.
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                      Interactions are now closed. Please follow the final
                      proceedings on the projection screen.
                    </p>
                  </section>
                );

              case "BILL1_R1":
              case "BILL2_R1":
              default:
                return (
                  <NormalDebateLayout
                    stage={stage}
                    bill={bill}
                    user={user}
                    session={session}
                    queue={queue}
                    myQueueEntry={myQueueEntry}
                    leaderboard={leaderboard}
                    powerCards={powerCards}
                    tab={tab}
                    setTab={setTab}
                    fetchActiveSession={fetchActiveSession}
                  />
                );
            }
          })()}
        </main>
      </div>

      {/* Bottom navigation — mobile/tablet only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pb-6 pt-2 z-50 lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {TABS.map(({ id, icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-1 transition-all ${tab === id ? "text-saffron scale-110" : "text-gray-400 hover:text-neutral-dark"}`}
            >
              <span
                className={`material-symbols-outlined text-[28px] ${tab === id ? "fill-[1]" : ""}`}
              >
                {icon}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-tighter">
                {label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mandatory Party Details Form Popup */}
      {partyDetails === null && (
        <PartyDetailsForm user={user} onComplete={loadParty} />
      )}
    </div>
  );
}
