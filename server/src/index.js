import app from "./app.js";
import { env } from "./config/env.js";

app.listen(env.port, () => {
  console.log(`🏛️  Abhimat server running on http://localhost:${env.port}`);
});
