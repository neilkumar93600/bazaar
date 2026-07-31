import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home, Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-background text-foreground px-4 py-8 selection:bg-primary/20 selection:text-primary">
      {/* Background ambient lighting effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-b from-primary/15 via-primary/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-accent/30 blur-2xl" />

      {/* Top Header / Branding */}
      <header className="w-full max-w-6xl flex items-center justify-between py-2">
        <Link
          href="/"
          className="font-display text-xl sm:text-2xl tracking-wide text-foreground hover:text-primary transition-colors flex items-center gap-2"
        >
          <ShoppingBag className="size-6 text-primary" />
          <span>SHIRT BAZAAR</span>
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <Home className="size-4" />
            Home
          </Button>
        </Link>
      </header>

      {/* Main 404 Hero Section */}
      <main className="my-auto flex flex-col items-center justify-center text-center max-w-2xl animate-card-rise py-12">
        {/* Massive 3D 404 Display */}
        <div className="relative flex items-center justify-center select-none my-6">
          {/* Background huge '4' left */}
          <span className="font-display text-[150px] sm:text-[210px] md:text-[260px] leading-none font-extrabold tracking-tighter bg-gradient-to-b from-foreground/25 via-foreground/10 to-transparent bg-clip-text text-transparent drop-shadow-sm">
            4
          </span>

          {/* Center Mascot Card Container */}
          <div className="relative -mx-8 sm:-mx-12 md:-mx-16 z-10 w-52 h-52 sm:w-64 sm:h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden border border-border/40 bg-gradient-to-b from-card/80 via-card/50 to-card/90 backdrop-blur-md shadow-2xl shadow-primary/15 transition-all duration-500 hover:scale-105 hover:border-primary/40 group">
            <Image
              src="/mascot-404.png"
              alt="Shirt Bazaar Lost Mascot"
              fill
              sizes="(max-width: 768px) 208px, 320px"
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Vignette glow overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Background huge '4' right */}
          <span className="font-display text-[150px] sm:text-[210px] md:text-[260px] leading-none font-extrabold tracking-tighter bg-gradient-to-b from-foreground/25 via-foreground/10 to-transparent bg-clip-text text-transparent drop-shadow-sm">
            4
          </span>
        </div>

        {/* Copy & Heading */}
        <div className="space-y-3 px-4">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Oops, we couldn&apos;t find that shirt!
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Looks like this page got lost in the laundry or moved to a different rack. Let&apos;s get you back to familiar grounds.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/" />} size="lg" className="gap-2 font-semibold shadow-lg shadow-primary/20">
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
