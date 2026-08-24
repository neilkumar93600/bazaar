"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Copy, ImagePlus, MessageCircleQuestion, Palette, RotateCcw, Sparkles } from "lucide-react";

import {
  applyStorefrontThemePrompt,
  type ThemePromptState,
} from "@/app/dashboard/settings/actions";
import { MAX_PROMPT_CHARS, themeVars, type StorefrontTheme } from "@/lib/storefront/theme";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const EXAMPLES = [
  "Faded 70s surf shop — sand, rust, sun-bleached",
  "Midnight arcade: near-black page, hot magenta accent, mono type",
  "Botanical letterpress, cream paper, deep green ink, no shadows",
];


/** A prompt for the creator to run in whatever LLM they already use — not one
 *  this app calls itself. This app has no access to a creator's ChatGPT or
 *  Claude history; the point is entirely that THEIRS might, and can turn that
 *  into a starting point for the box above without the creator having to
 *  translate "my taste" into "orange and cream, sharp corners" themselves.
 *
 *  Role-framed as a design consult ("you're a UI/UX expert") rather than a
 *  bare question — asked for a design opinion, not a memory dump, an LLM
 *  reasons about hierarchy and contrast rather than just listing favourite
 *  colours back.
 *
 *  No handle in it on purpose: it names the shop for context, not this
 *  creator's account, and the target LLM has no use for the handle anyway —
 *  it never reads or writes anything here, it only writes the paragraph.
 *
 *  Deliberately not JSON and not keyed to this app's ten theme fields — the
 *  reply lands back in the same free-text box the example chips fill, so it
 *  only has to read the way "Faded 70s surf shop…" does: a mood in a
 *  sentence. Asking for our schema by name would make a fragile, over-specific
 *  ask of a model this app doesn't control the output of.
 *
 *  Explicitly hedges the case where the target LLM has no memory of this
 *  person at all (a fresh chat, a plan without history) — without that line,
 *  the honest answer is "I don't have access to our past conversations,"
 *  which is a dead end instead of a fallback.
 *
 *  Two lines earned their keep against a real model, not a guess — tested by
 *  running this exact text through Kimi (standing in for "any LLM", since
 *  this app has no way to run a creator's actual ChatGPT):
 *  - "About 400 characters" — without a number, a clean, on-brief reply still
 *    ran 513 characters against this box's 500-character cap. "2 to 3
 *    sentences" alone under-constrains length; a rough character count pulls
 *    the average down even though no model hits it exactly. Confirmed: the
 *    same setup came back at 414 with the number added.
 *  - "Don't summarize what you know or ask what I'd like to do" — closes a
 *    failure mode seen when a block of persona context sits directly above
 *    this prompt in the same message (a creator manually pasting their own
 *    chat history, rather than relying on a memory feature): the model
 *    answered "Understood, I have that context in mind" and asked what to
 *    work on next, never writing the paragraph. Genuine memory delivered as
 *    background context (not visible text in the message) never showed
 *    this — but the instruction is one clause, cheap insurance either way. */
const PERSONAL_STYLE_PROMPT = [
  "You're a website design and UI/UX expert. I want you to design the visual theme for my online shop — the page background, card style, edges, shadows and type.",
  "Think about what you know about me from our conversations — my taste, the kind of work I make, things I've mentioned liking — and use that the way a designer would: propose ONE short paragraph, 2 to 3 sentences and about 400 characters, giving a colour palette and visual mood that would suit me. Name real colours, say whether edges should be sharp or rounded, whether shadows should be hard, soft or absent, and what the type should feel like.",
  "If you don't have enough context on me for that, ask me 2 or 3 quick questions first. Otherwise, don't summarize what you know about me or ask what I'd like to do — just write the paragraph, starting with it, and nothing else. I'm going to paste it straight into a design tool.",
].join(" ")

/** Same idea, aimed at the cover banner instead of the theme. Wants a
 *  different KIND of answer, not just a shorter one: banner-prompt.ts draws a
 *  wide scene, not a palette, so this asks for concrete objects and a setting
 *  rather than colours-and-edges — and it carries the same no-text/no-faces
 *  rule that system prompt enforces, so a creator's paste can't ask this LLM
 *  for something that one will just strip back out. Same two empirically-
 *  found guards above apply here too — verified separately against this
 *  prompt's own text, not assumed to carry over. */
const BANNER_SCENE_PROMPT = [
  "You're a website design and UI/UX expert. I want a cover banner image for my online shop — a wide image behind the header, with no readable text, logos or people's faces in it.",
  "Think about what you know about me from our conversations — my taste, the kind of work I make, things I've mentioned liking — and design ONE short scene for it: 2 to 3 sentences and about 350 characters, naming concrete objects, a setting, and a lighting mood that would suit me.",
  "If you don't have enough context on me for that, ask me 2 or 3 quick questions first. Otherwise, don't summarize what you know about me or ask what I'd like to do — just write the description, starting with it, and nothing else. I'm going to paste it straight into an image generator.",
].join(" ")

/** `navigator.clipboard.writeText` fired-and-forgotten was the actual bug: it
 *  returns a promise, the button never awaited or caught it, and
 *  `setCopied(true)` ran regardless — so a write that failed (no secure
 *  context, a permissions policy blocking it, an in-app browser without the
 *  Clipboard API at all) still showed "Copied" while nothing landed. This
 *  awaits it, catches it, and falls back to the old `execCommand("copy")`
 *  path — deprecated, but it still works in places the async API refuses to,
 *  which is exactly the gap that needs covering. Returns whether it actually
 *  worked, so the button can stop lying when it didn't. */
async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy path below.
    }
  }
  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function StorefrontThemePrompt({
  initialTheme,
  handle,
}: {
  initialTheme: StorefrontTheme;
  handle: string;
}) {
  const [state, formAction, isPending] = useActionState<ThemePromptState, FormData>(
    applyStorefrontThemePrompt,
    {},
  );
  const [prompt, setPrompt] = useState("");
  // Which button is in flight. Three submits share one action, and without
  // this the spinner label read "Restyling storefront…" while the banner was
  // drawing — a two-minute wait wearing the wrong caption.
  const [pending, setPending] = useState<"theme" | "banner" | "reset">("theme");
  const [showHelper, setShowHelper] = useState(false);
  // Which of the two copy buttons last ran, and whether it actually worked —
  // tracked per target rather than one shared flag, so copying the banner
  // prompt right after the theme one doesn't relabel a button that was never
  // clicked.
  const [copyState, setCopyState] = useState<{ target: "theme" | "banner"; ok: boolean } | null>(null);
  // Set the one time a paste actually got cut — not on every keystroke, or
  // it would still be showing minutes after the paste that caused it.
  const [trimmed, setTrimmed] = useState(false);

  async function handleCopy(target: "theme" | "banner") {
    const ok = await copyText(target === "theme" ? PERSONAL_STYLE_PROMPT : BANNER_SCENE_PROMPT);
    setCopyState({ target, ok });
    // A real failure needs longer on screen than a checkmark does — it comes
    // with a fallback block to read below it, not just a word to glance at.
    setTimeout(() => setCopyState(null), ok ? 1500 : 6000);
  }

  const theme = state.theme ?? initialTheme;

  return (
    <form
      action={formAction}
      className="rounded-xl border border-[#262626] bg-[#fcfff7] shadow-[2px_2px_0px_0px_#262626] p-6 flex flex-col gap-6"
    >
      <div className="flex items-center gap-2 text-[#262626]">
        <Palette className="size-5" />
        <h3 className="text-body font-semibold text-[#262626]">
          Storefront Look by <span className="font-serif italic font-normal">Prompt</span>
        </h3>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="themePrompt" className="text-body-sm font-semibold text-[#262626]">
          Describe your storefront
        </Label>
        <span className="text-caption text-[#525252]">
          Colours, mood, edges, type. This restyles <code className="text-[#262626] font-mono">/creator/{handle}</code> — page, header and footer — and your designs keep their own look. The same words can draw a cover banner: that one is a paid image generation, roughly $0.09 and about a minute.
        </span>
        <Textarea
          id="themePrompt"
          name="themePrompt"
          rows={4}
          value={prompt}
          onChange={(e) => {
            const value = e.target.value;
            // A hard `maxLength` on the element truncates a paste with zero
            // signal — the tail of whatever a creator pasted back from their
            // own ChatGPT or Claude just silently disappears. Clamping here
            // instead means the same limit, but `trimmed` can say so.
            setTrimmed(value.length > MAX_PROMPT_CHARS);
            setPrompt(value.slice(0, MAX_PROMPT_CHARS));
          }}
          placeholder="Washed-out riso print shop: bone paper, ink blue text, orange accent, sharp corners"
          className="bg-white border-[#262626] rounded-md text-body-sm"
        />
        <div className="flex items-center justify-between text-caption text-[#525252]">
          <span>
            {trimmed
              ? `Trimmed to fit — over the ${MAX_PROMPT_CHARS}-character limit.`
              : " "}
          </span>
          <span className="font-mono font-medium shrink-0">
            {prompt.length}/{MAX_PROMPT_CHARS}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setPrompt(example)}
              className="rounded-full border border-[#262626] bg-white px-3 py-1 text-caption font-mono text-[#262626] hover:bg-[#fcfff7] transition-all cursor-pointer"
            >
              {example}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowHelper((prev) => !prev)}
          className="inline-flex w-fit items-center gap-1.5 text-caption font-semibold text-[#262626] underline underline-offset-2 hover:no-underline cursor-pointer"
        >
          <MessageCircleQuestion className="size-3.5" />
          {showHelper ? "Hide" : "Not sure what to type? Ask your own ChatGPT or Claude"}
        </button>

        {showHelper && (
          <div className="flex flex-col gap-2 rounded-md border border-[#262626] bg-white p-3">
            <p className="text-caption text-[#525252]">
              Click one to copy it, paste it into a{" "}
              <strong className="text-[#262626]">new chat</strong> in ChatGPT, Claude, or
              whatever you already use — one that has your history — then paste what it
              writes back into the box above.
            </p>
            {/* Direct copy, not select-then-copy: each button is its own
                target, no separate step to pick one first. */}
            <div className="flex flex-wrap gap-1.5">
              {(["theme", "banner"] as const).map((target) => {
                const status = copyState?.target === target ? copyState : null;
                return (
                  <button
                    key={target}
                    type="button"
                    onClick={() => handleCopy(target)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-white px-3 py-1 text-caption font-mono font-medium text-[#262626] hover:bg-[#fcfff7] transition-all cursor-pointer"
                  >
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={status ? (status.ok ? "ok" : "fail") : "idle"}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="inline-flex items-center gap-1.5"
                      >
                        {status?.ok ? (
                          <>
                            <Check className="size-3.5" /> Copied
                          </>
                        ) : status && !status.ok ? (
                          <>
                            <AlertCircle className="size-3.5" /> Couldn&apos;t copy
                          </>
                        ) : (
                          <>
                            <Copy className="size-3.5" />
                            {target === "theme" ? "Copy storefront-look prompt" : "Copy cover-banner prompt"}
                          </>
                        )}
                      </motion.span>
                    </AnimatePresence>
                  </button>
                );
              })}
            </div>
            {copyState && !copyState.ok && (
              <div className="flex flex-col gap-1">
                <span className="text-caption font-medium text-red-700">
                  Couldn&apos;t copy that automatically — select this and copy it yourself:
                </span>
                <Textarea
                  readOnly
                  rows={4}
                  autoFocus
                  value={copyState.target === "theme" ? PERSONAL_STYLE_PROMPT : BANNER_SCENE_PROMPT}
                  onFocus={(e) => e.currentTarget.select()}
                  className="bg-[#fcfff7] border-[#262626] rounded-md text-body-sm font-mono"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Live sample of the saved theme, drawn with the same custom properties
          the public storefront uses — not a hand-painted approximation. */}
      <div className="flex flex-col gap-2">
        <span className="text-caption font-mono uppercase tracking-widest text-[#525252]">
          Current look
        </span>
        <div
          style={themeVars(theme)}
          className="rounded-[var(--sf-radius)] border border-[var(--sf-ink)] bg-[var(--sf-bg)] p-4 flex flex-col gap-3"
        >
          <div
            className="h-10 rounded-[var(--sf-radius)] border border-[var(--sf-ink)] bg-[var(--sf-ink)] bg-[image:var(--sf-banner)] [background-size:var(--sf-banner-size)]"
          />
          <div className="rounded-[var(--sf-radius)] border border-[var(--sf-ink)] bg-[var(--sf-surface)] shadow-[var(--sf-shadow)] p-3 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-body-sm font-semibold text-[var(--sf-ink)]">@{handle}</span>
              <span className="text-caption text-[var(--sf-muted)]">1-of-1 storefront</span>
            </div>
            <span className="rounded-full border border-[var(--sf-ink)] bg-[var(--sf-accent)] px-3 py-0.5 text-caption font-mono font-semibold text-[var(--sf-on-accent)]">
              CLAIMED
            </span>
          </div>
        </div>
      </div>

      {state.error && (
        <p className="text-body-sm font-medium text-red-700">{state.error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          onClick={() => setPending("theme")}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#a3e635] px-6 py-2.5 text-body-sm font-semibold text-[#262626] border border-[#262626] shadow-[2px_2px_0px_0px_#262626] hover:bg-[#b2f042] transition-all w-fit cursor-pointer disabled:opacity-50"
        >
          <Sparkles className="size-4" />
          {isPending && pending === "theme" ? "Restyling storefront…" : "Restyle my storefront"}
        </button>
        {/* Paid image generation, so it says so on the button rather than
            surprising a creator who pressed it a dozen times. */}
        <button
          type="submit"
          name="intent"
          value="banner"
          onClick={() => setPending("banner")}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#262626] px-5 py-2.5 text-body-sm font-semibold text-white border border-[#262626] shadow-[2px_2px_0px_0px_#262626] hover:opacity-90 transition-all w-fit cursor-pointer disabled:opacity-50"
        >
          <ImagePlus className="size-4" />
          {isPending && pending === "banner" ? "Drawing banner…" : "Draw a cover banner"}
        </button>
        <button
          type="submit"
          name="intent"
          value="reset"
          onClick={() => setPending("reset")}
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2.5 text-body-sm font-semibold text-[#262626] border border-[#262626] hover:bg-[#fcfff7] transition-all w-fit cursor-pointer disabled:opacity-50"
        >
          <RotateCcw className="size-4" />
          House style
        </button>
        {state.success && !isPending && (
          <span className="text-body-sm font-medium text-emerald-700">
            {state.bannerUrl ? "Cover banner drawn!" : "Storefront updated!"}
          </span>
        )}
      </div>
    </form>
  );
}
