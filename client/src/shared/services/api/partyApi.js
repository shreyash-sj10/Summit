import api from "./client";

export const getPartyDetails = (party) => api.get(`/party/${party}`);
export const submitPartyDetails = (data) => api.post("/party", data);
