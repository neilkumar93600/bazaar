import { readFileSync } from "node:fs"
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const i = line.indexOf("=")
  if (i > 0 && !line.trim().startsWith("#")) {
    const v = line.slice(i + 1).trim()
    if (v && !v.startsWith("#")) process.env[line.slice(0, i).trim()] = v
  }
}
const { composeDesign } = await import("./lib/generation/compose.ts")
const { findStyle } = await import("./lib/generation/styles.ts")
const started = Date.now()
const out = await composeDesign({
  idea: "a brass diving helmet overgrown with coral",
  style: findStyle("woodcut-flash")!,
  text: null,
  aspectRatio: "1:1",
})
console.log(`composed=${out.composed} ${Date.now() - started}ms`)
console.log("TITLE:", out.title)
console.log("---- PROMPT ----")
console.log(out.prompt)
