import { FadeIn } from "@/components/ui/motion";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
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
