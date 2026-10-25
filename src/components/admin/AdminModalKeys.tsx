"use client";

import { useRouter } from "next/navigation";
import { useDialog } from "../useDialog";

/** Esc, focus trap, scroll lock and focus return for the server-rendered AdminModal. */
export function AdminModalKeys({ close }: { close: string }) {
  const router = useRouter();
  useDialog(() => document.getElementById("app-modal"), true, () => router.push(close, { scroll: false }));
  return null;
}
