import api from "./client";

export const raiseHand = () => api.post("/hand/raise");
export const lowerHand = () => api.delete("/hand/lower");

export const getQueue = () => api.get("/queue");
