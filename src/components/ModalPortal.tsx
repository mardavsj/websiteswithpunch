"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders a modal overlay directly under <body>. Without this, a modal opened from the navbar
 * sits inside the header, whose backdrop-blur makes it the containing block for position:fixed,
 * so the "full-screen" overlay is centred on the 65px header and the window spills off the top.
 */
export function ModalPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, document.body) : null;
}

/** Dialog box sizing shared by every modal: never taller than the viewport, scrolls inside. */
export const DIALOG_SCROLL = "max-h-[calc(100dvh-2rem)] overflow-y-auto";
