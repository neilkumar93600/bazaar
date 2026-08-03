"use client";

import { useActionState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import {
  updateNotificationPreferences,
  type UpdatePreferencesState,
} from "@/app/dashboard/settings/actions";
import type { NotificationPreferences } from "@/lib/data/notifications";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";

const PREFERENCE_FIELDS: {
  name: keyof NotificationPreferences;
  formName: string;
  label: string;
}[] = [
  { name: "notifyClaims", formName: "notifyClaims", label: "Someone claims a design you created" },
  { name: "notifyRoyalties", formName: "notifyRoyalties", label: "A royalty is earned or paid out" },
  { name: "notifyMessages", formName: "notifyMessages", label: "New message from another creator" },
  { name: "notifyOrders", formName: "notifyOrders", label: "Order status updates" },
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
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        {PREFERENCE_FIELDS.map((field) => (
          <Field key={field.formName} orientation="horizontal" className="py-2">
            <FieldContent>
              <FieldLabel htmlFor={field.formName}>{field.label}</FieldLabel>
            </FieldContent>
            <Switch
              id={field.formName}
              name={field.formName}
              defaultChecked={preferences[field.name]}
            />
          </Field>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {state.error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-body-sm text-destructive"
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
            className="text-body-sm text-success"
          >
            Saved.
          </motion.p>
        )}
      </AnimatePresence>

      <Button type="submit" disabled={isPending} className="w-fit">
        {isPending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
