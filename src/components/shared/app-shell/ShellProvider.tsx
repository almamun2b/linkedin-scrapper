"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const COLLAPSED_STORAGE_KEY = "linkedin-scrapper:sidebar-collapsed";

function readStoredCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * A tiny external store for the desktop collapse state, read via `useSyncExternalStore` — the
 * localStorage-backed value is synchronization with an outside system, not derived component
 * state, so it belongs here rather than in a `useEffect` that calls `setState` on mount.
 */
const collapsedStore = (() => {
  let value = typeof window === "undefined" ? false : readStoredCollapsed();
  const listeners = new Set<() => void>();

  return {
    getSnapshot: () => value,
    getServerSnapshot: () => false,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set: (next: boolean) => {
      value = next;
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      } catch {
        // per-viewer convenience only — ignore a blocked/unavailable localStorage
      }
      listeners.forEach((listener) => {
        listener();
      });
    },
  };
})();

interface ShellContextValue {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(
    collapsedStore.subscribe,
    collapsedStore.getSnapshot,
    collapsedStore.getServerSnapshot,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer on navigation. Adjusting state in response to a prop/derived value
  // changing during render (React's documented pattern) instead of a useEffect that would
  // call setState synchronously on every render.
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <ShellContext
      value={{
        collapsed,
        toggleCollapsed: () => {
          collapsedStore.set(!collapsed);
        },
        mobileOpen,
        openMobile: () => {
          setMobileOpen(true);
        },
        closeMobile: () => {
          setMobileOpen(false);
        },
      }}
    >
      {children}
    </ShellContext>
  );
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used within ShellProvider");
  return ctx;
}
