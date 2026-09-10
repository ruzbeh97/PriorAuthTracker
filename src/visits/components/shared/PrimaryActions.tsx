import { useEffect, useId, useRef, useState } from "react";

interface PrimaryActionsProps {
  checkInEnabled: boolean;
  checkInDisabledReason?: string;
  onViewNote: () => void;
  onCheckIn: () => void;
  onToast?: (message: string) => void;
}

export function PrimaryActions({
  checkInEnabled,
  checkInDisabledReason,
  onViewNote,
  onCheckIn,
  onToast,
}: PrimaryActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!groupRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="primary-actions">
      <div className="primary-actions-row">
        <button className="button-secondary" type="button" onClick={onViewNote}>
          View note
        </button>
        <div className="check-in-group" ref={groupRef}>
          <button
            className="button-primary"
            type="button"
            disabled={!checkInEnabled}
            aria-disabled={!checkInEnabled}
            title={!checkInEnabled ? checkInDisabledReason : undefined}
            onClick={onCheckIn}
          >
            Check in
          </button>
          <button
            className="button-primary-chevron"
            type="button"
            disabled={!checkInEnabled}
            aria-label="Check-in options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            title={!checkInEnabled ? checkInDisabledReason : "Check-in options"}
            onClick={() => setMenuOpen((open) => !open)}
          >
            ⌄
          </button>
          {menuOpen ? (
            <div className="check-in-menu" id={menuId} role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onCheckIn();
                }}
              >
                Check in patient
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onToast?.("Marked arrived");
                }}
              >
                Mark as arrived
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {!checkInEnabled && checkInDisabledReason ? (
        <p className="check-in-reason">{checkInDisabledReason}</p>
      ) : null}
    </div>
  );
}
