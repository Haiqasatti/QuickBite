import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./Icons";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  variant?: "dialog" | "drawer";
  children: ReactNode;
}

/** Built on the native <dialog>: focus trap, Escape to close and an inert background come from the browser. */
export function Modal({ open, title, onClose, variant = "dialog", children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal modal-${variant}`}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="modal-panel">
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{open ? children : null}</div>
      </div>
    </dialog>
  );
}