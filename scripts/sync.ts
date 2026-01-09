// scripts/sync.ts
import { resolve } from "node:path";
import dotenv from "dotenv";
dotenv.config({ path: resolve(__dirname, "../.env.local") });

import { syncCanvasData } from "../lib/syncCanvas";

syncCanvasData(console).catch((error) => {
  console.error(error);
  process.exit(1);
});
