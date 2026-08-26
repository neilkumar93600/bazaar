import { Sparkles } from "lucide-react";

/** Quotes back the prompt a visitor wrote in the home hero before the auth
 *  gate stopped them.
 *
 *  They typed a design, pressed "Generate my design", and landed on a form
 *  instead. Without this the page reads as a generic signup and gives no sign
 *  the work survived — so the most motivated moment in the funnel is spent
 *  wondering whether the prompt is gone. */
export function CarriedPromptNote({ prompt }: { prompt: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[4px] border border-ink bg-mint-wash px-4 py-3 shadow-[2px_2px_0_0_#262626]">
      <span className="flex items-center gap-2 text-caption font-semibold tracking-wide text-ink uppercase">
        <Sparkles className="size-3.5 shrink-0" />
        Your design is saved
      </span>
      <p className="line-clamp-3 font-serif text-body-sm italic text-ink">
        &ldquo;{prompt}&rdquo;
      </p>
      <span className="text-caption text-muted-ink">
        Create an account to generate it.
      </span>
    </div>
  );
}
