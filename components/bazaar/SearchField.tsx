import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MAX_QUERY_LENGTH } from "@/lib/data/bazaar"

/** A native GET form, so this ships no JavaScript and the result URL is
 *  shareable and back-button-correct for free. */
export function SearchField({ defaultValue }: { defaultValue: string }) {
  return (
    <form action="/search" method="get" role="search" className="flex gap-2">
      <label htmlFor="search-q" className="sr-only">
        Search designs and creators
      </label>
      <Input
        id="search-q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        maxLength={MAX_QUERY_LENGTH}
        placeholder="Search designs, creators…"
        className="max-w-md rounded-xl border-border bg-secondary text-foreground placeholder:text-muted-foreground"
      />
      <Button type="submit" variant="outline">
        <SearchIcon className="size-4" />
        Search
      </Button>
    </form>
  )
}
