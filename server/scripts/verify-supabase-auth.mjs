/**
 * One-shot check: can we reach Supabase, is MOD00001 seeded, does bcrypt match "mod"?
 * Run from server/:  npm run verify:auth
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in server/.env");
    process.exit(1);
}

const supabase = createClient(url, key);
const { data, error } = await supabase
    .from("members")
    .select("member_id,party,password_hash")
    .eq("member_id", "MOD00001")
    .maybeSingle();

if (error) {
    console.error("Supabase query failed:", error.code, error.message);
    if (error.code === "42703" || String(error.message).includes("password_hash")) {
        console.error(
            '\nFix: run server/migration_password_rls.sql (adds password_hash) or full server/supabase_schema.sql in Supabase → SQL Editor.\n',
        );
    }
    process.exit(1);
}
if (!data) {
    console.error('No row with member_id = "MOD00001". Run server/supabase_schema.sql in the SQL Editor.');
    process.exit(1);
}

console.log("Row MOD00001:", {
    party: data.party,
    has_password_hash: Boolean(data.password_hash),
    hash_prefix: data.password_hash ? String(data.password_hash).slice(0, 7) : null,
});

if (!data.password_hash) {
    const legacy = String(data.party || "")
        .trim()
        .toLowerCase();
    console.log("password_hash is null — server would use legacy password (party lowercased):", JSON.stringify(legacy));
    process.exit(0);
}

const ok = await bcrypt.compare("mod", data.password_hash);
console.log('bcrypt.compare("mod", password_hash):', ok);
if (!ok) {
    console.error(
        'Password mismatch. Seeded moderator password is lowercase "mod" (see supabase_schema.sql). Re-seed or update password_hash.',
    );
    process.exit(1);
}
console.log("OK — login with Member ID MOD00001 and password mod should succeed if JWT_SECRET is set.");
process.exit(0);
