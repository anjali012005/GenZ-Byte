import dotenv from "dotenv";
import { fileURLToPath } from "url";

const envPath = fileURLToPath(new URL("../../.env", import.meta.url));

dotenv.config({ path: envPath, quiet: true });

export const ENV = {
    PORT: process.env.PORT,
    DB_URL: process.env.DB_URL,
    NODE_ENV: process.env.NODE_ENV || "development",
    CLIENT_URL: process.env.CLIENT_URL,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    STREAM_API_KEY: process.env.STREAM_API_KEY,
    STREAM_API_SECRET: process.env.STREAM_API_SECRET,
    PISTON_API_URL: process.env.PISTON_API_URL,
    CODE_RUNNER: process.env.CODE_RUNNER,
    JUDGE0_API_URL: process.env.JUDGE0_API_URL,
    JUDGE0_API_KEY: process.env.JUDGE0_API_KEY,
    JUDGE0_API_HOST: process.env.JUDGE0_API_HOST,
};
