"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import type { TrendingDesign } from "@/lib/data/home"
import { DesignCard } from "@/components/shared/DesignCard"
import { Button } from "@/components/ui/button"

export function TrendingRow({ designs }: { designs: TrendingDesign[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setAtStart(el.scrollLeft <= 0)
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    updateEdges()
  }, [updateEdges, designs])

  if (designs.length === 0) return null

  const scroll = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({
      left: direction * scrollerRef.current.clientWidth * 0.8,
      behavior: "smooth",
    })
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-heading-lg text-foreground">Trending now</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={atStart}
            onClick={() => scroll(-1)}
            aria-label="Scroll trending left"
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={atEnd}
            onClick={() => scroll(1)}
            aria-label="Scroll trending right"
          >
            <ChevronRightIcon />
          </Button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        onScroll={updateEdges}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
      >
        {designs.map((design) => (
          <div key={design.id} className="w-[200px] shrink-0 snap-start sm:w-[240px]">
            <DesignCard design={design} />
          </div>
        ))}
      </div>
    </section>
  )
}
