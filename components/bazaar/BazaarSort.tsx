"use client"

import { useRouter } from "next/navigation"

import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import type { BazaarSort as BazaarSortValue } from "@/lib/data/bazaar"

/** Hrefs are built on the server so this stays a dumb navigator — no
 *  `useSearchParams`, so no Suspense boundary needed around it. */
export function BazaarSort({
  value,
  options,
}: {
  value: BazaarSortValue
  options: { value: BazaarSortValue; label: string; href: string }[]
}) {
  const router = useRouter()

  return (
    <NativeSelect
      aria-label="Sort designs"
      value={value}
      onChange={(event) => {
        const next = options.find((o) => o.value === event.target.value)
        if (next) router.push(next.href, { scroll: false })
      }}
    >
      {options.map((option) => (
        <NativeSelectOption key={option.value} value={option.value}>
          Sort: {option.label}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
