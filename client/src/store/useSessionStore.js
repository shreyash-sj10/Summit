import { create } from "zustand";
import { supabase } from "../shared/services/supabase";
import {
  getActiveSession,
  updateSessionStage,
  saveTeamSelection,
  getActivePoll,
  getLeaderboard,
} from "../shared/services/api";

const useSessionStore = create((set, get) => ({
  session: null,
  stage: null,
  activeSpeaker: null,
  currentSpeakerStartedAt: null,

  // Timer state
  timer: 0,
  timerLimit: 60,
  isTimerRunning: false,
  interruptInfo: null,
  challengeInfo: null,
  intervalId: null,

  // Additional session state
  poll: null,
  leaderboard: [],
  gradingStatus: null,
  isLoading: false,
  error: null,
  channel: null,

  // Bill data (captured during BILL1_SETUP and BILL2_SETUP_PREP stages)
  billData: {
    bill1: {
      name: null,
      summary: null,
    },
    bill2: {
      name: null,
      summary: null,
    },
  },

  // Team selections and 1v1 state
  teamSelections: {
    bill1Round2: {
      teamA: null,
      teamB: null,
    },
    bill2Round2: {
      teamA: null,
      teamB: null,
    },
  },
  oneVsOneState: "SELECTION", // "SELECTION" or "ACTIVE"
  oneVsOneStartTime: null,

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Bill data setters
  setBillData: (billNumber, name, summary) => {
    const key = billNumber === 1 ? "bill1" : "bill2";
    set((state) => ({
      billData: {
        ...state.billData,
        [key]: {
          name,
          summary,
        },
      },
    }));
  },

  // Team selection setters
  setTeamSelection: (billNumber, teamA, teamB) => {
    const key = billNumber === 1 ? "bill1Round2" : "bill2Round2";
    set((state) => ({
      teamSelections: {
        ...state.teamSelections,
        [key]: {
          teamA,
          teamB,
        },
      },
    }));
  },

  resetOneVsOne: async () => {
    const { session, stage } = get();
    set({
      oneVsOneState: "SELECTION",
      oneVsOneStartTime: null,
    });

    if (session?.id && (stage === "BILL1_R2" || stage === "BILL2_R2")) {
      const billNumber = stage === "BILL1_R2" ? 1 : 2;
      try {
        await saveTeamSelection(session.id, billNumber, null, null);
      } catch (err) {
        console.error("Failed to reset teams in DB:", err);
      }
    }
  },

  fetchActiveSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const [sessRes, pollRes, leadRes] = await Promise.all([
        getActiveSession(),
        getActivePoll(),
        getLeaderboard(),
      ]);
      const sess = sessRes.data.session;
      const activeSpk = sess?.current_speaker;
      const stageVal = sess?.stage || "WAITING";
      const teamSelections = sess?.team_selections || {
        bill1Round2: { teamA: null, teamB: null },
        bill2Round2: { teamA: null, teamB: null },
      };

      let oneVsOneState = "SELECTION";
      let oneVsOneStartTime = null;
      if (stageVal === "BILL1_R2" || stageVal === "BILL2_R2") {
        const key = stageVal === "BILL1_R2" ? "bill1Round2" : "bill2Round2";
        const sel = teamSelections[key] || {};
        const st = sel.startTime;
        if (typeof st === "number" && st > 0) {
          const elapsed = Date.now() - st;
          if (elapsed >= 0 && elapsed < 180000) {
            oneVsOneState = "ACTIVE";
            oneVsOneStartTime = st;
          }
        }
      }

      set({
        session: sess,
        stage: stageVal,
        teamSelections,
        oneVsOneState,
        oneVsOneStartTime,
        poll: pollRes.data.poll,
        leaderboard: leadRes.data.leaderboard || [],
      });

      // Reconstruct timer if someone is speaking
      if (!activeSpk) {
        get().resetTimer();
      } else if (!get().isTimerRunning && !get().intervalId) {
        get().startTimer(get().timerLimit || 60, get().timer || 0);
      }
    } catch (err) {
      set({
        error:
          err.response?.data?.error || err.message || "Failed to fetch session",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  syncTimerWithStartedAt: (startedAt) => {
    if (!startedAt) return;
    const state = get();
    if (state.interruptInfo || state.challengeInfo) return;
    const elapsed = Math.floor(
      (Date.now() - new Date(startedAt).getTime()) / 1000,
    );
    set({ timer: Math.max(0, elapsed), currentSpeakerStartedAt: startedAt });

    if (!state.isTimerRunning && !state.intervalId) {
      state.startTimer(state.timerLimit, Math.max(0, elapsed));
    }
  },

  initRealtimeSession: () => {
    const { channel, fetchActiveSession } = get();
    if (channel) return;

    fetchActiveSession();

    const newChannel = supabase
      .channel("global-session-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        () => fetchActiveSession(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "polls" },
        () => fetchActiveSession(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_votes" },
        () => fetchActiveSession(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "team_points" },
        () => fetchActiveSession(),
      )
      .on("broadcast", { event: "stage:update" }, (payload) => {
        // Update local stage when server broadcasts a stage change
        const { stage } = payload.payload;
        set({
          stage,
          oneVsOneState: "SELECTION",
          oneVsOneStartTime: null,
        });
      })
      .subscribe();

    // 1v1 Start listener
    supabase
      .channel("one-vs-one")
      .on("broadcast", { event: "one_vs_one_start" }, (payload) => {
        const { startTime } = payload.payload;
        set({
          oneVsOneState: "ACTIVE",
          oneVsOneStartTime: startTime,
        });
      })
      .subscribe();

    // Team selection listener
    supabase
      .channel("team-selection-updates")
      .on("broadcast", { event: "team-selection:update" }, () => {
        get().fetchActiveSession();
      })
      .subscribe();

    set({ channel: newChannel });
  },

  updateStage: async (newStage) => {
    const { session } = get();
    if (!session) return;
    try {
      // Call the API to update stage on server
      await updateSessionStage(session.id, newStage);
      // DO NOT update local state here - wait for socket 'stage:update' broadcast
      // The server will broadcast the stage change to all clients
    } catch {
      set({ error: "Failed to update stage" });
    }
  },

  startTimer: (duration = 60, startElapsed = null) => {
    const { intervalId, timer, timerLimit } = get();
    if (intervalId) clearInterval(intervalId);

    set({
      timerLimit: duration !== null ? duration : timerLimit,
      timer: startElapsed !== null ? startElapsed : timer,
      isTimerRunning: true,
      interruptInfo: null,
      challengeInfo: null,
    });

    const newIntervalId = setInterval(() => {
      const state = get();

      if (state.interruptInfo) {
        if (state.interruptInfo.time_left <= 1) {
          set({
            isTimerRunning: true,
            timerLimit: state.timerLimit + 30,
            interruptInfo: null,
          });
        } else {
          set({
            interruptInfo: {
              ...state.interruptInfo,
              time_left: state.interruptInfo.time_left - 1,
            },
          });
        }
        return;
      }

      if (state.challengeInfo) {
        if (state.challengeInfo.time_left <= 1) {
          if (state.challengeInfo.phase === 1) {
            set({
              challengeInfo: {
                ...state.challengeInfo,
                phase: 2,
                time_left: 90,
              },
            });
          } else {
            set({
              isTimerRunning: true,
              timerLimit: state.timerLimit + 30,
              challengeInfo: null,
            });
          }
        } else {
          set({
            challengeInfo: {
              ...state.challengeInfo,
              time_left: state.challengeInfo.time_left - 1,
            },
          });
        }
        return;
      }

      if (state.isTimerRunning) {
        set({ timer: state.timer + 1 });
      }
    }, 1000);

    set({ intervalId: newIntervalId });
  },

  pauseTimer: () => set({ isTimerRunning: false }),

  resetTimer: () => {
    const { intervalId } = get();
    if (intervalId) clearInterval(intervalId);
    set({
      timer: 0,
      timerLimit: 60,
      isTimerRunning: false,
      intervalId: null,
      interruptInfo: null,
      challengeInfo: null,
      currentSpeakerStartedAt: null,
    });
  },

  cleanupRealtime: () => {
    const { channel, intervalId } = get();
    if (channel) supabase.removeChannel(channel);
    if (intervalId) clearInterval(intervalId);
    set({ channel: null, intervalId: null });
  },
}));

export default useSessionStore;
