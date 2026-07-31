import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col justify-center gap-8 px-6 py-16 sm:px-12 lg:px-16">
        <Link href="/" className="text-heading text-white">
          SHIRT BAZAAR
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>

      <div className="relative hidden p-4 lg:block">
        <div className="rounded-tl-[2rem] rounded-tr-[6rem] rounded-br-[2rem] rounded-bl-[6rem] relative h-full overflow-hidden">
          <Image
            src="https://picsum.photos/seed/dusk-atelier-3/1200/1500"
            alt=""
            fill
            sizes="50vw"
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

          <div className="absolute right-8 bottom-8 left-8 flex flex-col gap-2">
            <h2 className="text-heading-lg text-white">
              FIND YOUR VIBE.
              <br />
              CLAIM IT. OWN IT.
            </h2>
            <p className="text-body-sm max-w-sm text-white/70">
              Every design is one-of-one. Claim it and it&apos;s exclusively
              yours, with a royalty on every resale.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
