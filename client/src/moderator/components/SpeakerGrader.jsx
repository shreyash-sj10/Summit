import { useState, useEffect } from "react";
import { submitSpeakerGrade, getGradeStatus } from "../../shared/services/api";
import { useAuth } from "../../shared/context/AuthContext";
import { isGradingAllowed } from "../../shared/utils/stageBehaviors";

export default function SpeakerGrader({
  session,
  activePoll,
  onGradeSubmitted,
}) {
  const { user } = useAuth();
  const speaker = session?.current_speaker;
  const currentStage = session?.stage;
  const isJudge = user?.role === "judge";
  const isMod = user?.role === "moderator";

  // Check if grading is allowed in current stage
  const gradingAllowed = isGradingAllowed(currentStage);

  const [grades, setGrades] = useState({
    speaking: 0,
    relevance: 0,
    preparedness: 0,
    poll_score: 0,
  });

  const [status, setStatus] = useState({
    loading: true,
    canGrade: false,
    reason: "",
    gradesSoFar: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function fetchStatus() {
      if (!speaker) return;
      try {
        const res = await getGradeStatus();
        setStatus({
          loading: false,
          canGrade: res.data.can_grade,
          reason: res.data.reason,
          gradesSoFar: res.data.grades_so_far,
        });
      } catch (err) {
        setStatus({
          loading: false,
          canGrade: false,
          reason: "Failed to check status",
        });
      }
    }
    fetchStatus();
  }, [speaker?.id]);

  useEffect(() => {
    if (
      isMod &&
      activePoll &&
      activePoll.options &&
      activePoll.options.length > 0
    ) {
      const totalVotes = activePoll.options.reduce(
        (sum, opt) => sum + (opt.votes || 0),
        0,
      );
      if (totalVotes > 0) {
        const favorableVotes = activePoll.options[0].votes || 0;
        const score = (favorableVotes / totalVotes) * 10;
        setGrades((prev) => ({
          ...prev,
          poll_score: Math.round(score * 10) / 10,
        }));
      }
    }
  }, [activePoll, isMod]);

  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    setGrades((prev) => ({ ...prev, [name]: parseFloat(value) }));
  };

  const totalPoints = isJudge
    ? grades.speaking + grades.relevance + grades.preparedness
    : grades.poll_score;

  const maxPoints = isJudge ? 30 : 10;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!speaker) return setError("No active speaker to grade.");

    setSubmitting(true);
    try {
      const res = await submitSpeakerGrade({
        session_id: session.id,
        member_id: speaker.id,
        ...grades,
      });
      if (res.data.is_final) {
        setSuccessMsg(
          `Final Grade! Total points: ${res.data.total_score}. Cards: ${res.data.cards?.join(", ") || "None"}`,
        );
      } else {
        setSuccessMsg(res.data.message);
      }
      setStatus((s) => ({
        ...s,
        canGrade: false,
        reason: "Already graded this turn",
      }));
      if (onGradeSubmitted) onGradeSubmitted();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!speaker) {
    return (
      <div className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-soft">
        <span className="material-symbols-outlined text-4xl text-gray-300">
          person_off
        </span>
        <p className="text-gray-500 mt-2 font-medium">
          No speaker is currently on the floor.
        </p>
      </div>
    );
  }

  // Stage check: Show message if grading is not allowed in current stage
  if (!gradingAllowed) {
    return (
      <div className="bg-white rounded-xl p-6 text-center border border-gray-100 shadow-soft">
        <span className="material-symbols-outlined text-4xl text-gray-300">
          block
        </span>
        <p className="text-gray-500 mt-2 font-medium">
          Grading is not available in the current stage.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Current stage: {currentStage || "Unknown"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-soft overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-500">
            grading
          </span>
          <h3 className="font-bold text-neutral-dark">Grade Speaker</h3>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-purple-600">
            {totalPoints.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500 ml-1">/ {maxPoints}</span>
        </div>
      </div>

      <div className="p-4 border-b border-gray-50 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-lg">
          {speaker.name.charAt(0)}
        </div>
        <div>
          <p className="font-bold text-neutral-dark leading-tight">
            {speaker.name}
          </p>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {speaker.party} {speaker.alignment ? `• ${speaker.alignment}` : ""}
          </p>
        </div>
      </div>

      <div className="p-5">
        {status.loading ? (
          <p className="text-center text-gray-400 font-medium py-4">
            Checking grade status...
          </p>
        ) : !status.canGrade ? (
          <div className="text-center py-6 bg-purple-50 rounded-xl border border-purple-100">
            <span className="material-symbols-outlined text-4xl text-purple-300">
              lock
            </span>
            <p className="text-purple-700 font-bold mt-2">{status.reason}</p>
            {successMsg && (
              <p className="text-green-600 text-sm font-semibold mt-2">
                {successMsg}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-2 mb-2 bg-purple-100 text-purple-800 text-xs font-bold px-3 py-2 rounded-lg inline-flex">
              <span className="material-symbols-outlined text-sm">groups</span>
              Grades so far: {status.gradesSoFar} / 4
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {isJudge &&
                ["speaking", "relevance", "preparedness"].map((param) => (
                  <div key={param}>
                    <div className="flex justify-between items-end mb-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {param}
                      </label>
                      <span className="font-bold text-neutral-dark">
                        {grades[param]}{" "}
                        <span className="text-gray-400 font-normal text-xs">
                          / 10
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      name={param}
                      min="0"
                      max="10"
                      step="1"
                      value={grades[param]}
                      onChange={handleSliderChange}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                ))}

              {isMod && (
                <div className="md:col-span-2 bg-purple-50 rounded-lg p-4 mt-2">
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                      Poll Score (Bonus)
                    </label>
                    <span className="font-bold text-purple-900">
                      {grades.poll_score}{" "}
                      <span className="text-purple-400 font-normal text-xs">
                        / 10
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    name="poll_score"
                    min="0"
                    max="10"
                    step="0.5"
                    value={grades.poll_score}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-700"
                  />
                  <p className="text-[10px] text-purple-600 mt-2 font-medium">
                    Auto-calculated from favorable poll votes, but can be
                    manually adjusted.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-sm font-semibold">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-purple-600 hover:bg-purple-700 active:scale-[0.98] transition-all text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2 disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Submit Grade"}
              {!submitting && (
                <span className="material-symbols-outlined text-sm">send</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
