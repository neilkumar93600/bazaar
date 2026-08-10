"use client";

import { useActionState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Sparkles, DollarSign, MessageSquare, ShoppingBag } from "lucide-react";

import {
  updateNotificationPreferences,
  type UpdatePreferencesState,
} from "@/app/dashboard/settings/actions";
import type { NotificationPreferences } from "@/lib/data/notifications";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const PREFERENCE_FIELDS: {
  name: keyof NotificationPreferences;
  formName: string;
  label: string;
  desc: string;
  icon: typeof Bell;
}[] = [
  {
    name: "notifyClaims",
    formName: "notifyClaims",
    label: "Design Claims",
    desc: "Get notified immediately when a buyer claims one of your 1-of-1 designs.",
    icon: Sparkles,
  },
  {
    name: "notifyRoyalties",
    formName: "notifyRoyalties",
    label: "Royalty & Resale Earnings",
    desc: "Receive alerts whenever a resale royalty is earned or disbursed to your payout account.",
    icon: DollarSign,
  },
  {
    name: "notifyMessages",
    formName: "notifyMessages",
    label: "Creator Direct Messages",
    desc: "Notifications for new direct messages and collaboration requests from other creators.",
    icon: MessageSquare,
  },
  {
    name: "notifyOrders",
    formName: "notifyOrders",
    label: "Order & Shipping Updates",
    desc: "Status alerts when garment printing, fulfillment, and shipping progresses.",
    icon: ShoppingBag,
  },
];

const initialState: UpdatePreferencesState = {};

export function NotificationPreferencesForm({
  preferences,
}: {
  preferences: NotificationPreferences;
}) {
  const [state, formAction, isPending] = useActionState(
    updateNotificationPreferences,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="rounded-xl border border-[#262626] bg-[#fcfff7] shadow-[2px_2px_0px_0px_#262626] p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2 text-[#262626]">
          <Bell className="size-5" />
          <h3 className="text-body font-semibold text-[#262626]">
            Notification Channels & <span className="font-serif italic font-normal">Alerts</span>
          </h3>
        </div>

        <div className="flex flex-col gap-4">
          {PREFERENCE_FIELDS.map((field) => {
            const Icon = field.icon;
            return (
              <div
                key={field.formName}
                className="flex items-center justify-between gap-4 rounded-lg border border-[#262626] bg-white p-4 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-[#262626] bg-[#a3e635] text-[#262626] shadow-[2px_2px_0px_0px_#262626]">
                    <Icon className="size-5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <Label htmlFor={field.formName} className="text-body-sm font-semibold text-[#262626] cursor-pointer">
                      {field.label}
                    </Label>
                    <span className="text-caption text-[#525252]">{field.desc}</span>
                  </div>
                </div>
                <Switch
                  id={field.formName}
                  name={field.formName}
                  defaultChecked={preferences[field.name]}
                />
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {state.error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-body-sm font-medium text-destructive"
          >
            {state.error}
          </motion.p>
        )}
        {state.success && (
          <motion.p
            key="success"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-body-sm font-medium text-emerald-700"
          >
            Notification preferences saved!
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#a3e635] px-6 py-2.5 text-body-sm font-semibold text-[#262626] border border-[#262626] shadow-[2px_2px_0px_0px_#262626] hover:bg-[#b2f042] transition-all w-fit cursor-pointer disabled:opacity-50"
      >
        {isPending ? "Saving preferences…" : "Save preferences"}
      </button>
    </form>
  );
}
