import fs from "fs";
import path from "path";
import type { Plan27 } from "./plan27";

let cache: Plan27 | null = null;

export function getPlan27(): Plan27 {
  if (cache) return cache;
  const file = path.join(process.cwd(), "data", "plan27.json");
  cache = JSON.parse(fs.readFileSync(file, "utf8")) as Plan27;
  return cache;
}
