"use client";

import type { ReactNode } from "react";
import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

const GAP = 6;
const MARGIN = 8;

interface Position {
  top: number;
  left: number;
  placement: "top" | "bottom";
}

/**
 * Small hover/focus bubble, keyboard-reachable (not hover-only — a mouse-only tooltip
 * excludes keyboard users entirely). Positioned via `getBoundingClientRect` and portaled to
 * `document.body` with `position: fixed`: an absolutely-positioned bubble inside a table's
 * `overflow-x-auto` wrapper (`Table.tsx`) would otherwise widen that wrapper's scrollable
 * area and force a spurious scrollbar the moment a right-edge action (e.g. Delete) is
 * hovered. Flips above/below and clamps horizontally so it never runs off the viewport.
 * `id` is exposed so a caller can wire `aria-describedby` (see `Field.tsx`'s `help` prop).
 */
export function Tooltip({
  content,
  children,
  id,
}: {
  content: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  const [position, setPosition] = useState<Position | null>(null);
  const generatedId = useId();
  const tooltipId = id ?? generatedId;
  const wrapperRef = useRef<HTMLSpanElement>(null);

  function show() {
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const placement: Position["placement"] = rect.top < 48 ? "bottom" : "top";
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, MARGIN),
      window.innerWidth - MARGIN,
    );
    const top = placement === "top" ? rect.top - GAP : rect.bottom + GAP;
    setPosition({ top, left, placement });
  }

  function hide() {
    setPosition(null);
  }

  return (
    <span
      ref={wrapperRef}
      className="inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {position
        ? createPortal(
            <span
              id={tooltipId}
              role="tooltip"
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                transform: `translate(-50%, ${position.placement === "top" ? "-100%" : "0"})`,
              }}
              className={cn(
                "pointer-events-none z-50 w-max max-w-64 rounded-md border border-border bg-popover",
                "px-2.5 py-1.5 text-xs text-popover-foreground shadow-popover",
              )}
            >
              {content}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
