"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ShareButton({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(
          `${window.location.origin}/creator/${handle}`,
        );
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <>
          <Check /> Copied
        </>
      ) : (
        <>
          <Share2 /> Share
        </>
      )}
    </Button>
  );
}
