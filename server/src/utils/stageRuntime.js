import { supabase } from "../supabase.js";
import { getValidStages } from "../config/stageConfig.js";

let cachedMeta = null;

/**
 * Inspect the DB's sessions_stage_check constraint (if accessible)
 * to derive the allowed stage values. Falls back to local config.
 */
async function loadStageMeta() {
  if (cachedMeta) return cachedMeta;

  let allowedValues = [];
  let mode = "full"; // 'full' | 'simplified' | 'legacy'

  try {
    // Try to read from information_schema (may not be exposed; best-effort only)
    const { data, error } = await supabase
      .from("information_schema.check_constraints")
      .select("constraint_name, check_clause")
      .eq("constraint_name", "sessions_stage_check")
      .maybeSingle();

    if (!error && data?.check_clause) {
      const matches = [...data.check_clause.matchAll(/'([^']+)'/g)].map(
        (m) => m[1],
      );
      if (matches.length) {
        allowedValues = matches;
      }
    }
  } catch (err) {
    // If this fails (e.g. catalog not exposed), we'll fall back below
    console.warn(
      "Failed to inspect sessions_stage_check from DB; falling back to local config:",
      err.message,
    );
  }

  if (!allowedValues.length) {
    // Fallback to local 8-stage config as a safe default
    allowedValues = getValidStages();
  }

  const hasBill1Split =
    allowedValues.includes("BILL1_SETUP") ||
    allowedValues.includes("BILL1_R1") ||
    allowedValues.includes("BILL1_R2");
  const hasBill2Split =
    allowedValues.includes("BILL2_SETUP_PREP") ||
    allowedValues.includes("BILL2_R1") ||
    allowedValues.includes("BILL2_R2");

  if (!hasBill1Split && !hasBill2Split) {
    // Potential simplified 4-stage schema like: WAITING, BILL1, BILL2, WINNER
    const hasBill1 = allowedValues.includes("BILL1");
    const hasBill2 = allowedValues.includes("BILL2");
    if (hasBill1 && hasBill2) {
      mode = "simplified";
    }
  }

  cachedMeta = { allowedValues, mode };
  return cachedMeta;
}

export async function getStageConstraintMeta() {
  return loadStageMeta();
}

/**
 * Map an "app stage" (8-stage enum) to the actual DB stage value,
 * based on the detected mode.
 */
export async function mapAppStageToDbStage(appStage) {
  const meta = await loadStageMeta();
  const { mode } = meta;

  if (mode === "simplified") {
    if (appStage === "WAITING") return "WAITING";
    if (["BILL1_SETUP", "BILL1_R1", "BILL1_R2"].includes(appStage)) return "BILL1";
    if (
      ["BILL2_SETUP_PREP", "BILL2_R1", "BILL2_R2"].includes(appStage)
    )
      return "BILL2";
    if (appStage === "WINNER") return "WINNER";
  }

  // Default: DB already uses full 8-stage enum or we couldn't detect otherwise
  return appStage;
}

/**
 * Determine whether the current DB stage value is valid
 * for submitting bill data for the given bill_number.
 */
export async function isBillStageValidForSubmission(dbStage, billNumber) {
  const meta = await loadStageMeta();
  const { mode } = meta;

  if (mode === "simplified") {
    // Single stage per bill
    const expected = billNumber === 1 ? "BILL1" : "BILL2";
    return { valid: dbStage === expected, expectedStage: expected };
  }

  // Full 8-stage enum
  const expected =
    billNumber === 1 ? "BILL1_SETUP" : "BILL2_SETUP_PREP";
  return { valid: dbStage === expected, expectedStage: expected };
}

