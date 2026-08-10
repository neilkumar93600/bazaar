import type { Metadata } from "next";

import { getMyDesigns } from "@/lib/data/my-designs";
import { getGarmentOptions } from "@/app/dashboard/designs/garment-options";
import { MyDesignsClient } from "@/components/dashboard/MyDesignsClient";

export const metadata: Metadata = { title: "My designs" };

export default async function DesignsPage() {
  const [groups, garmentOptions] = await Promise.all([
    getMyDesigns(),
    getGarmentOptions(),
  ]);

  if (!groups) return null;

  return <MyDesignsClient groups={groups} garmentOptions={garmentOptions} />;
}
