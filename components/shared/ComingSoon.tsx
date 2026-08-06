import { FadeIn } from "@/components/ui/motion";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex max-w-page flex-col gap-3 px-6 py-16 md:px-16 sm:py-24">
      <FadeIn>
        <h1 className="text-heading-lg text-foreground">{title}</h1>
      </FadeIn>
      {description && (
        <FadeIn delay={0.1}>
          <p className="text-body max-w-xl text-muted-foreground">{description}</p>
        </FadeIn>
      )}
    </div>
  );
}
