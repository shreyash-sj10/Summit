import RaiseHandButton from "./RaiseHandButton";
import PowerCards from "./PowerCards";
import PollCard from "./PollCard";
import Leaderboard from "../../moderator/components/Leaderboard";
import ChatPanel from "./ChatPanel";

export default function NormalDebateLayout({
  stage,
  bill,
  user,
  session,
  queue,
  myQueueEntry,
  leaderboard,
  powerCards,
  tab,
  setTab,
  fetchActiveSession,
}) {
  const showBillHeader =
    stage === "BILL1_R1" ||
    stage === "BILL1_R2" ||
    stage === "BILL2_R1" ||
    stage === "BILL2_R2";

  const currentLeaderboard = leaderboard || [];
  const sortedLeaderboard = [...currentLeaderboard].sort(
    (a, b) => b.points - a.points,
  );
  const myPartyRank =
    sortedLeaderboard.findIndex((p) => p.party === user?.party) + 1;
  const myPartyData = sortedLeaderboard.find(
    (p) => p.party === user?.party,
  );

  return (
    <>
      {showBillHeader && bill && (
        <section className="bg-white rounded-xl p-4 shadow-soft border border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-1">
            Bill in Debate
          </p>
          <h3 className="text-base font-black text-neutral-dark leading-snug">
            {bill.name ?? ""}
          </h3>
          {bill.summary && (
            <p className="text-xs text-gray-600 mt-1">{bill.summary}</p>
          )}
        </section>
      )}

      {tab === "home" && (
        <>
          {/* Action row — 2 column on desktop */}
          <section className="grid grid-cols-12 gap-4">
            <RaiseHandButton
              queueEntry={myQueueEntry}
              session={session}
              onUpdate={fetchActiveSession}
            />
            <button
              onClick={() => setTab("polls")}
              className="col-span-4 group relative overflow-hidden rounded-xl bg-accent text-neutral-dark p-5 flex flex-col justify-between h-32 transition-all shadow-lg shadow-accent/20 hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
            >
              <div className="absolute right-0 bottom-0 opacity-20 translate-x-2 translate-y-2 transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-[100px]">
                  monitoring
                </span>
              </div>
              <span className="material-symbols-outlined text-3xl">
                monitoring
              </span>
              <span className="text-sm font-black tracking-tight text-left leading-tight uppercase relative z-10">
                Polls
              </span>
            </button>
          </section>

          {/* Power Cards display */}
          {powerCards.length > 0 && (
            <PowerCards
              cards={powerCards}
              session={session}
              onUpdate={fetchActiveSession}
            />
          )}

          {/* My queue position banner */}
          {myQueueEntry && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center gap-3 shadow-sm transform transition-all hover:scale-[1.01] hover:shadow-md animate-in fade-in slide-in-from-top-2">
              <div className="h-9 w-9 rounded-full bg-accent text-neutral-dark flex items-center justify-center text-[10px] font-black ring-2 ring-white shadow-sm">
                YOU
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-neutral-dark">
                  You're #
                  {queue
                    .filter((q) => q.status === "waiting")
                    .findIndex((q) => q.member?.id === user?.id) + 1}{" "}
                  in queue
                </p>
                <p className="text-[10px] text-india-green font-black uppercase tracking-wide">
                  Prepare your notes!
                </p>
              </div>
            </div>
          )}

          {/* Party Ranking */}
          <section className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden transition-shadow hover:shadow-md mt-2">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-neutral-dark flex items-center gap-2 text-sm">
                <span className="material-symbols-outlined text-india-green">
                  military_tech
                </span>
                Your Party Ranking
              </h3>
            </div>
            <div className="p-6 flex items-center justify-around text-center">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Current Rank
                </p>
                <p className="text-3xl font-black text-neutral-dark mt-1">
                  {myPartyRank > 0 ? `#${myPartyRank}` : "—"}
                </p>
              </div>
              <div className="h-10 w-px bg-gray-100"></div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Total Points
                </p>
                <p className="text-3xl font-black text-india-green mt-1">
                  {myPartyData ? myPartyData.points : "—"}
                </p>
              </div>
            </div>
          </section>
        </>
      )}

      {tab === "polls" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex flex-col gap-4">
            {session?.poll ? (
              <PollCard poll={session.poll} onVoted={fetchActiveSession} />
            ) : (
              <div className="bg-white rounded-xl p-8 text-center border border-dashed border-gray-200 shadow-soft hover:bg-gray-50/50 transition-colors h-full flex flex-col items-center justify-center min-h-[300px]">
                <span className="material-symbols-outlined text-5xl text-gray-200 block mb-3">
                  bar_chart
                </span>
                <p className="text-gray-400 font-medium">
                  No active poll right now.
                </p>
                <p className="text-[11px] text-gray-300 mt-1">
                  The moderator will create one soon.
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
            <Leaderboard leaderboard={leaderboard || []} />
          </div>
        </div>
      )}

      {tab === "chat" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <ChatPanel sessionId={session?.id} />
        </div>
      )}
    </>
  );
}

