import api from "./client";

export const login = (member_id, password) =>
  api.post("/auth/login", { member_id, password });

export const getMe = () => api.get("/auth/me");
