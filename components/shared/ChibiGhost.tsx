"use client";

import React, { useState } from "react";
import Image from "next/image";

export type ChibiGhostVariant =
  | "dapper"
  | "headphones"
  | "cozy"
  | "lying"
  | "happy"
  | "analyzing"
  | "generating"
  | "uploading";

export interface ChibiGhostProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: ChibiGhostVariant;
  size?: number | string;
  animate?: boolean;
  interactive?: boolean;
  speed?: "normal" | "slow" | "fast";
  className?: string;
}

const mascotPaths: Record<ChibiGhostVariant, string> = {
  dapper: "/mascots/chibi-ghost-dapper.svg",
  headphones: "/mascots/chibi-ghost-headphones.svg",
  cozy: "/mascots/chibi-ghost-cozy.svg",
  lying: "/mascots/chibi-ghost-lying.svg",
  happy: "/mascots/chibi-ghost-happy.svg",
  analyzing: "/mascots/chibi-ghost-analyzing.svg",
  generating: "/mascots/chibi-ghost-generating.svg",
  uploading: "/mascots/chibi-ghost-uploading.svg",
};

export function ChibiGhost({
  variant = "dapper",
  size = 180,
  animate = true,
  interactive = true,
  speed = "normal",
  className = "",
  style,
  ...props
}: ChibiGhostProps) {
  const [isHovered, setIsHovered] = useState(false);

  const interactiveClass = interactive
    ? "transition-transform duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer"
    : "";

  const dimensionStyle: React.CSSProperties = {
    width: typeof size === "number" ? `${size}px` : size,
    height: typeof size === "number" ? `${size}px` : size,
    ...style,
  };

  const svgSrc = mascotPaths[variant] || mascotPaths.dapper;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${interactiveClass} ${className}`}
      style={dimensionStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <Image
        src={svgSrc}
        alt={`Chibi Ghost mascot - ${variant}`}
        width={typeof size === "number" ? size : 200}
        height={typeof size === "number" ? size : 200}
        unoptimized
        className={`w-full h-full object-contain pointer-events-none transition-all duration-300 ${
          !animate ? "opacity-90 [filter:grayscale(0.1)]" : ""
        }`}
        priority={variant === "dapper" || variant === "headphones"}
      />
    </div>
  );
}
