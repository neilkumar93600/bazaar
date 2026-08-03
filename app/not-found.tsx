import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-background text-foreground px-4 py-8 selection:bg-primary/20 selection:text-primary">
      {/* Main 404 Hero Section */}
      <main className="my-auto flex flex-col items-center justify-center text-center max-w-2xl animate-card-rise py-12">
        {/* Massive 3D 404 Display */}
        <div className="relative flex items-center justify-center select-none my-6">
          {/* Background huge '4' left */}
          <span className="text-[150px] sm:text-[210px] md:text-[260px] leading-none tracking-tighter bg-gradient-to-b from-foreground/25 via-foreground/10 to-transparent bg-clip-text text-transparent drop-shadow-sm">
            4
          </span>

          {/* Center Mascot Card Container */}
          <div className=" relative -mx-8 sm:-mx-12 md:-mx-16 z-10 w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 transition-all duration-500 group">
            <Image
              src="/mascot-404.png"
              alt="Shirt Bazaar Lost Mascot"
              fill
              sizes="(max-width: 768px) 208px, 320px"
              priority
              className="object-cover transition-transform duration-700"
            />
            {/* Vignette glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Background huge '4' right */}
          <span className="text-[150px] sm:text-[210px] md:text-[260px] leading-none tracking-tighter bg-gradient-to-b from-foreground/25 via-foreground/10 to-transparent bg-clip-text text-transparent drop-shadow-sm">
            4
          </span>
        </div>

        {/* Copy & Heading */}
        <div className="space-y-3 px-4">
          <h1 className="text-heading-lg text-foreground">
            Oops, we couldn&apos;t find that shirt!
          </h1>
          <p className="text-body text-muted-foreground max-w-lg mx-auto">
            Looks like this page got lost in the laundry or moved to a different rack. Let&apos;s get you back to familiar grounds.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/" />} size="lg" className="gap-2 font-medium shadow-lg shadow-primary/20">
            <ArrowLeft className="size-4" />
            Back to Home
          </Button>
          <Button render={<Link href="/search" />} variant="outline" size="lg" className="gap-2">
            <Search className="size-4" />
            Browse Catalog
          </Button>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="w-full max-w-md text-center py-4 text-xs text-muted-foreground border-t border-border/40">
        Need help? Check out our{" "}
        <Link href="/" className="underline underline-offset-4 hover:text-foreground">
          Popular Items
        </Link>{" "}
        or contact support.
      </footer>
    </div>
  );
}
