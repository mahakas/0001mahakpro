/**
 * Playwright global setup.
 *
 * Builds the production web bundle so `vite preview` (a second webServer) can
 * serve the real, single-asset shell. The NFR-002 validation (3G-class mobile
 * load within 5 s) runs against this production bundle, because the Vite dev
 * server serves many unbundled ES modules whose per-request RTT is not a
 * faithful representation of the production network payload.
 */

import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export default function globalSetup(): void {
  execSync(`"${process.execPath}" ./node_modules/vite/bin/vite.js build`, {
    cwd: webRoot,
    stdio: "inherit",
  });
}
