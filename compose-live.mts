import { readFileSync } from "node:fs"
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const i = line.indexOf("=")
  if (i > 0 && !line.trim().startsWith("#")) {
    const v = line.slice(i + 1).trim()
    if (v && !v.startsWith("#")) process.env[line.slice(0, i).trim()] = v
  }
}
const { composeListing, composePrompt } = await import("./lib/generation/compose.ts")
const { findStyle } = await import("./lib/generation/styles.ts")
const started = Date.now()
const style = findStyle("woodcut-flash")!
const idea = "a brass diving helmet overgrown with coral"

const [listing, composition] = await Promise.all([
  composeListing({ idea, style }),
  composePrompt({ idea, style, text: null, aspectRatio: "1:1" }),
])

console.log(
  `composed=${listing.composed}/${composition.composed} ${Date.now() - started}ms`
)
console.log("TITLE:", listing.title)
console.log("DESCRIPTION:", listing.description)
console.log("---- PROMPT ----")
console.log(composition.prompt)
