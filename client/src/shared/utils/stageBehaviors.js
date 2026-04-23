/**
 * Client-side stage configuration helper
 * Imported by components to determine stage-based behavior
 */

export const STAGE_BEHAVIORS = {
  WAITING: {
    value: "WAITING",
    label: "Stage 0: Waiting",
    buzzerEnabled: false,
    powercardEnabled: false,
    scoringEnabled: false,
    is1v1Mode: false,
    allowGrading: false,
  },
  BILL1_SETUP: {
    value: "BILL1_SETUP",
    label: "Stage 1: Bill 1 Setup",
    buzzerEnabled: false,
    powercardEnabled: false,
    scoringEnabled: false,
    is1v1Mode: false,
    allowGrading: false,
  },
  BILL1_R1: {
    value: "BILL1_R1",
    label: "Stage 2: Bill 1 Round 1",
    buzzerEnabled: true,
    powercardEnabled: false,
    scoringEnabled: true,
    is1v1Mode: false,
    allowGrading: true,
    speechDuration: 60,
  },
  BILL1_R2: {
    value: "BILL1_R2",
    label: "Stage 3: Bill 1 Round 2",
    buzzerEnabled: false,
    powercardEnabled: false,
    scoringEnabled: true,
    is1v1Mode: true,
    allowGrading: true,
    speechDuration: 90,
  },
  BILL2_SETUP_PREP: {
    value: "BILL2_SETUP_PREP",
    label: "Stage 4: Bill 2 Setup & Prep",
    buzzerEnabled: false,
    powercardEnabled: false,
    scoringEnabled: false,
    is1v1Mode: false,
    allowGrading: false,
    preparationActive: true,
  },
  BILL2_R1: {
    value: "BILL2_R1",
    label: "Stage 5: Bill 2 Round 1",
    buzzerEnabled: true,
    powercardEnabled: false,
    scoringEnabled: true,
    is1v1Mode: false,
    allowGrading: true,
    speechDuration: 60,
  },
  BILL2_R2: {
    value: "BILL2_R2",
    label: "Stage 6: Bill 2 Round 2",
    buzzerEnabled: false,
    powercardEnabled: false,
    scoringEnabled: true,
    is1v1Mode: true,
    allowGrading: true,
    speechDuration: 90,
  },
  WINNER: {
    value: "WINNER",
    label: "Stage 7: Winner",
    buzzerEnabled: false,
    powercardEnabled: false,
    scoringEnabled: false,
    is1v1Mode: false,
    allowGrading: false,
    winnerLocked: true,
  },
};

// Map legacy/simplified DB stage values to internal 8-stage config
const STAGE_ALIASES = {
  // Old lowercase stages
  waiting_room: "WAITING",
  first_bill: "BILL1_R1",
  one_on_one: "BILL1_R2",
  third_round: "BILL2_R1",
  // Simplified 4-stage schema
  BILL1: "BILL1_R1",
  BILL2: "BILL2_R1",
};

export function normalizeStageValue(stageValue) {
  if (!stageValue) return null;
  return STAGE_ALIASES[stageValue] || stageValue;
}

/**
 * Get stage behavior by stage value
 */
export function getStageBehavior(stageValue) {
  const normalized = normalizeStageValue(stageValue);
  return STAGE_BEHAVIORS[normalized] || null;
}

/**
 * Check if judges can grade in current stage
 */
export function isGradingAllowed(stageValue) {
  const behavior = getStageBehavior(stageValue);
  return behavior?.allowGrading === true;
}

/**
 * Check if buzzer is enabled in current stage
 */
export function isBuzzerEnabled(stageValue) {
  const behavior = getStageBehavior(stageValue);
  return behavior?.buzzerEnabled === true;
}

/**
 * Check if this is a 1v1 mode stage
 */
export function is1v1Stage(stageValue) {
  const behavior = getStageBehavior(stageValue);
  return behavior?.is1v1Mode === true;
}

/**
 * Check if winner is locked (no changes allowed)
 */
export function isWinnerLocked(stageValue) {
  const behavior = getStageBehavior(stageValue);
  return behavior?.winnerLocked === true;
}

/**
 * Get speech duration for current stage
 */
export function getSpeechDuration(stageValue) {
  const behavior = getStageBehavior(stageValue);
  return behavior?.speechDuration || 60;
}

export default STAGE_BEHAVIORS;
