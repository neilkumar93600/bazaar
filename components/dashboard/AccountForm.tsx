"use client";

import { useActionState, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { User, Link as LinkIcon, Camera, Upload, Trash2, AtSign, Mail, CheckCircle2 } from "lucide-react";

import { updateProfile, type UpdateProfileState } from "@/app/dashboard/settings/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const initialState: UpdateProfileState = {};

const AVATAR_COLOR_CLASSES = [
  "bg-[#262626] text-[#a3e635]",
  "bg-[#303030] text-white",
  "bg-[#047857] text-[#a3e635]",
  "bg-[#4338ca] text-[#e0e7ff]",
  "bg-[#be185d] text-[#fce7f3]",
  "bg-[#b45309] text-[#fef3c7]",
];

function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
  return AVATAR_COLOR_CLASSES[hash % AVATAR_COLOR_CLASSES.length];
}

async function compressImage(file: File, maxDimension = 1024): Promise<File> {
  return new Promise((resolve) => {
    if (file.size < 300 * 1024) {
      resolve(file);
      return;
    }

    const img = new globalThis.Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          "image/jpeg",
          0.85
        );
      } else {
        resolve(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
  });
}

export function AccountForm({
  handle,
  email,
  displayName,
  avatarUrl,
  bannerUrl = null,
  bio = null,
}: {
  handle: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  bio?: string | null;
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl ?? "");
  const [currentBannerUrl, setCurrentBannerUrl] = useState(bannerUrl ?? "");
  const [showUrlInputs, setShowUrlInputs] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file, 512);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressed);
        if (fileInputRef.current) {
          fileInputRef.current.files = dataTransfer.files;
        }
        const previewUrl = URL.createObjectURL(compressed);
        setCurrentAvatarUrl(previewUrl);
      } catch {
        const previewUrl = URL.createObjectURL(file);
        setCurrentAvatarUrl(previewUrl);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file, 1200);
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(compressed);
        if (bannerInputRef.current) {
          bannerInputRef.current.files = dataTransfer.files;
        }
        const previewUrl = URL.createObjectURL(compressed);
        setCurrentBannerUrl(previewUrl);
      } catch {
        const previewUrl = URL.createObjectURL(file);
        setCurrentBannerUrl(previewUrl);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const effectiveDisplayName = displayName || `@${handle}`;
  const initial = (handle || email).slice(0, 1).toUpperCase();
  const avatarColorClass = getAvatarColor(handle || "user");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        name="avatarFile"
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
      />
      <input
        ref={bannerInputRef}
        type="file"
        name="bannerFile"
        accept="image/*"
        onChange={handleBannerChange}
        className="hidden"
      />

      {/* Profile Photo & Storefront Banner Interactive Card */}
      <div className="rounded-2xl border border-[#262626] bg-[#fcfff7] shadow-[2px_2px_0px_0px_#262626] overflow-hidden flex flex-col">
        {/* Live Banner Top Background with Hover Controls */}
        <div className="relative group/banner aspect-[4/1] sm:aspect-[6/1] w-full bg-[#262626] border-b border-[#262626] overflow-hidden">
          {currentBannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentBannerUrl} alt="Storefront banner preview" className="size-full object-cover" />
          ) : (
            <div className="size-full bg-[#262626] bg-[radial-gradient(#a3e635_1.5px,transparent_1.5px)] [background-size:18px_18px] flex items-center justify-center p-4">
              <span className="text-caption font-mono uppercase tracking-widest text-[#a3e635] bg-[#262626]/90 border border-[#a3e635]/40 px-3 py-1 rounded-md">
                LIVE STOREFRONT COVER BANNER PREVIEW
              </span>
            </div>
          )}

          {/* Hover Overlay on Banner */}
          <div className="absolute inset-0 bg-[#262626]/60 backdrop-blur-[2px] opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center gap-3 p-4">
            <button
              type="button"
              disabled={isCompressing}
              onClick={() => bannerInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#fcfff7] px-4 py-2 text-caption font-semibold text-[#262626] border border-[#262626] shadow-[2px_2px_0px_0px_#262626] hover:bg-[#a3e635] transition-colors cursor-pointer"
            >
              <Upload className="size-3.5" />
              {isCompressing ? "Compressing..." : currentBannerUrl ? "Change Banner" : "Upload Banner"}
            </button>
            {currentBannerUrl && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentBannerUrl("");
                  if (bannerInputRef.current) bannerInputRef.current.value = "";
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-caption font-semibold text-destructive border border-[#262626] shadow-[2px_2px_0px_0px_#262626] hover:bg-destructive/10 transition-colors cursor-pointer"
                title="Remove banner"
              >
                <Trash2 className="size-3.5" />
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Profile Info Bar with Interactive Avatar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 p-5 -mt-10 sm:-mt-12">
          <div className="flex items-end gap-4">
            {/* Hover to Upload Avatar */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative group/avatar size-20 sm:size-22 shrink-0 cursor-pointer rounded-full"
              title="Click to change profile photo"
            >
              <Avatar className="size-20 sm:size-22 border-4 border-[#fcfff7] shadow-[2px_2px_0px_0px_#262626]">
                <AvatarImage src={currentAvatarUrl || undefined} alt="" className="object-cover" />
                <AvatarFallback className={`${avatarColorClass} font-mono font-bold text-2xl`}>
                  {initial}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-[#262626]/80 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity border-4 border-[#fcfff7]">
                <Camera className="size-5 mb-0.5 text-[#a3e635]" />
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                  {isCompressing ? "..." : "Change"}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 pb-1">
              <div className="flex items-center gap-2">
                <span className="text-heading-sm font-bold text-[#262626]">
                  {effectiveDisplayName}
                </span>
                <span className="rounded-full border border-[#262626] bg-[#a3e635] px-2.5 py-0.5 text-caption font-mono font-semibold text-[#262626]">
                  Creator Tier
                </span>
              </div>
              <span className="text-caption font-mono text-[#525252]">
                @{handle} · {email}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-end pb-1">
            <button
              type="button"
              onClick={() => setShowUrlInputs(!showUrlInputs)}
              className="text-caption text-[#525252] hover:text-[#262626] underline font-mono cursor-pointer"
            >
              {showUrlInputs ? "Hide image URLs" : "Paste image URLs"}
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7ee2b8] bg-[#dcfff1] px-3 py-1 text-caption font-mono font-medium text-[#262626]">
              <CheckCircle2 className="size-3.5 text-emerald-700" /> Account Active
            </span>
          </div>
        </div>

        {/* Expandable Image URLs */}
        {showUrlInputs && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 p-5 pt-0 border-t border-[#e5e5e5] mt-2">
            <div className="flex flex-col gap-1.5 pt-4">
              <Label htmlFor="avatarUrl" className="text-caption font-mono uppercase tracking-wider text-[#525252]">
                Avatar Image Direct URL
              </Label>
              <Input
                id="avatarUrl"
                name="avatarUrl"
                value={currentAvatarUrl}
                onChange={(e) => setCurrentAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="bg-white border-[#262626] font-mono text-body-sm rounded-md"
              />
            </div>
            <div className="flex flex-col gap-1.5 pt-4">
              <Label htmlFor="bannerUrl" className="text-caption font-mono uppercase tracking-wider text-[#525252]">
                Banner Image Direct URL
              </Label>
              <Input
                id="bannerUrl"
                name="bannerUrl"
                value={currentBannerUrl}
                onChange={(e) => setCurrentBannerUrl(e.target.value)}
                placeholder="https://..."
                className="bg-white border-[#262626] font-mono text-body-sm rounded-md"
              />
            </div>
          </div>
        )}
      </div>

      {/* Identity & Account Details */}
      <div className="rounded-xl border border-[#262626] bg-[#fcfff7] shadow-[2px_2px_0px_0px_#262626] p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2 text-[#262626] border-b border-[#e5e5e5] pb-4">
          <User className="size-5" />
          <h3 className="text-body font-semibold text-[#262626]">
            Identity & Account <span className="font-serif italic font-normal">Information</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="handle" className="text-body-sm font-semibold text-[#262626]">
              Username (@handle)
            </Label>
            <div className="relative flex items-center">
              <AtSign className="absolute left-3 size-4 text-[#737373]" />
              <Input
                id="handle"
                name="handle"
                defaultValue={handle}
                placeholder="username"
                maxLength={30}
                className="pl-9 bg-white border-[#262626] font-mono text-body-sm font-medium rounded-md focus:ring-2 focus:ring-[#a3e635]"
              />
            </div>
            <span className="text-caption text-[#525252]">
              Storefront URL handle (<code className="text-[#262626] font-mono">shirtbazaar.com/creator/{handle}</code>).
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-body-sm font-semibold text-[#262626]">
              Account Email Address
            </Label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 size-4 text-[#737373]" />
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={email}
                placeholder="you@domain.com"
                className="pl-9 bg-white border-[#262626] text-body-sm rounded-md focus:ring-2 focus:ring-[#a3e635]"
              />
            </div>
            <span className="text-caption text-[#525252]">
              Updating email sends a verification link to your new address.
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="displayName" className="text-body-sm font-semibold text-[#262626]">
            Display Name
          </Label>
          <Input
            id="displayName"
            name="displayName"
            defaultValue={displayName ?? ""}
            placeholder="e.g. Alex Rivera"
            maxLength={80}
            className="bg-white border-[#262626] text-body-sm rounded-md"
          />
          <span className="text-caption text-[#525252]">
            Public name shown across 1-of-1 product listings and creator cards.
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio" className="text-body-sm font-semibold text-[#262626]">
            Creator Bio / Editorial Tagline
          </Label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={bio ?? ""}
            rows={3}
            placeholder="Describe your design vibe, aesthetic style, or creative philosophy..."
            className="bg-white border-[#262626] resize-none text-body-sm rounded-md"
          />
        </div>
      </div>

      {/* Card 3: Social & Web Links Card */}
      <div className="rounded-xl border border-[#262626] bg-[#fcfff7] shadow-[2px_2px_0px_0px_#262626] p-6 flex flex-col gap-5">
        <div className="flex items-center gap-2 text-[#262626] border-b border-[#e5e5e5] pb-4">
          <LinkIcon className="size-5" />
          <h3 className="text-body font-semibold text-[#262626]">
            Social Links & <span className="font-serif italic font-normal">Portfolio</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="websiteUrl" className="text-caption font-mono uppercase tracking-wider text-[#525252]">
              Website / Portfolio
            </Label>
            <Input
              id="websiteUrl"
              name="websiteUrl"
              placeholder="https://yourportfolio.com"
              className="bg-white border-[#262626] rounded-md text-body-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="instagram" className="text-caption font-mono uppercase tracking-wider text-[#525252]">
              Instagram Handle
            </Label>
            <Input
              id="instagram"
              name="instagram"
              placeholder="@yourhandle"
              className="bg-white border-[#262626] rounded-md text-body-sm"
            />
          </div>
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
            Profile changes saved!
          </motion.p>
        )}
      </AnimatePresence>

      {/* Brainfish Lime Primary Action Button */}
      <button
        type="submit"
        disabled={isPending || isCompressing}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#a3e635] px-6 py-2.5 text-body-sm font-semibold text-[#262626] border border-[#262626] shadow-[2px_2px_0px_0px_#262626] hover:bg-[#b2f042] transition-all w-fit cursor-pointer disabled:opacity-50"
      >
        {isPending ? "Saving changes…" : "Save profile"}
      </button>
    </form>
  );
}
