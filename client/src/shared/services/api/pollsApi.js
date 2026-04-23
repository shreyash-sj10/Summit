import api from "./client";

export const createPoll = (question, options) =>
  api.post("/polls", { question, options });

export const getActivePoll = () => api.get("/polls/active");

export const castVote = (pollId, option_id) =>
  api.post(`/polls/${pollId}/vote`, { option_id });

export const closePoll = (pollId, party, points) =>
  api.patch(`/polls/${pollId}/close`, { party, points });
