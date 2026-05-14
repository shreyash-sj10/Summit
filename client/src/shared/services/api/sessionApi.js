import api from "./client";

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

export const saveTeamSelection = (
  session_id,
  bill_number,
  team_a,
  team_b,
  startTime,
) =>
  api.post("/session/team-selection", {
    session_id,
    bill_number,
    team_a,
    team_b,
    ...(startTime != null ? { startTime } : {}),
  });

export const getRaiseHandStatus = () => api.get("/session/raise-hand/status");

export const toggleRaiseHandAccess = (raise_hand_enabled) =>
  api.patch("/session/raise-hand", { raise_hand_enabled });
