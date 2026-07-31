export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <h1 className="text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
        {title}
      </h1>
      {description && (
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
