import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/cn";
import LogoMark from "./LogoMark";

export default function BrandLink({
  href = "/",
  showName = true,
  variant = "light",
  prominent = false,
  hideLabelOnMobile = false,
  hideTaglineOnMobile = false,
  className,
  nameClassName,
  size = 42,
}: {
  href?: string;
  showName?: boolean;
  variant?: "light" | "dark";
  prominent?: boolean;
  hideLabelOnMobile?: boolean;
  hideTaglineOnMobile?: boolean;
  className?: string;
  nameClassName?: string;
  size?: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center",
        prominent ? "gap-3.5" : "gap-3",
        className
      )}
    >
      <LogoMark
        size={size}
        className="shrink-0 drop-shadow-md transition-transform duration-200 group-hover:scale-[1.03]"
      />
      {showName && (
        <div
          className={cn(
            "min-w-0 leading-none",
            prominent && "space-y-1",
            hideLabelOnMobile && "hidden sm:block",
            nameClassName
          )}
        >
          <span
            className={cn(
              "block font-bold tracking-tight",
              prominent ? "text-[18px] sm:text-[20px]" : "text-[16px] sm:text-[17px]",
              variant === "dark" ? "text-white" : "text-ink-900"
            )}
          >
            {APP_NAME}
          </span>
          {prominent && (
            <span
              className={cn(
                "block text-[10px] font-semibold uppercase tracking-[0.16em]",
                variant === "dark" ? "text-white/45" : "text-ink-400",
                hideTaglineOnMobile && "hidden sm:block"
              )}
            >
              {APP_TAGLINE}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
