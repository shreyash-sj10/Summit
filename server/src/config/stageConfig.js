/**
 * Centralized Stage Configuration for ABHIMAT '26
 *
 * This module defines the complete stage lifecycle and behavior for all 8 stages:
 * 1. WAITING - Members wait, no interaction
 * 2. BILL1_SETUP - Setup first bill, capture bill name/summary
 * 3. BILL1_R1 - Normal debate on Bill 1
 * 4. BILL1_R2 - 1v1 debate on Bill 1 (requires team selection)
 * 5. BILL2_SETUP_PREP - Setup second bill + preparation timer
 * 6. BILL2_R1 - Normal debate on Bill 2
 * 7. BILL2_R2 - 1v1 debate on Bill 2 (requires team selection)
 * 8. WINNER - Results displayed, system locked
 */

export const STAGE_CONFIG = {
  WAITING: {
    value: "WAITING",
    label: "Stage 0: Waiting",
    description: "Members wait, no interaction",
    icon: "hourglass_empty",

    // Feature flags
    buzzerEnabled: false,
    powercardEnabled: false,
    scoringEnabled: false,
    timerActive: false,
    is1v1Mode: false,

    // Behavior flags
    requiresBillSetup: false,
    requiresTeamSelection: false,
    requiresPreparationTimer: false,
    locksDebateInteraction: false,
    locksWinner: false,

    // Associated bill
    billNumber: null,

    description_: "Participants are waiting. No floor activity.",
  },

  BILL1_SETUP: {
    value: "BILL1_SETUP",
    label: "Stage 1: Bill 1 Setup",
    description: "Setup first bill",
    icon: "edit_document",

    buzzerEnabled: false,
    powercardEnabled: false,
    scoringEnabled: false,
    timerActive: false,
    is1v1Mode: false,

    requiresBillSetup: true,
    requiresTeamSelection: false,
    requiresPreparationTimer: false,
    locksDebateInteraction: false,
    locksWinner: false,

    billNumber: 1,

    description_: "Capture bill name and summary. Do not enable interaction.",
  },

  BILL1_R1: {
    value: "BILL1_R1",
    label: "Stage 2: Bill 1 Round 1",
    description: "Normal debate",
    icon: "mic",

    buzzerEnabled: true,
    powercardEnabled: false,
    scoringEnabled: true,
    timerActive: true,
    is1v1Mode: false,

    requiresBillSetup: false,
    requiresTeamSelection: false,
    requiresPreparationTimer: false,
    locksDebateInteraction: false,
    locksWinner: false,

    billNumber: 1,
    speechDuration: 60, // seconds

    description_:
      "Bill 1 Round 1 - Normal debate. Buzzer enabled.",
  },

  BILL1_R2: {
    value: "BILL1_R2",
    label: "Stage 3: Bill 1 Round 2",
    description: "1v1 debate",
    icon: "people",

    buzzerEnabled: false, // Disabled during 1v1
    powercardEnabled: false,
    scoringEnabled: true,
    timerActive: true,
    is1v1Mode: true,

    requiresBillSetup: false,
    requiresTeamSelection: true, // CRITICAL: Must select teams before debate
    requiresPreparationTimer: false,
    locksDebateInteraction: true,
    locksWinner: false,

    billNumber: 1,
    speechDuration: 90, // 90 seconds per team

    description_:
      "Bill 1 Round 2 - 1v1 format. Requires team selection before starting.",
  },

  BILL2_SETUP_PREP: {
    value: "BILL2_SETUP_PREP",
    label: "Stage 4: Bill 2 Setup & Prep",
    description: "Setup bill 2, start preparation timer",
    icon: "schedule",

    buzzerEnabled: false,
    powercardEnabled: false,
    scoringEnabled: false,
    timerActive: true,
    is1v1Mode: false,

    requiresBillSetup: true,
    requiresTeamSelection: false,
    requiresPreparationTimer: true,
    locksDebateInteraction: true,
    locksWinner: false,

    billNumber: 2,
    preparationDuration: 360, // 6 minutes default (can be 5-7 min)

    description_:
      "Capture bill 2 data. Lock debate. Start preparation countdown.",
  },

  BILL2_R1: {
    value: "BILL2_R1",
    label: "Stage 5: Bill 2 Round 1",
    description: "Normal debate",
    icon: "mic",

    buzzerEnabled: true,
    powercardEnabled: false,
    scoringEnabled: true,
    timerActive: true,
    is1v1Mode: false,

    requiresBillSetup: false,
    requiresTeamSelection: false,
    requiresPreparationTimer: false,
    locksDebateInteraction: false,
    locksWinner: false,

    billNumber: 2,
    speechDuration: 60,

    description_:
      "Bill 2 Round 1 - Normal debate. Buzzer enabled.",
  },

  BILL2_R2: {
    value: "BILL2_R2",
    label: "Stage 6: Bill 2 Round 2",
    description: "1v1 debate",
    icon: "people",

    buzzerEnabled: false,
    powercardEnabled: false,
    scoringEnabled: true,
    timerActive: true,
    is1v1Mode: true,

    requiresBillSetup: false,
    requiresTeamSelection: true,
    requiresPreparationTimer: false,
    locksDebateInteraction: true,
    locksWinner: false,

    billNumber: 2,
    speechDuration: 90,

    description_:
      "Bill 2 Round 2 - 1v1 format. Requires team selection before starting.",
  },

  WINNER: {
    value: "WINNER",
    label: "Stage 7: Winner",
    description: "Results locked, no changes",
    icon: "emoji_events",

    buzzerEnabled: false,
    powercardEnabled: false,
    scoringEnabled: false,
    timerActive: false,
    is1v1Mode: false,

    requiresBillSetup: false,
    requiresTeamSelection: false,
    requiresPreparationTimer: false,
    locksDebateInteraction: true,
    locksWinner: true, // WINNER LOCK

    billNumber: null,

    description_:
      "Winner announced. System locked. Projection handles animation.",
  },
};

/**
 * Get stage config by value
 * @param {string} stageValue - e.g., "WAITING", "BILL1_R1"
 * @returns {object|null} Stage config or null if not found
 */
export function getStageConfig(stageValue) {
  return STAGE_CONFIG[stageValue] || null;
}

/**
 * Get all valid stage values for validation
 * @returns {string[]} Array of stage values
 */
export function getValidStages() {
  return Object.keys(STAGE_CONFIG).map((key) => STAGE_CONFIG[key].value);
}

/**
 * Get stage config by bill number and round
 * Useful for UI generation
 */
export function getStageByBillAndRound(billNumber, roundNumber) {
  if (billNumber === 1) {
    if (roundNumber === "setup") return STAGE_CONFIG.BILL1_SETUP;
    if (roundNumber === 1) return STAGE_CONFIG.BILL1_R1;
    if (roundNumber === 2) return STAGE_CONFIG.BILL1_R2;
  } else if (billNumber === 2) {
    if (roundNumber === "setup") return STAGE_CONFIG.BILL2_SETUP_PREP;
    if (roundNumber === 1) return STAGE_CONFIG.BILL2_R1;
    if (roundNumber === 2) return STAGE_CONFIG.BILL2_R2;
  }
  return null;
}

/**
 * Check if stage requires modal interaction before proceeding
 */
export function requiresModalBeforeStart(stageValue) {
  const config = getStageConfig(stageValue);
  if (!config) return false;

  return config.requiresBillSetup || config.requiresTeamSelection;
}

export default STAGE_CONFIG;
