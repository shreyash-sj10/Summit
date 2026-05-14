import { useState, useEffect } from "react";
import useUserStore from "../../store/useUserStore";
import useSessionStore from "../../store/useSessionStore";
import useQueueStore from "../../store/useQueueStore";
import useRaiseHandWindowStore from "../../store/useRaiseHandWindowStore";
import {
  toggleRaiseHandAccess,
  saveBillData,
  saveTeamSelection,
} from "../../shared/services/api";
import { supabase } from "../../shared/services/supabase";
import TopBar from "../../shared/components/TopBar";
import FloorStatus from "../../shared/components/FloorStatus";
import SpeakerQueue from "../components/SpeakerQueue";
import PollCreator from "../components/PollCreator";
import Leaderboard from "../components/Leaderboard";
import SpeakerGrader from "../components/SpeakerGrader";
import StageOverlay from "../../components/floor/StageOverlay";
import CustomSelect from "../../shared/components/CustomSelect";
import BillSetupModal from "../components/BillSetupModal";
import TeamSelectionModal from "../components/TeamSelectionModal";

const PARTIES = ["BJP", "INC", "AAP", "TMC", "SP", "BSP"];

const STAGE_OPTIONS = [
  {
    value: "WAITING",
    label: "Stage 0: Waiting",
    description: "Members wait here",
    icon: "hourglass_empty",
  },
  {
    value: "BILL1_SETUP",
    label: "Stage 1: Bill 1 Setup",
    description: "Setup first bill",
    icon: "edit_document",
  },
  {
    value: "BILL1_R1",
    label: "Stage 2: Bill 1 Round 1",
    description: "Normal debate",
    icon: "mic",
  },
  {
    value: "BILL1_R2",
    label: "Stage 3: Bill 1 Round 2",
    description: "1v1 debate",
    icon: "people",
  },
  {
    value: "BILL2_SETUP_PREP",
    label: "Stage 4: Bill 2 Setup & Prep",
    description: "Setup & preparation timer",
    icon: "schedule",
  },
  {
    value: "BILL2_R1",
    label: "Stage 5: Bill 2 Round 1",
    description: "Normal debate",
    icon: "mic",
  },
  {
    value: "BILL2_R2",
    label: "Stage 6: Bill 2 Round 2",
    description: "1v1 debate",
    icon: "people",
  },
  {
    value: "WINNER",
    label: "Stage 7: Winner",
    description: "Results locked",
    icon: "emoji_events",
  },
];

const TABS = [
  { id: "session", icon: "dashboard", label: "Session" },
  { id: "polls", icon: "bar_chart", label: "Polls" },
  { id: "stats", icon: "leaderboard", label: "Stats" },
];

export default function ModeratorDashboard() {
  const { user, role } = useUserStore();
  const {
    session,
    poll,
    leaderboard,
    updateStage,
    initRealtimeSession,
    fetchActiveSession,
    setBillData,
    setTeamSelection,
    teamSelections,
    billData,
    stage,
  } = useSessionStore();
  const { queue, initQueueRealtime } = useQueueStore();
  const { isEnabled: raiseHandEnabled, setWindowState } = useRaiseHandWindowStore();

  const [tab, setTab] = useState("session");
  const [togglingRaiseHand, setTogglingRaiseHand] = useState(false);
  const [isStartingOneVsOne, setIsStartingOneVsOne] = useState(false);

  // Modal states
  const [showBillSetupModal, setShowBillSetupModal] = useState(false);
  const [billSetupInProgress, setBillSetupInProgress] = useState(null); // { billNumber, stage }
  const [showTeamSelectionModal, setShowTeamSelectionModal] = useState(false);
  const [teamSelectionInProgress, setTeamSelectionInProgress] = useState(null); // { billNumber, stage }
  const [isModalLoading, setIsModalLoading] = useState(false);

  // Initialize Realtime Stores on Mount
  useEffect(() => {
    initRealtimeSession();
    initQueueRealtime();

    const channel = supabase
      .channel("raise-hand-updates")
      .on("broadcast", { event: "raiseHand:enabled" }, (payload) => {
        const { timeRemaining } = payload.payload;
        setWindowState(true, true, timeRemaining);
      })
      .on("broadcast", { event: "raiseHand:disabled" }, () => {
        setWindowState(false, false, 0);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initRealtimeSession, initQueueRealtime, setWindowState]);

  // Handle stage changes with modal logic
  const handleStageChange = async (newStage) => {
    try {
      // Determine if this stage requires bill setup or team selection
      const requiresBillSetup = ["BILL1_SETUP", "BILL2_SETUP_PREP"].includes(
        newStage,
      );
      const requiresTeamSelection = ["BILL1_R2", "BILL2_R2"].includes(newStage);

      if (requiresBillSetup) {
        // Check if bill data already exists
        const billNumber = newStage === "BILL1_SETUP" ? 1 : 2;
        const billDataExists =
          billNumber === 1
            ? billData.bill1.name && billData.bill1.summary
            : billData.bill2.name && billData.bill2.summary;

        if (!billDataExists) {
          // Show bill setup modal
          setBillSetupInProgress({ billNumber, stage: newStage });
          setShowBillSetupModal(true);
          return; // Don't change stage yet
        }
      }

      if (requiresTeamSelection) {
        // Show team selection modal
        const billNumber = newStage === "BILL1_R2" ? 1 : 2;
        setTeamSelectionInProgress({ billNumber, stage: newStage });
        setShowTeamSelectionModal(true);
        return; // Don't change stage yet
      }

      // Otherwise, proceed normally
      await updateStage(newStage);
    } catch (err) {
      console.error("Stage change failed:", err);
      alert(
        err?.response?.data?.error ||
          err?.message ||
          "Could not update stage. Check network and moderator permissions.",
      );
    }
  };

  // Handle bill setup modal submit
  const handleBillSetupSubmit = async (data) => {
    setIsModalLoading(true);
    try {
      // Save bill data to store
      setBillData(data.billNumber, data.billName, data.billSummary);

      // Persist to database
      if (session?.id) {
        await saveBillData(
          session.id,
          data.billNumber,
          data.billName,
          data.billSummary,
        );
      }

      // Close modal
      setShowBillSetupModal(false);

      // Now actually change stage
      const stage = billSetupInProgress?.stage;
      if (stage) {
        await updateStage(stage);
      }

      // Reset
      setBillSetupInProgress(null);
    } catch (error) {
      console.error("Failed to setup bill:", error);
      alert(
        error?.response?.data?.error ||
          error?.message ||
          "Failed to save bill or advance stage. Try again.",
      );
    } finally {
      setIsModalLoading(false);
    }
  };

  // Handle team selection modal submit
  const handleTeamSelectionSubmit = async (data) => {
    setIsModalLoading(true);
    try {
      // Save team selection to store
      setTeamSelection(data.billNumber, data.teamA, data.teamB);

      // Persist to database
      if (session?.id) {
        await saveTeamSelection(
          session.id,
          data.billNumber,
          data.teamA,
          data.teamB,
        );
      }

      // Close modal
      setShowTeamSelectionModal(false);

      // Now actually change stage
      const stage = teamSelectionInProgress?.stage;
      if (stage) {
        await updateStage(stage);
      }

      // Reset
      setTeamSelectionInProgress(null);
    } catch (error) {
      console.error("Failed to select teams:", error);
      alert("Failed to select teams. Please try again.");
    } finally {
      setIsModalLoading(false);
    }
  };

  // Toggle raise hand access (frontend state + backend enforcement)
  const handleToggleRaiseHandAccess = async () => {
    setTogglingRaiseHand(true);
    try {
      const newValue = !raiseHandEnabled;
      // Call backend to update in-memory store
      await toggleRaiseHandAccess(newValue);
    } catch (err) {
      console.error("Failed to toggle raise hand access:", err);
      alert("Failed to toggle raise hand access");
    } finally {
      setTogglingRaiseHand(false);
    }
  };

  const partyBreakdown = PARTIES.map((p) => ({
    party: p,
    count: queue.filter((q) => q.member?.party === p).length,
  })).filter((p) => p.count > 0);

  const totalInQueue = queue.filter((q) => q.status === "waiting").length;

  /* ── Desktop sidebar nav ─────────────────────────────────────────── */
  const Sidebar = () => (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-gray-100 min-h-[calc(100vh-64px)] sticky top-[64px] overflow-y-auto z-10 transition-transform">
      {/* Role badge */}
      <div className="p-5 border-b border-gray-100 group relative">
        <div className="absolute right-0 top-0 w-16 h-16 bg-saffron/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
        <div className="flex items-center gap-3">
          <div
            className={`h-11 w-11 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-md transition-transform group-hover:scale-105 ${role === "judge" ? "bg-gradient-to-br from-ashoka-blue to-purple-600" : "bg-gradient-to-br from-saffron via-accent to-india-green"}`}
          >
            <span className="material-symbols-outlined text-xl">
              {role === "judge" ? "gavel" : "shield_person"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-neutral-dark truncate">
              {user?.name}
            </p>
            <p
              className={`text-[10px] font-semibold uppercase ${role === "judge" ? "text-ashoka-blue" : "text-saffron"}`}
            >
              {role === "judge" ? "Judge" : "Moderator"}
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
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all group
                            ${tab === id
                ? "bg-saffron/10 text-saffron shadow-sm"
                : "text-gray-500 hover:bg-gray-50 hover:text-neutral-dark hover:translate-x-1"
              }`}
          >
            <span
              className={`material-symbols-outlined text-xl transition-transform ${tab === id ? "fill-[1] scale-110" : "group-hover:scale-110"}`}
            >
              {icon}
            </span>
            {label}
          </button>
        ))}
      </nav>

      {/* Quick queue summary in sidebar */}
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4 space-y-3 hover:bg-gray-100 transition-colors shadow-inner">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">
                group
              </span>
              Queue Load
            </p>
            <p className="text-xl font-black text-neutral-dark mt-1 flex items-baseline gap-1">
              {totalInQueue}{" "}
              <span className="text-sm font-bold text-gray-400">waiting</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">
                record_voice_over
              </span>
              Active Stage
            </p>
            <p className="text-sm font-bold text-india-green mt-1 truncate capitalize">
              {session?.stage.replace("_", " ") || "No session"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="bg-background-light font-display antialiased text-neutral-dark min-h-screen relative">
      <StageOverlay />
      <TopBar session={session} liveCount={queue.length} />

      <div className="flex">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 flex flex-col gap-5 p-4 md:p-6 lg:p-8 max-w-md md:max-w-2xl lg:max-w-6xl mx-auto w-full pb-28 lg:pb-8">
          {/* Party representation bar — always visible */}
          {partyBreakdown.length > 0 && (
            <section className="bg-white rounded-xl p-4 shadow-soft hover:shadow-md transition-shadow border border-gray-100 space-y-2 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-end">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">
                    pie_chart
                  </span>
                  House Representation
                </h2>
                <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                  {totalInQueue} queued
                </span>
              </div>
              <div className="flex h-3 w-full rounded-full overflow-hidden bg-gray-100 shadow-inner">
                {partyBreakdown.map((p, i) => {
                  const pct = Math.round((p.count / totalInQueue) * 100);
                  const colors = [
                    "bg-saffron",
                    "bg-india-green",
                    "bg-ashoka-blue",
                    "bg-amber-400",
                    "bg-purple-500",
                    "bg-pink-400",
                  ];
                  return (
                    <div
                      key={p.party}
                      className={`h-full ${colors[i % colors.length]} transition-all duration-1000 ease-out`}
                      style={{ width: `${pct}%` }}
                      title={p.party}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {partyBreakdown.map((p, i) => {
                  const colors = [
                    "bg-saffron",
                    "bg-india-green",
                    "bg-ashoka-blue",
                    "bg-amber-400",
                    "bg-purple-500",
                    "bg-pink-400",
                  ];
                  return (
                    <div
                      key={p.party}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-neutral-dark transition-colors cursor-default"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-sm shadow-sm ${colors[i % colors.length]}`}
                      />
                      {p.party} <span className="opacity-60">({p.count})</span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Tab content */}
          {tab === "session" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Stage Controls: Only Moderators can change the stage */}
              {role === "moderator" && (
                <section className="bg-white rounded-xl p-4 shadow-soft border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:shadow-md relative group">
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-saffron/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded-r-xl"></div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-dark flex items-center gap-2">
                      <span className="material-symbols-outlined text-saffron bg-saffron/10 p-1.5 rounded-lg">
                        auto_awesome_motion
                      </span>
                      Event Stage Governance
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      Controls global speaking flow and stage-based rules.
                    </p>
                  </div>
                  <div className="z-50 relative">
                    <CustomSelect
                      value={stage || session?.stage || "WAITING"}
                      onChange={handleStageChange}
                      options={STAGE_OPTIONS}
                    />
                  </div>
                </section>
              )}

              {/* Raise Hand Access Control — Only for Moderators */}
              {role === "moderator" && (
                <section className="bg-white rounded-xl p-4 shadow-soft border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all hover:shadow-md relative group">
                  <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-india-green/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded-r-xl"></div>
                  <div>
                    <h2 className="text-sm font-bold text-neutral-dark flex items-center gap-2">
                      <span className="material-symbols-outlined text-india-green bg-india-green/10 p-1.5 rounded-lg">
                        front_hand
                      </span>
                      Raise Hand Access
                    </h2>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      Allow or block participants from raising their hands.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleRaiseHandAccess}
                    disabled={togglingRaiseHand}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all active:scale-95 whitespace-nowrap ${raiseHandEnabled
                      ? "bg-india-green text-white hover:bg-opacity-90"
                      : "bg-gray-300 text-gray-600"
                      } ${togglingRaiseHand ? "opacity-75 cursor-not-allowed" : ""}`}
                  >
                    {raiseHandEnabled ? "ENABLED" : "DISABLED"}
                  </button>
                </section>
              )}

              {/* 1v1 Debate Control — only for Stage 3 & 6 */}
              {role === "moderator" &&
                (stage === "BILL1_R2" || stage === "BILL2_R2") && (
                  <section className="bg-white rounded-xl p-4 shadow-soft border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md relative">
                    <div>
                      <h2 className="text-sm font-bold text-neutral-dark flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-500 bg-purple-50 p-1.5 rounded-lg">
                          sports_mma
                        </span>
                        1v1 Debate Round
                      </h2>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                        Select Challenger and Opponent via the 1v1 modal, then start
                        a 3-minute face-off.
                      </p>
                      {(() => {
                        const billNumber = stage === "BILL1_R2" || session?.stage === "BILL1_R2" ? 1 : 2;
                        const key = billNumber === 1 ? "bill1Round2" : "bill2Round2";
                        const selection = teamSelections?.[key] || {};
                        const challenger = selection.teamA || "";
                        const opponent = selection.teamB || "";

                        const handleTeamChange = async (type, val) => {
                          const newChallenger = type === 'A' ? val : challenger;
                          const newOpponent = type === 'B' ? val : opponent;
                          setTeamSelection(billNumber, newChallenger, newOpponent);
                          if (session?.id) {
                            try {
                              await saveTeamSelection(session.id, billNumber, newChallenger, newOpponent);
                            } catch (err) {
                              console.error("Failed to save team selection:", err);
                            }
                          }
                        };

                        return (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Challenger</label>
                              <select
                                value={challenger}
                                onChange={(e) => handleTeamChange('A', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-neutral-dark focus:ring-2 focus:ring-purple-500 outline-none"
                              >
                                <option value="">Select Team</option>
                                {PARTIES.filter(p => p !== opponent).map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Opponent</label>
                              <select
                                value={opponent}
                                onChange={(e) => handleTeamChange('B', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-neutral-dark focus:ring-2 focus:ring-purple-500 outline-none"
                              >
                                <option value="">Select Team</option>
                                {PARTIES.filter(p => p !== challenger).map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {(() => {
                      const billNumber = stage === "BILL1_R2" || session?.stage === "BILL1_R2" ? 1 : 2;
                      const key = billNumber === 1 ? "bill1Round2" : "bill2Round2";
                      const selection = teamSelections?.[key] || {};
                      const challenger = selection.teamA || null;
                      const opponent = selection.teamB || null;
                      const canStart = !!challenger && !!opponent;

                      const handleStartOneVsOne = async () => {
                        if (!session?.id || !canStart) return;
                        setIsStartingOneVsOne(true);
                        try {
                          const startTime = Date.now();

                          // Persist start time to DB via team selection update
                          try {
                            await saveTeamSelection(
                              session.id,
                              billNumber,
                              challenger,
                              opponent,
                              startTime,
                            );
                          } catch (apiErr) {
                            console.error("Failed to save 1v1 start time:", apiErr);
                          }

                          try {
                            await supabase.channel("one-vs-one").send({
                              type: "broadcast",
                              event: "one_vs_one_start",
                              payload: {
                                sessionId: session.id,
                                stage,
                                startTime,
                              },
                            });
                          } catch (broadcastErr) {
                            console.error(
                              "Failed to broadcast 1v1 start event:",
                              broadcastErr,
                            );
                          }
                        } finally {
                          setIsStartingOneVsOne(false);
                        }
                      };

                      return (
                        <button
                          type="button"
                          onClick={handleStartOneVsOne}
                          disabled={!canStart || isStartingOneVsOne}
                          className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 active:scale-[0.97] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap self-end sm:mt-0 mt-2"
                        >
                          {isStartingOneVsOne ? (
                            <>
                              <span className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Starting…
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-sm">
                                start
                              </span>
                              Start 1v1 Debate
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </section>
                )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <SpeakerQueue />
                <FloorStatus queue={queue} />
              </div>
            </div>
          )}

          {tab === "polls" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-4">
                {role === "moderator" ? (
                  <PollCreator
                    activePoll={poll}
                    parties={PARTIES}
                    onUpdate={fetchActiveSession}
                  />
                ) : (
                  <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200 shadow-soft hover:bg-gray-50/50 transition-colors h-full flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-5xl text-gray-200">
                      poll
                    </span>
                    <p className="text-gray-500 font-bold mt-4">
                      Polls are managed by the Moderator.
                    </p>
                    <p className="text-sm text-gray-400 mt-2 max-w-xs text-center">
                      Any active poll points will automatically calculate your
                      bonus grading score constraints.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <Leaderboard leaderboard={leaderboard} />
              </div>
            </div>
          )}

          {tab === "stats" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SpeakerGrader
                session={session}
                activePoll={poll}
                onGradeSubmitted={fetchActiveSession}
              />
              <Leaderboard leaderboard={leaderboard} />
            </div>
          )}
        </main>
      </div>

      {/* Bottom nav — mobile/tablet only */}
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

      {/* Modals */}
      <BillSetupModal
        isOpen={showBillSetupModal}
        onClose={() => setShowBillSetupModal(false)}
        onSubmit={handleBillSetupSubmit}
        billNumber={billSetupInProgress?.billNumber || 1}
        isLoading={isModalLoading}
      />

      <TeamSelectionModal
        key={teamSelectionInProgress?.stage ?? "team-select-closed"}
        isOpen={showTeamSelectionModal}
        onClose={() => setShowTeamSelectionModal(false)}
        onSubmit={handleTeamSelectionSubmit}
        billNumber={teamSelectionInProgress?.billNumber || 1}
        isLoading={isModalLoading}
      />
    </div>
  );
}
