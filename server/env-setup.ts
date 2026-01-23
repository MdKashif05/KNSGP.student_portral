import dotenv from "dotenv";
import path from "path";

// Explicitly load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
