"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, LogOut, Settings } from "lucide-react";
import BrandLink from "@/components/brand/BrandLink";
import { cn } from "@/lib/cn";
import { signOut } from "@/app/auth/actions";

const LINKS = [
  { href: "/dashboard", label: "CVs", shortLabel: "CVs" },
  { href: "/cover-letters", label: "Cover letters", shortLabel: "Letters" },
];

export default function TopNav({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (!menuOpen || !buttonRef.current) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const width = 240;
      const margin = 8;
      let left = rect.right - width;
      if (left < margin) left = margin;
      if (left + width > window.innerWidth - margin) {
        left = window.innerWidth - width - margin;
      }

      setMenuStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left,
        width,
        zIndex: 60,
      });
    };

    updatePosition();
    const frame = requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setMenuOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const userMenu =
    menuOpen &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={menuRef}
        style={menuStyle}
        className="animate-scale-in overflow-hidden rounded-xl border border-line bg-white shadow-pop"
      >
        <div className="border-b border-line px-3 py-2.5">
          <p className="truncate text-[13px] font-medium text-ink-900">{name}</p>
          <p className="truncate text-[12px] text-ink-500">{email}</p>
        </div>

        <Link
          href="/settings"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-ink-700 transition-colors hover:bg-ink-50"
        >
          <Settings className="h-3.5 w-3.5 text-ink-400" />
          Settings
        </Link>

        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 border-t border-line px-3 py-2.5 text-left text-[13px] text-ink-700 transition-colors hover:bg-ink-50"
          >
            <LogOut className="h-3.5 w-3.5 text-ink-400" />
            Sign out
          </button>
        </form>
      </div>,
      document.body
    );

  return (
    <header className="safe-top sticky top-0 z-40 border-b border-line bg-white">
      <div className="flex h-14 min-w-0 items-center gap-2 px-3 sm:gap-4 sm:px-6">
        <BrandLink href="/dashboard" size={36} hideLabelOnMobile className="shrink-0" />

        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto sm:gap-1">
          {LINKS.map((link) => {
            const active =
              pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors sm:px-3 sm:text-[13px]",
                  active
                    ? "bg-ink-100 text-ink-900"
                    : "text-ink-500 hover:bg-ink-50 hover:text-ink-800"
                )}
              >
                <span className="sm:hidden">{link.shortLabel}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto shrink-0">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-1.5 rounded-lg py-1 pl-1 pr-1.5 transition-colors hover:bg-ink-50 sm:gap-2 sm:pr-2"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-[11px] font-semibold uppercase text-white sm:h-7 sm:w-7">
              {name.slice(0, 1)}
            </span>
            <span className="hidden max-w-[120px] truncate text-[13px] font-medium text-ink-700 md:block">
              {name}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-ink-400" />
          </button>
          {userMenu}
        </div>
      </div>
    </header>
  );
}
