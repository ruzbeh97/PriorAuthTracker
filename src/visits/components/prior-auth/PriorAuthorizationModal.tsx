import { useEffect } from "react";
import "./prior-authorization.css";

interface PriorAuthorizationModalProps {
  onClose: () => void;
  onNewPriorAuth: () => void;
}

export function PriorAuthorizationModal({ onClose, onNewPriorAuth }: PriorAuthorizationModalProps) {
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
    <div
      className="prior-auth-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="prior-auth-modal" role="dialog" aria-modal="true" aria-labelledby="prior-auth-title">
        <header className="prior-auth-title-row">
          <span className="prior-auth-hash" aria-hidden="true">#</span>
          <h2 id="prior-auth-title">Prior Authorization</h2>
        </header>

        <div className="prior-auth-toolbar">
          <div className="prior-auth-tabs" role="tablist">
            <button type="button" className="is-active" role="tab" aria-selected="true">Pre-Certified</button>
            <button type="button" role="tab" aria-selected="false">Referral</button>
          </div>
          <button type="button" className="new-prior-auth" onClick={onNewPriorAuth}>＋ New Prior Auth</button>
        </div>

        <div className="prior-auth-table">
          <div className="prior-auth-table-head">
            <span>Actions</span>
            <span>Auth Number</span>
            <span>Status</span>
            <span>Total Visits/Units</span>
            <span>Effective Date</span>
            <span>Expiration Date</span>
            <span>Notes</span>
          </div>
          <div className="prior-auth-empty">No prior authorizations present for this patient</div>
          <div className="prior-auth-pagination">
            <span>Rows per page:</span>
            <select aria-label="Rows per page" defaultValue="5"><option>5</option></select>
            <span>0—0 of 0</span>
            <button type="button" disabled aria-label="Previous page">‹</button>
            <button type="button" disabled aria-label="Next page">›</button>
          </div>
        </div>
      </section>
    </div>
  );
}
