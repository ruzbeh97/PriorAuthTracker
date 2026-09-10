import { useState } from "react";
import "./charge-appointment.css";

interface ChargeAppointmentModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

export function ChargeAppointmentModal({ onClose, onConfirm }: ChargeAppointmentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("link");
  const [email, setEmail] = useState(true);
  const [text, setText] = useState(true);

  return (
    <div className="charge-overlay" role="presentation">
      <section className="charge-modal" role="dialog" aria-modal="true" aria-labelledby="charge-title">
        <header className="charge-header">
          <h2 id="charge-title">Charge Appointment</h2>
          <button type="button" aria-label="Close charge appointment" onClick={onClose}>×</button>
        </header>

        <div className="charge-body">
          <div className="charge-editor">
            <div className="charge-patient-tabs">
              <button type="button" className="is-active">Harry Test</button>
              <button type="button">＋ Add Patient</button>
            </div>

            <div className="charge-line">
              <label>
                <span>Appointment</span>
                <select defaultValue="07/21/2026 07:00 AM">
                  <option>07/21/2026 07:00 AM</option>
                </select>
              </label>
              <label>
                <span>Type</span>
                <select aria-label="Charge type" defaultValue="">
                  <option value=""> </option>
                </select>
              </label>
              <label className="charge-amount">
                <span>Amount</span>
                <div><b>$</b><input aria-label="Amount" defaultValue="0.00" inputMode="decimal" /></div>
              </label>
              <button type="button" className="remove-charge-line" aria-label="Remove line item">×</button>
            </div>

            <div className="charge-editor-actions">
              <button type="button">＋ &nbsp; Add Line Item</button>
              <button type="button">＋ &nbsp; Add Service</button>
            </div>
          </div>

          <aside className="charge-payment-panel">
            <div className="charge-payment-scroll">
              <section className="charge-field-section">
                <h3>Pay As</h3>
                <select aria-label="Pay as" defaultValue="Harry Test (Patient)">
                  <option>Harry Test (Patient)</option>
                </select>
              </section>

              <section className="charge-field-section">
                <h3>Payment Method</h3>
                <label className="floating-select">
                  <span>Collecting at facility</span>
                  <select aria-label="Facility" defaultValue=""><option value=""> </option></select>
                </label>

                <div className="payment-link-options">
                  <label>
                    <input
                      type="radio"
                      name="payment-method"
                      checked={paymentMethod === "link"}
                      onChange={() => setPaymentMethod("link")}
                    />
                    Send Payment Link
                  </label>
                  <label>
                    <input type="checkbox" checked={email} onChange={(event) => setEmail(event.target.checked)} />
                    Send via Email
                  </label>
                  <label>
                    <input type="checkbox" checked={text} onChange={(event) => setText(event.target.checked)} />
                    Send via Text
                  </label>
                </div>

                <div className="other-payment-options">
                  <label><input type="radio" name="payment-method" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} /> Pay via Credit Card</label>
                  <label className="is-disabled"><input type="radio" name="payment-method" disabled /> Athelas Card Reader</label>
                  <label><input type="radio" name="payment-method" checked={paymentMethod === "balance"} onChange={() => setPaymentMethod("balance")} /> Add to Patient's Balance</label>
                  <label><input type="radio" name="payment-method" checked={paymentMethod === "record"} onChange={() => setPaymentMethod("record")} /> Record Payment</label>
                </div>
              </section>

              <label className="gift-card-option"><input type="checkbox" /> Use a Gift Card</label>
            </div>

            <footer>
              <button type="button" onClick={onConfirm}>Confirm</button>
            </footer>
          </aside>
        </div>
      </section>
    </div>
  );
}
