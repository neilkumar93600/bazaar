import type { Metadata } from "next"

import { createClient } from "@/lib/supabase/server"
import { getUserPersonas } from "@/lib/data/personas"
import { PersonaManager } from "@/components/dashboard/PersonaManager"

export const metadata: Metadata = { title: "Personas" }

export default async function PersonasPage() {
  const supabase = await createClient()
  const personas = await getUserPersonas(supabase)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-heading font-semibold text-foreground">Personas</h1>
        <p className="text-body-sm text-muted-ink">
          Show the model designs you already love, and it keeps making more
          like them.
        </p>
      </div>

      <PersonaManager personas={personas} />
    </div>
  )
}
