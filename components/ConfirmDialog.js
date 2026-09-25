"use client";

import Modal from "./Modal";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Delete", busy = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-soft">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-outline" onClick={onClose} disabled={busy}>
          Cancel
        </button>
        <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
          {busy ? "Working…" : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
