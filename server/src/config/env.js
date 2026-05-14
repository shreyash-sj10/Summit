import dotenv from "dotenv";

dotenv.config();

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 3001),
  clientOrigins: [
    "http://localhost:5173",
    ...(process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean)
      : []),
  ],
};
