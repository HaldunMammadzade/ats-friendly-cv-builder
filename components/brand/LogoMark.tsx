"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { FolioLogoDefs, FolioLogoPaths, LOGO_VIEWBOX } from "./FolioLogo";

export default function LogoMark({
  className,
  size = 42,
}: {
  className?: string;
  size?: number;
}) {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      width={size}
      height={size}
      viewBox={LOGO_VIEWBOX}
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <FolioLogoDefs id={id} />
      <FolioLogoPaths id={id} />
    </svg>
  );
}
