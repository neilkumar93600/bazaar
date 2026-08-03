"use client";

import { useActionState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { updateProfile, type UpdateProfileState } from "@/app/dashboard/settings/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const initialState: UpdateProfileState = {};

export function AccountForm({
  handle,
  email,
  displayName,
  avatarUrl,
}: {
  handle: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarImage src={avatarUrl ?? undefined} alt="" />
          <AvatarFallback>{handle.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-body font-medium text-foreground">@{handle}</span>
          <span className="text-body-sm text-muted-foreground">{email}</span>
        </div>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="displayName">Display name</FieldLabel>
          <FieldContent>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={displayName ?? ""}
              placeholder="Your name"
              maxLength={80}
            />
            <FieldDescription>
              Shown on your storefront instead of your handle. Your handle
              (@{handle}) is permanent since it&apos;s part of your storefront URL.
            </FieldDescription>
          </FieldContent>
        </Field>
      </FieldGroup>

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
        {isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
