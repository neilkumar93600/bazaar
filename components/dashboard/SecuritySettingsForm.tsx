"use client"

import { useState } from "react"
import { ShieldCheck, Key, Mail, AlertTriangle } from "lucide-react"

export function SecuritySettingsForm({ userEmail }: { userEmail: string }) {
  const [resetSent, setResetSent] = useState(false)
  const [isPending, setIsPending] = useState(false)

  const handleResetPassword = () => {
    setIsPending(true)
    setTimeout(() => {
      setIsPending(false)
      setResetSent(true)
    }, 800)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Auth Account Details */}
      <div className="rounded-xl border border-[#262626] bg-[#fcfff7] shadow-[2px_2px_0px_0px_#262626] p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2 text-[#262626]">
          <ShieldCheck className="size-5" />
          <h3 className="text-body font-semibold text-[#262626]">
            Authentication & <span className="font-serif italic font-normal">Security</span>
          </h3>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-[#262626] bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#262626] bg-[#a3e635] text-[#262626] shadow-[2px_2px_0px_0px_#262626]">
                <Mail className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-body-sm font-semibold text-[#262626]">
                  Primary Email
                </span>
                <span className="text-caption font-mono text-[#525252]">{userEmail}</span>
              </div>
            </div>
            <span className="rounded-full border border-[#7ee2b8] bg-[#dcfff1] px-2.5 py-0.5 text-caption font-mono font-medium text-[#262626]">
              Verified
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-lg border border-[#262626] bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#262626] bg-white text-[#262626] shadow-[2px_2px_0px_0px_#262626]">
                <Key className="size-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-body-sm font-semibold text-[#262626]">
                  Password Reset
                </span>
                <span className="text-caption text-[#525252]">
                  Send a secure password reset link to your primary email address.
                </span>
              </div>
            </div>
            <button
              type="button"
              disabled={isPending || resetSent}
              onClick={handleResetPassword}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-caption font-semibold text-[#262626] border border-[#262626] shadow-[2px_2px_0px_0px_#262626] hover:bg-[#fcfff7] disabled:opacity-50"
            >
              {resetSent ? "Reset Email Sent!" : "Reset Password"}
            </button>
          </div>
          {resetSent && (
            <p className="text-caption text-emerald-700 font-medium">
              Check your inbox at {userEmail} for password reset instructions.
            </p>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="size-5" />
          <h3 className="text-body font-semibold text-destructive">
            Danger Zone
          </h3>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-0.5">
            <span className="text-body-sm font-semibold text-[#262626]">
              Delete Account & Erase Data
            </span>
            <span className="text-caption text-[#525252]">
              Permanently remove your storefront, private 1-of-1 designs, and account profile.
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-caption font-semibold text-white border border-[#262626] shadow-[2px_2px_0px_0px_#262626] hover:bg-destructive/90 cursor-pointer"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  )
}
