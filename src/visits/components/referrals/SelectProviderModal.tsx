import { useEffect } from "react";
import "./select-provider.css";

interface SelectProviderModalProps {
  onClose: () => void;
}

export function SelectProviderModal({ onClose }: SelectProviderModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="select-provider-overlay">
      <section className="select-provider-modal" role="dialog" aria-modal="true" aria-labelledby="select-provider-title">
        <header>
          <h2 id="select-provider-title">Select Provider</h2>
          <button type="button" aria-label="Close provider selection" onClick={onClose}>×</button>
        </header>
        <div className="select-provider-body">
          <label className="provider-search">
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5" />
              <path d="m12.3 12.3 4 4" />
            </svg>
            <input type="search" placeholder="Search by Name or NPI" aria-label="Search by Name or NPI" />
          </label>
          <p>Select a Provider</p>
        </div>
      </section>
    </div>
  );
}
