import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3001",
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("abhimat_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("abhimat_token");
      localStorage.removeItem("abhimat_user");
      window.location.href = "/";
    }
    return Promise.reject(err);
  },
);

// Auth
export const login = (member_id, password) =>
  api.post("/auth/login", { member_id, password });
export const getMe = () => api.get("/auth/me");

// Session
export const getActiveSession = () => api.get("/session/active");
export const updateSessionStage = (session_id, stage) =>
  api.post("/session/stage", { session_id, stage });
export const saveBillData = (
  session_id,
  bill_number,
  bill_name,
  bill_summary,
) =>
  api.post("/session/bill-data", {
    session_id,
    bill_number,
    bill_name,
    bill_summary,
  });
export const saveTeamSelection = (session_id, bill_number, team_a, team_b) =>
  api.post("/session/team-selection", {
    session_id,
    bill_number,
    team_a,
    team_b,
  });
export const getRaiseHandStatus = () => api.get("/session/raise-hand/status");
export const toggleRaiseHandAccess = (raise_hand_enabled) =>
  api.patch("/session/raise-hand", { raise_hand_enabled });

// Hand
export const raiseHand = () => api.post("/hand/raise");
export const lowerHand = () => api.delete("/hand/lower");

// Queue
export const getQueue = () => api.get("/queue");

// Speaker (moderator)
export const approveSpeaker = (queueId) =>
  api.patch(`/speaker/approve/${queueId}`);
export const revokeMic = () => api.patch("/speaker/revoke");
export const markDone = () => api.patch("/speaker/done");

// Chat
export const getChat = (page = 0) => api.get(`/chat?page=${page}`);
export const postMessage = (content) => api.post("/chat", { content });
export const clearChat = () => api.delete("/chat");
export const markMessageGolden = (messageId, isGolden = true) =>
  api.patch(`/chat/${messageId}/golden`, { is_golden: isGolden });

// Polls
export const createPoll = (question, options) =>
  api.post("/polls", { question, options });
export const getActivePoll = () => api.get("/polls/active");
export const castVote = (pollId, option_id) =>
  api.post(`/polls/${pollId}/vote`, { option_id });
export const closePoll = (pollId, party, points) =>
  api.patch(`/polls/${pollId}/close`, { party, points });

// Points
// Dashboard actions
export const getLeaderboard = () => api.get("/points");
export const addPoints = (party, amount) =>
  api.post("/points/add", { party, amount });
export const submitSpeakerGrade = (gradeData) =>
  api.post("/moderator/grade", gradeData);
export const getGradeStatus = () => api.get("/moderator/grade/status");

// Power Cards
export const getPowerCards = () => api.get("/hand/cards");
export const usePowerCard = (card_id, target_member_id) =>
  api.post("/hand/use-power-card", { card_id, target_member_id });

// Party Details
export const getPartyDetails = (party) => api.get(`/party/${party}`);
export const submitPartyDetails = (data) => api.post("/party", data);

export default api;
