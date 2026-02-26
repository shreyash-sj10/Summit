import React from "react";
import ProjectionQueue from "./ProjectionQueue";
import ProjectionMainCard from "./ProjectionMainCard";
import ProjectionLeaderboard from "./ProjectionLeaderboard";

export default function ProjectionDashboard({
  stage,
  bill,
  queue,
  leaderboard,
  activeSpeaker,
  timer,
  timerLimit,
}) {
  return (
    <main className="flex-1 flex flex-col px-10 py-6">
      <div className="flex-1 grid grid-cols-12 gap-6 mt-4">
        <div className="col-span-12 lg:col-span-3 lg:row-span-2 flex flex-col">
          <ProjectionQueue queue={queue} activeSpeaker={activeSpeaker} />
        </div>

        <div className="col-span-12 lg:col-span-9 flex flex-col min-h-[320px]">
          <ProjectionMainCard
            stage={stage}
            bill={bill}
            activeSpeaker={activeSpeaker}
            timer={timer}
            timerLimit={timerLimit}
          />
        </div>

        <div className="col-span-12 lg:col-span-9 lg:col-start-4 flex flex-col">
          <ProjectionLeaderboard leaderboard={leaderboard} />
        </div>
      </div>
    </main>
  );
}

