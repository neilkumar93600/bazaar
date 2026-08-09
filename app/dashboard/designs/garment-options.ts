import { garments, coloursFrom, type ColourOption } from "@/lib/printify/garments"
import { catalogVariants } from "@/lib/printify/products"

export type GarmentOption = {
  slug: string
  label: string
  colours: ColourOption[]
}

/** Server-only. Printify's catalogue needs the API token, so it is read here
 *  and handed to the form as plain data — never fetched from the browser.
 *
 *  Enforced structurally rather than with the `server-only` package, which is
 *  not a dependency of this project: the only value import of this module is
 *  from server components, and `CreateForm` takes `GarmentOption` with
 *  `import type`, which is erased at compile time and pulls in no runtime code.
 *
 *  Empty when Printify isn't configured. Every surface already treats that as
 *  "no product", and the form hides its garment section rather than offering
 *  choices that could never be minted. */
export async function getGarmentOptions(): Promise<GarmentOption[]> {
  return Promise.all(
    garments().map(async (garment) => ({
      slug: garment.slug,
      label: garment.label,
      colours: coloursFrom(await catalogVariants(garment)),
    }))
  )
}
