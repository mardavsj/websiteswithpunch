"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { readJson } from "@/lib/read-json";

/** "Manage billing": open the Dodo customer portal, or explain why it couldn't (never silent). */
export function useOpenPortal() {
  const { toast } = useToast();
  const [opening, setOpening] = useState(false);

  async function openPortal() {
    if (opening) return;
    setOpening(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await readJson(res);
      if (typeof data.url === "string") {
        window.location.href = data.url; // stays "opening" while the browser leaves
        return;
      }
      toast(data.error || "Could not open billing. Please try again.", "error");
    } catch {
      toast("Couldn't reach billing. Check your connection and try again.", "error");
    }
    setOpening(false);
  }

  return { openPortal, opening };
}
