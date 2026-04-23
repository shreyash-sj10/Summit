import api from "./client";

export const getLeaderboard = () => api.get("/points");
