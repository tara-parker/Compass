import fs from "fs";
import path from "path";
import type { Plan } from "./plan";

let cache: Plan | null = null;

export function getPlan(): Plan {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "plan26.json");
  cache = JSON.parse(fs.readFileSync(file, "utf8")) as Plan;
  return cache;
}
