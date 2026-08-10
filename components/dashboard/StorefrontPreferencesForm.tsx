"use client"

import { useState } from "react"
import { Shirt, DollarSign, Globe } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function StorefrontPreferencesForm() {
  const [saved, setSaved] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const [defaultGarment, setDefaultGarment] = useState("t-shirt")
  const [defaultPrice, setDefaultPrice] = useState("29.00")
  const [hidePromptsDefault, setHidePromptsDefault] = useState(false)
  const [isPublicStorefront, setIsPublicStorefront] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setTimeout(() => {
      setIsPending(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }, 600)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-xl border border-[#262626] bg-[#fcfff7] shadow-[2px_2px_0px_0px_#262626] p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2 text-[#262626]">
          <Globe className="size-5" />
          <h3 className="text-body font-semibold text-[#262626]">
            Storefront Visibility & <span className="font-serif italic font-normal">Privacy</span>
          </h3>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-[#262626] bg-white p-4">
          <div className="flex flex-col gap-0.5">
            <Label className="text-body-sm font-semibold text-[#262626]">
              Public Storefront Profile
            </Label>
            <span className="text-caption text-[#525252]">
              Allow buyers and creators to discover your storefront at <code className="text-[#262626] font-mono">/creator/...</code>
            </span>
          </div>
          <Switch
            checked={isPublicStorefront}
            onCheckedChange={setIsPublicStorefront}
          />
        </div>

        <div className="flex items-center justify-between gap-4 rounded-lg border border-[#262626] bg-white p-4">
          <div className="flex flex-col gap-0.5">
            <Label className="text-body-sm font-semibold text-[#262626]">
              Hide Prompts by Default
            </Label>
            <span className="text-caption text-[#525252]">
              Keep AI prompts private when publishing new 1-of-1 apparel designs to the Bazaar.
            </span>
          </div>
          <Switch
            checked={hidePromptsDefault}
            onCheckedChange={setHidePromptsDefault}
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#262626] bg-[#fcfff7] shadow-[2px_2px_0px_0px_#262626] p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2 text-[#262626]">
          <Shirt className="size-5" />
          <h3 className="text-body font-semibold text-[#262626]">
            Garment Style & Pricing <span className="font-serif italic font-normal">Defaults</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className="text-body-sm font-semibold text-[#262626]">
              Default Garment Style
            </Label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "t-shirt", label: "T-Shirt" },
                { id: "hoodie", label: "Hoodie" },
                { id: "sweatshirt", label: "Sweatshirt" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDefaultGarment(item.id)}
                  className={`rounded-full border px-4 py-1.5 text-caption font-mono font-medium transition-all ${
                    defaultGarment === item.id
                      ? "border-[#262626] bg-[#a3e635] text-[#262626] shadow-[2px_2px_0px_0px_#262626]"
                      : "border-[#262626] bg-white text-[#262626] hover:bg-[#fcfff7]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="defaultPrice" className="text-body-sm font-semibold text-[#262626]">
              Default Listing Price (USD)
            </Label>
            <div className="relative flex items-center">
              <DollarSign className="absolute left-3 size-4 text-[#737373]" />
              <Input
                id="defaultPrice"
                type="text"
                placeholder="29.00"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value)}
                className="pl-8 font-mono text-body-sm font-semibold bg-white border-[#262626] rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[#a3e635] px-6 py-2.5 text-body-sm font-semibold text-[#262626] border border-[#262626] shadow-[2px_2px_0px_0px_#262626] hover:bg-[#b2f042] transition-all w-fit cursor-pointer disabled:opacity-50"
        >
          {isPending ? "Saving preferences…" : "Save storefront preferences"}
        </button>
        {saved && (
          <span className="text-body-sm font-medium text-emerald-700 animate-in fade-in-0">
            Preferences updated!
          </span>
        )}
      </div>
    </form>
  )
}
