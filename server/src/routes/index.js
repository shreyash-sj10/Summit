import authRouter from "./auth.js";
import sessionRouter from "./session.js";
import handRouter from "./hand.js";
import queueRouter from "./queue.js";
import speakerRouter from "./speaker.js";
import pollsRouter from "./polls.js";
import pointsRouter from "./points.js";
import moderatorRouter from "./moderator.js";
import partyRouter from "./party.js";

export function registerRoutes(app, { handLimiter }) {
  app.use("/auth", authRouter);
  app.use("/session", sessionRouter);
  app.use("/hand", handLimiter, handRouter);
  app.use("/queue", queueRouter);
  app.use("/speaker", speakerRouter);
  app.use("/polls", pollsRouter);
  app.use("/points", pointsRouter);
  app.use("/moderator", moderatorRouter);
  app.use("/party", partyRouter);
}
