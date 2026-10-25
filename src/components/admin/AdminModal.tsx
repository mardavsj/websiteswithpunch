import Link from "next/link";
import type { ReactNode } from "react";
import { BTN_2, CLOSE_X, Cols, ModalFrame, X_ICON } from "../modal-ui";
import { AdminModalKeys } from "./AdminModalKeys";

type Props = { close: string; label: string; eyebrow: string; title: ReactNode; subtitle?: ReactNode; chip?: ReactNode; left: ReactNode; right?: ReactNode; footer?: ReactNode };

/** Admin record dialog: summary on the left, breakdown/history on the right. Close goes to `close`. */
export function AdminModal({ close, label, eyebrow, title, subtitle, chip, left, right, footer }: Props) {
  return (
    <ModalFrame
      label={label}
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      chip={chip}
      backdrop={<Link href={close} aria-label="Close details" tabIndex={-1} scroll={false} className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />}
      close={<Link href={close} scroll={false} aria-label="Close" className={CLOSE_X}>{X_ICON}</Link>}
      closeFooter={<Link href={close} scroll={false} className={BTN_2}>Close</Link>}
      footer={footer}
    >
      <AdminModalKeys close={close} />
      {right ? <Cols left={left} right={right} /> : left}
    </ModalFrame>
  );
}
