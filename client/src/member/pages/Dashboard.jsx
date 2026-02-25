import { useState, useEffect, useCallback } from "react";
import useUserStore from "../../store/useUserStore";
import useSessionStore from "../../store/useSessionStore";
import useQueueStore from "../../store/useQueueStore";
import useRaiseHandWindowStore from "../../store/useRaiseHandWindowStore";
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
  } = useSessionStore();
  const { queue, initQueueRealtime } = useQueueStore();
  const { isWindowActive, timeRemaining, setWindowState, setTimeRemaining } =
    useRaiseHandWindowStore();

  const [partyDetails, setPartyDetails] = useState(undefined); // undefined = loading, null = not found
  const [tab, setTab] = useState("home");

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

  // If stage is WAITING, take over the entire screen for the user
  if (session?.stage === "WAITING") {
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

          {/* Tab content */}
          {tab === "home" && (
            <>
              {/* Action row — 2 column on desktop */}
              <section className="grid grid-cols-12 gap-4">
                <RaiseHandButton
                  queueEntry={myQueueEntry}
                  session={session}
                  onUpdate={fetchActiveSession}
                />
                <button
                  onClick={() => setTab("polls")}
                  className="col-span-4 group relative overflow-hidden rounded-xl bg-accent text-neutral-dark p-5 flex flex-col justify-between h-32 transition-all shadow-lg shadow-accent/20 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
                >
                  <div className="absolute right-0 bottom-0 opacity-20 translate-x-2 translate-y-2 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-[100px]">
                      monitoring
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-3xl">
                    monitoring
                  </span>
                  <span className="text-sm font-black tracking-tight text-left leading-tight uppercase relative z-10">
                    Polls
                  </span>
                </button>
              </section>

              {/* Power Cards display */}
              {powerCards.length > 0 && (
                <PowerCards
                  cards={powerCards}
                  session={session}
                  onUpdate={fetchActiveSession}
                />
              )}

              {/* My queue position banner */}
              {myQueueEntry && (
                <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center gap-3 shadow-sm transform transition-all hover:scale-[1.01] hover:shadow-md animate-in fade-in slide-in-from-top-2">
                  <div className="h-9 w-9 rounded-full bg-accent text-neutral-dark flex items-center justify-center text-[10px] font-black ring-2 ring-white shadow-sm">
                    YOU
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-neutral-dark">
                      You're #
                      {queue
                        .filter((q) => q.status === "waiting")
                        .findIndex((q) => q.member?.id === user?.id) + 1}{" "}
                      in queue
                    </p>
                    <p className="text-[10px] text-india-green font-black uppercase tracking-wide">
                      Prepare your notes!
                    </p>
                  </div>
                </div>
              )}

              {/* Party Ranking */}
              {(() => {
                const currentLeaderboard = leaderboard || [];
                const sortedLeaderboard = [...currentLeaderboard].sort(
                  (a, b) => b.points - a.points,
                );
                const myPartyRank =
                  sortedLeaderboard.findIndex((p) => p.party === user?.party) +
                  1;
                const myPartyData = sortedLeaderboard.find(
                  (p) => p.party === user?.party,
                );

                return (
                  <section className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden transition-shadow hover:shadow-md mt-2">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                      <h3 className="font-bold text-neutral-dark flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-india-green">
                          military_tech
                        </span>
                        Your Party Ranking
                      </h3>
                    </div>
                    <div className="p-6 flex items-center justify-around text-center">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Current Rank
                        </p>
                        <p className="text-3xl font-black text-neutral-dark mt-1">
                          {myPartyRank > 0 ? `#${myPartyRank}` : "—"}
                        </p>
                      </div>
                      <div className="h-10 w-px bg-gray-100"></div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          Total Points
                        </p>
                        <p className="text-3xl font-black text-india-green mt-1">
                          {myPartyData ? myPartyData.points : "—"}
                        </p>
                      </div>
                    </div>
                  </section>
                );
              })()}
            </>
          )}

          {tab === "polls" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-4">
                {poll ? (
                  <PollCard poll={poll} onVoted={fetchActiveSession} />
                ) : (
                  <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200 shadow-soft hover:bg-gray-50/50 transition-colors h-full flex flex-col items-center justify-center min-h-[300px]">
                    <span className="material-symbols-outlined text-5xl text-gray-200 block mb-3">
                      bar_chart
                    </span>
                    <p className="text-gray-400 font-medium">
                      No active poll right now.
                    </p>
                    <p className="text-[11px] text-gray-300 mt-1">
                      The moderator will create one soon.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <Leaderboard leaderboard={leaderboard || []} />
              </div>
            </div>
          )}

          {tab === "chat" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ChatPanel sessionId={session?.id} />
            </div>
          )}
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
