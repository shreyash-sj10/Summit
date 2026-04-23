import api from "./client";

export const submitSpeakerGrade = (gradeData) =>
  api.post("/moderator/grade", gradeData);

export const getGradeStatus = () => api.get("/moderator/grade/status");
