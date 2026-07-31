import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";

export const metadata: Metadata = { title: "Create" };

export default function CreatePage() {
  return (
    <ComingSoon
      title="Create a design"
      description="Vibe pick, reference upload, and generation are coming soon."
    />
  );
}
