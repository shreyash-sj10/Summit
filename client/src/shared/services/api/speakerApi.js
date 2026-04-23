import api from "./client";

export const approveSpeaker = (queueId) => api.patch(`/speaker/approve/${queueId}`);
export const revokeMic = () => api.patch("/speaker/revoke");
export const markDone = () => api.patch("/speaker/done");
