"use client";

import type { ReactNode } from "react";
import { ModalPortal } from "./ModalPortal";
import { BTN_1, BTN_2, CLOSE_X, ModalFrame, X_ICON } from "./modal-ui";
import { useDialog } from "./useDialog";

type Props = {
  open: boolean;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  chip?: ReactNode;
  primary?: { label: string; onClick: () => void };
  onClose: () => void;
  children: ReactNode;
};

/** Page-width dialog (full-screen sheet on phones) with sticky header and footer. */
export function Modal({ open, title, subtitle, icon, chip, primary, onClose, children }: Props) {
  useDialog(() => document.getElementById("app-modal"), open, onClose);
  if (!open) return null;
  return (
    <ModalPortal>
      <ModalFrame
        label={title}
        icon={icon}
        title={title}
        subtitle={subtitle}
        chip={chip}
        backdrop={<div className="absolute inset-0 bg-solid/30 backdrop-blur-[2px]" onClick={onClose} aria-hidden />}
        close={<button type="button" onClick={onClose} aria-label="Close" className={CLOSE_X}>{X_ICON}</button>}
        closeFooter={<button type="button" onClick={onClose} className={BTN_2}>Close</button>}
        footer={primary && <button type="button" onClick={primary.onClick} className={BTN_1}>{primary.label}</button>}
      >
        {children}
      </ModalFrame>
    </ModalPortal>
  );
}
