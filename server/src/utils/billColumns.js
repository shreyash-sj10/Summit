import { supabase } from "../supabase.js";

let _mode = null; // 'single' | 'split' | 'none'

async function detectMode() {
  if (_mode) return _mode;

  // Try single column `bill_data`
  try {
    const { error } = await supabase.from("sessions").select("bill_data").limit(1).single();
    if (!error) {
      _mode = "single";
      return _mode;
    }
  } catch (err) {
    // ignore - we'll try other options
  }

  // Try split columns `bill_1_data` / `bill_2_data`
  try {
    const { error } = await supabase.from("sessions").select("bill_1_data,bill_2_data").limit(1).single();
    if (!error) {
      _mode = "split";
      return _mode;
    }
  } catch (err) {
    // ignore
  }

  _mode = "none";
  return _mode;
}

export async function fetchBillDataForSession(sessionId) {
  const mode = await detectMode();
  if (mode === "single") {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("bill_data")
        .eq("id", sessionId)
        .single();
      if (error) return { bill_data: null };
      return { bill_data: data?.bill_data ?? null };
    } catch (err) {
      return { bill_data: null };
    }
  }

  if (mode === "split") {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("bill_1_data,bill_2_data")
        .eq("id", sessionId)
        .single();
      if (error) return { bill_data: null };
      return {
        bill_data: {
          bill1: data?.bill_1_data ?? null,
          bill2: data?.bill_2_data ?? null,
        },
      };
    } catch (err) {
      return { bill_data: null };
    }
  }

  return { bill_data: null };
}

export async function updateBillDataForSession(sessionId, billNumber, billData) {
  const mode = await detectMode();

  if (mode === "single") {
    try {
      const { data: existing } = await supabase
        .from("sessions")
        .select("bill_data")
        .eq("id", sessionId)
        .single();

      const newVal = { ...(existing?.bill_data ?? {}), [`bill${billNumber}`]: billData };
      const { error } = await supabase.from("sessions").update({ bill_data: newVal }).eq("id", sessionId);
      if (error) return { error };
      return { success: true };
    } catch (err) {
      return { error: err };
    }
  }

  if (mode === "split") {
    try {
      const col = billNumber === 1 ? "bill_1_data" : "bill_2_data";
      const updateObj = {};
      updateObj[col] = billData;
      const { error } = await supabase.from("sessions").update(updateObj).eq("id", sessionId);
      if (error) return { error };
      return { success: true };
    } catch (err) {
      return { error: err };
    }
  }

  return { error: { message: "No bill storage available in DB" } };
}

export async function getBillStorageMode() {
  return detectMode();
}
