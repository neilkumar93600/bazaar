"use client";

import { useActionState, useState } from "react";
import { ImagePlus, Palette, RotateCcw, Sparkles } from "lucide-react";

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
          rows={3}
          maxLength={MAX_PROMPT_CHARS}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Washed-out riso print shop: bone paper, ink blue text, orange accent, sharp corners"
          className="bg-white border-[#262626] rounded-md text-body-sm"
        />
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
