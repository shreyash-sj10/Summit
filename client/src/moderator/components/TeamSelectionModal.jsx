import { useState, useEffect } from "react";

const REGISTERED_TEAMS = ["BJP", "INC", "AAP", "TMC", "SP", "BSP"];

export default function TeamSelectionModal({
  isOpen,
  onClose,
  onSubmit,
  billNumber = 1,
  isLoading = false,
}) {
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTeamA("");
      setTeamB("");
      setErrors({});
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!teamA.trim()) {
      newErrors.teamA = "Select Team A";
    }
    if (!teamB.trim()) {
      newErrors.teamB = "Select Team B";
    }
    if (teamA === teamB && teamA && teamB) {
      newErrors.match = "Teams cannot be the same";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    onSubmit({
      billNumber,
      teamA: teamA.trim(),
      teamB: teamB.trim(),
    });

    // Reset
    setTeamA("");
    setTeamB("");
    setErrors({});
  };

  const handleTeamChange = (setter, field) => {
    return (e) => {
      setter(e.target.value);
      // Clear field-specific error when user makes a selection
      if (errors[field]) {
        setErrors({ ...errors, [field]: "" });
      }
      // Clear match error when either team changes
      if (errors.match) {
        setErrors({ ...errors, match: "" });
      }
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in fade-in scale-95 duration-200">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <span className="material-symbols-outlined text-purple-600 text-lg">
              people
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-neutral-dark">
              Bill {billNumber} Round 2: Select Teams
            </h2>
            <p className="text-sm text-gray-500">
              Choose two teams for 1v1 debate
            </p>
          </div>
        </div>

        {/* General error message */}
        {errors.match && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-red-600 text-lg">
              warning
            </span>
            <p className="text-red-700 text-sm font-semibold">{errors.match}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Team A */}
          <div>
            <label
              htmlFor="team-a"
              className="block text-sm font-semibold text-neutral-dark mb-2"
            >
              Team A <span className="text-red-500">*</span>
            </label>
            <select
              id="team-a"
              value={teamA}
              onChange={handleTeamChange(setTeamA, "teamA")}
              disabled={isLoading}
              className={`w-full px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-colors appearance-none cursor-pointer bg-right bg-no-repeat
                ${
                  errors.teamA
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:outline-none"
                    : "border-gray-200 bg-gray-50 focus:border-purple-500 focus:outline-none"
                } bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22%3e%3cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 14l-7 7m0 0l-7-7m7 7V3%22/%3e%3c/svg%3e')] pr-10`}
            >
              <option value="">Select Team A</option>
              {REGISTERED_TEAMS.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            {errors.teamA && (
              <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                {errors.teamA}
              </p>
            )}
          </div>

          {/* VS Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm font-bold text-gray-400 px-2">VS</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Team B */}
          <div>
            <label
              htmlFor="team-b"
              className="block text-sm font-semibold text-neutral-dark mb-2"
            >
              Team B <span className="text-red-500">*</span>
            </label>
            <select
              id="team-b"
              value={teamB}
              onChange={handleTeamChange(setTeamB, "teamB")}
              disabled={isLoading}
              className={`w-full px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-colors appearance-none cursor-pointer bg-right bg-no-repeat
                ${
                  errors.teamB
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:outline-none"
                    : "border-gray-200 bg-gray-50 focus:border-purple-500 focus:outline-none"
                } bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22%3e%3cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 14l-7 7m0 0l-7-7m7 7V3%22/%3e%3c/svg%3e')] pr-10`}
            >
              <option value="">Select Team B</option>
              {REGISTERED_TEAMS.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>
            {errors.teamB && (
              <p className="text-red-500 text-xs font-semibold mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">error</span>
                {errors.teamB}
              </p>
            )}
          </div>

          {/* Selected teams preview */}
          {teamA && teamB && teamA !== teamB && (
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 mb-2">
                Matchup:
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-purple-900 bg-white px-3 py-1.5 rounded-lg flex-1">
                  {teamA}
                </span>
                <span className="text-xs font-bold text-gray-400 mx-2">vs</span>
                <span className="text-sm font-bold text-purple-900 bg-white px-3 py-1.5 rounded-lg flex-1 text-right">
                  {teamB}
                </span>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !teamA || !teamB}
              className="flex-1 px-4 py-2.5 rounded-lg bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">
                    start
                  </span>
                  <span>Start Debate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
