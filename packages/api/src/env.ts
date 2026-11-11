import { config } from "dotenv";

// override: true — the project .env is authoritative. Without it, a stale
// ANTHROPIC_API_KEY exported in the user's shell profile silently wins over
// the key in .env (dotenv never overwrites existing env vars by default).
config({ override: true });
