import { useEffect, useState } from "react";
import "./send-text-message.css";

interface SendTextMessageModalProps {
  patientName: string;
  phone: string;
  onClose: () => void;
  onSend: () => void;
}

export function SendTextMessageModal({
  patientName,
  phone,
  onClose,
  onSend,
}: SendTextMessageModalProps) {
  const [tab, setTab] = useState<"forms" | "workflows">("forms");
  const [sendText, setSendText] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(phone);
  const [preview, setPreview] = useState(
    `Hi ${patientName}, Athelas WPT has sent you some forms to complete. Please use the link below to get started: {{link}}`,
  );

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
      className="send-text-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="send-text-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-text-title"
      >
        <header className="send-text-header">
          <h2 id="send-text-title">Send Text Message</h2>
          <button type="button" className="send-text-close" aria-label="Close" onClick={onClose}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" fill="none" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </button>
        </header>

        <div className="send-text-tabs" role="tablist" aria-label="Send type">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "forms"}
            className={`send-text-tab${tab === "forms" ? " is-active" : ""}`}
            onClick={() => setTab("forms")}
          >
            Forms
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "workflows"}
            className={`send-text-tab${tab === "workflows" ? " is-active" : ""}`}
            onClick={() => setTab("workflows")}
          >
            Workflows
          </button>
        </div>

        <div className="send-text-body">
          {tab === "forms" ? (
            <>
              <label className="send-text-field">
                <span>Intake Forms</span>
                <select defaultValue="">
                  <option value="" disabled>
                    Select templates
                  </option>
                  <option value="identity">Identity Verification</option>
                  <option value="financial">Financial Policy</option>
                  <option value="medical-history">Medical History</option>
                </select>
              </label>

              <label className="send-text-field">
                <span>Functional Outcome Forms</span>
                <select defaultValue="">
                  <option value="" disabled>
                    Select functional outcome forms
                  </option>
                  <option value="shoulder">Shoulder Outcome Survey</option>
                  <option value="lower-back">Lower Back Outcome Survey</option>
                </select>
              </label>
            </>
          ) : (
            <label className="send-text-field">
              <span>Workflows</span>
              <select defaultValue="">
                <option value="" disabled>
                  Select workflows
                </option>
                <option value="intake">New Patient Intake</option>
                <option value="follow-up">Follow-Up Check In</option>
              </select>
            </label>
          )}

          <div className="send-text-field">
            <span>Message Types</span>
            <div className="send-text-checks">
              <label className="send-text-check">
                <input
                  type="checkbox"
                  checked={sendText}
                  onChange={(event) => setSendText(event.target.checked)}
                />
                <i aria-hidden="true" />
                Text
              </label>
              <label className="send-text-check">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(event) => setSendEmail(event.target.checked)}
                />
                <i aria-hidden="true" />
                Email
              </label>
            </div>
          </div>

          <label className="send-text-field">
            <span>Phone Number</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
            />
          </label>

          <label className="send-text-field">
            <span>Text Preview</span>
            <textarea
              rows={4}
              value={preview}
              onChange={(event) => setPreview(event.target.value)}
            />
          </label>
        </div>

        <footer className="send-text-footer">
          <button type="button" className="send-text-send" onClick={onSend}>
            Send
          </button>
        </footer>
      </section>
    </div>
  );
}
