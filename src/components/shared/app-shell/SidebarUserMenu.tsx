"use client";

import { Avatar } from "@/components/ui/Avatar";
import type { Role } from "@/generated/prisma/enums";
import { cn } from "@/lib/cn";
import { ChevronUp, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useShell } from "./ShellProvider";
import { SignOutButton } from "./SignOutButton";

export function SidebarUserMenu({
  user,
}: {
  user: { email: string | null; name: string | null; role: Role };
}) {
  const { collapsed } = useShell();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative border-t border-border p-2">
      {open ? (
        <div
          role="menu"
          aria-label="Account"
          className="absolute bottom-full left-2 mb-2 w-64 rounded-lg border border-border bg-popover p-3 text-sm shadow-popover"
        >
          <div className="flex items-center gap-2.5">
            <Avatar name={user.name} email={user.email} />
            <div className="min-w-0">
              <p className="truncate font-medium text-popover-foreground">
                {user.name ?? user.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="my-2.5 border-t border-border" />
          <Link
            href="/me"
            role="menuitem"
            onClick={() => {
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-foreground transition-colors hover:bg-surface-muted"
          >
            <Settings aria-hidden="true" className="size-4" />
            My profile
          </Link>
          <SignOutButton />
        </div>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((prev) => !prev);
        }}
        title={collapsed ? (user.name ?? user.email ?? "Account") : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-surface-muted",
          collapsed && "justify-center",
        )}
      >
        <Avatar name={user.name} email={user.email} />
        {collapsed ? null : (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {user.name ?? user.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <ChevronUp
              aria-hidden="true"
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          </>
        )}
      </button>
    </div>
  );
}
