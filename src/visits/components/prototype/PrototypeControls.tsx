import { useEffect, useId, useRef, useState } from "react";
import {
  READINESS_OPTIONS,
  type PrototypeQueryState,
  type ReadinessState,
} from "../../types/prototype";

/* Matches the .prototype-panel.is-closing animation in styles.css. */
const PANEL_EXIT_MS = 140;

interface PrototypeControlsProps {
  value: PrototypeQueryState;
  hidden: boolean;
  onChange: (next: PrototypeQueryState) => void;
  onHide: () => void;
  onShow: () => void;
}

export function PrototypeControls({ value, hidden, onChange, onHide, onShow }: PrototypeControlsProps) {
  const open = !hidden;
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  // Keep the panel mounted briefly after close so it can fade out.
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }

    const timer = window.setTimeout(() => setMounted(false), PANEL_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onHide();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onHide();
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onHide]);

  return (
    <div className="prototype-controls" ref={rootRef}>
      <button
        className={`prototype-tab${open ? " is-open" : ""}`}
        type="button"
        aria-label="Prototype settings"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? onHide() : onShow())}
      >
        Patient Status
      </button>

      {mounted ? (
        <div
          className={`prototype-panel${open ? "" : " is-closing"}`}
          id={panelId}
          role="dialog"
          aria-label="Patient status"
        >
          <div className="prototype-panel-header">
            <span>Patient Status</span>
            <button type="button" className="prototype-panel-close" aria-label="Close controls" onClick={onHide}>
              <svg aria-hidden="true" viewBox="0 0 20 20">
                <path
                  d="M4 4l12 12M16 4L4 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="prototype-panel-section">
            <div className="prototype-choice-row" role="radiogroup" aria-label="Patient status">
              {READINESS_OPTIONS.map((option) => {
                const selected = option.value === value.state;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={selected ? "is-selected" : undefined}
                    onClick={() => onChange({ ...value, state: option.value as ReadinessState })}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
