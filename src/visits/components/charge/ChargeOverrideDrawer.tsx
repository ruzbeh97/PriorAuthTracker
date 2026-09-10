import "./charge-override.css";

interface ChargeOverrideDrawerProps {
  onClose: () => void;
  onSubmit: () => void;
}

const overrideActions = [
  ["Set Copay Amount In USD Cents", "Amount In USD Cents"],
  ["Set Deductible Amount In USD Cents", "Amount In USD Cents"],
  ["Set Fixed Fee", "Set Fixed Fee Amount In USD Cents"],
  ["Set Coinsurance Amount In USD Cents", "Amount In USD Cents"],
  ["Set Self Pay Amount In USD Cents", "Amount In USD Cents"],
];

export function ChargeOverrideDrawer({ onClose, onSubmit }: ChargeOverrideDrawerProps) {
  return (
    <div className="override-overlay">
      <section className="override-drawer" role="dialog" aria-modal="true" aria-labelledby="override-title">
        <header>
          <h2 id="override-title">Charge Override</h2>
          <button type="button" aria-label="Close charge override" onClick={onClose}>×</button>
        </header>

        <div className="override-content">
          <div className="override-top-fields">
            <input aria-label="Override name" defaultValue="Harry Test - Override" />
            <label>
              <span>Priority</span>
              <input aria-label="Priority" defaultValue="999999" inputMode="numeric" />
            </label>
          </div>

          <label className="override-date">
            <span>End date</span>
            <div><b aria-hidden="true">□</b><input type="text" aria-label="End date" placeholder="MM/DD/YYYY" /></div>
          </label>

          <section className="override-actions-section">
            <div className="override-section-heading">
              <h3>Actions</h3>
              <button type="button">＋ &nbsp; Add Action</button>
            </div>

            <div className="override-actions-list">
              {overrideActions.map(([name, amountLabel]) => (
                <div className="override-action-row" key={name}>
                  <label>
                    <span>Name</span>
                    <select defaultValue={name}>
                      <option>{name}</option>
                    </select>
                  </label>
                  <label>
                    <span>{amountLabel}</span>
                    <input aria-label={`${name} amount`} defaultValue="0" inputMode="numeric" />
                  </label>
                  <button type="button" aria-label={`Delete ${name}`} className="override-delete">▯</button>
                </div>
              ))}
            </div>
          </section>

          <section className="override-conditions">
            <h3>Conditions</h3>
          </section>
        </div>

        <footer>
          <button type="button" className="override-submit" onClick={onSubmit}>Submit</button>
          <button type="button" className="override-cancel" onClick={onClose}>Cancel</button>
        </footer>
      </section>
    </div>
  );
}
