/** Puts .env.local into process.env. Import it for the side effect, first:
 *
 *      import "./load-env.ts"
 *      import { siteUrl } from "../lib/site.ts"
 *
 *  Order matters. Next.js loads .env.local itself, but a script run under tsx
 *  gets nothing, and `siteUrl` is a module-level const — read once, when
 *  lib/site.ts is first evaluated. ES modules evaluate in import order, so this
 *  import has to come above anything that reads the environment or the value is
 *  already baked in by the time the loader runs.
 *
 *  Missing file is fine: a script that only needs the origin still works off
 *  the localhost fallback, and one that needs a key will say which one.
 */

import { readFileSync } from "node:fs"

try {
  const file = readFileSync(new URL("../.env.local", import.meta.url), "utf8")

  for (const line of file.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    // `??=` so a real environment variable always beats the file.
    if (eq > 0) {
      process.env[trimmed.slice(0, eq).trim()] ??= trimmed.slice(eq + 1).trim()
    }
  }
} catch {
  console.warn("[env] no .env.local — using defaults")
}
