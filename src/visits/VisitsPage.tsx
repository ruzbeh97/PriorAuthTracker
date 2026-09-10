import { useEffect, useMemo, useState } from "react";
import "@fontsource/geist-sans/300.css";
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";
import { PrototypeControls } from "./components/prototype/PrototypeControls";
import { ClinicalNotePage } from "./components/note/ClinicalNotePage";
import { ChargeAppointmentModal } from "./components/charge/ChargeAppointmentModal";
import { ChargeOverrideDrawer } from "./components/charge/ChargeOverrideDrawer";
import { PriorAuthorizationModal } from "./components/prior-auth/PriorAuthorizationModal";
import { SelectProviderModal } from "./components/referrals/SelectProviderModal";
import { EditVisitLimitsModal } from "./components/visits/EditVisitLimitsModal";
import { SendTextMessageModal } from "./components/forms/SendTextMessageModal";
import { AppointmentHistoryDrawer } from "./components/history/AppointmentHistoryDrawer";
import { UpcomingAppointmentsPopover } from "./components/appointments/UpcomingAppointmentsPopover";
import { EditAppointmentDrawer } from "./components/appointment/EditAppointmentDrawer";
import { CalendarShell } from "./components/shell/CalendarShell";
import { Toast } from "./components/shared/Toast";
import { applySelectedAppointment, buildPrototypeState } from "./data/buildPrototypeState";
import { calendarData, type CalendarAppointment } from "./data/calendarData";
import { parsePrototypeQuery, writePrototypeQuery } from "./data/urlState";
import { AppointmentDrawerScreen } from "./screens/actions-first/AppointmentDrawerScreen";
import type { PrototypeQueryState } from "./types/prototype";
import "./shell.css";
import "./styles.css";
import "./visits-embed.css";

export default function VisitsPage() {
  const [query, setQuery] = useState<PrototypeQueryState>(() => parsePrototypeQuery());
  const [controlsHidden, setControlsHidden] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [page, setPage] = useState<"calendar" | "note">("calendar");
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarAppointment | null>(
    () => calendarData.appointments.find((appointment) => appointment.interactive) ?? null,
  );
  const [chargeOpen, setChargeOpen] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [priorAuthOpen, setPriorAuthOpen] = useState(false);
  const [selectProviderOpen, setSelectProviderOpen] = useState(false);
  const [editVisitLimitsOpen, setEditVisitLimitsOpen] = useState(false);
  const [editAppointmentOpen, setEditAppointmentOpen] = useState(false);
  const [sendFormsOpen, setSendFormsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const prototypeState = useMemo(() => {
    const base = buildPrototypeState(query.state);
    return selectedAppointment ? applySelectedAppointment(base, selectedAppointment) : base;
  }, [query.state, selectedAppointment]);

  useEffect(() => {
    writePrototypeQuery(query, "replace");
  }, []);

  useEffect(() => {
    function onPopState() {
      setQuery(parsePrototypeQuery());
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // The status panel sits above the scrim, so opening the drawer must not leave it hanging open.
  useEffect(() => {
    if (drawerOpen) {
      setControlsHidden(true);
    }
  }, [drawerOpen]);

  function updateQuery(next: PrototypeQueryState) {
    setQuery(next);
    writePrototypeQuery(next, "push");
  }

  function checkIn() {
    updateQuery({ ...query, state: "ready" });
    setToast("Checked in");
  }

  function prototypeControls() {
    return (
      <PrototypeControls
        value={query}
        hidden={controlsHidden}
        onChange={updateQuery}
        onHide={() => setControlsHidden(true)}
        onShow={() => setControlsHidden(false)}
      />
    );
  }

  function openNote() {
    setDrawerOpen(false);
    setPage("note");
  }

  function returnToAppointments() {
    setPage("calendar");
    setDrawerOpen(true);
  }

  function openCharge() {
    setDrawerOpen(false);
    setChargeOpen(true);
  }

  function closeCharge() {
    setChargeOpen(false);
    setDrawerOpen(true);
  }

  function openOverride() {
    setDrawerOpen(false);
    setOverrideOpen(true);
  }

  function closeOverride() {
    setOverrideOpen(false);
    setDrawerOpen(true);
  }

  function openPriorAuth() {
    setDrawerOpen(false);
    setPriorAuthOpen(true);
  }

  function closePriorAuth() {
    setPriorAuthOpen(false);
    setDrawerOpen(true);
  }

  function openSelectProvider() {
    setDrawerOpen(false);
    setSelectProviderOpen(true);
  }

  function closeSelectProvider() {
    setSelectProviderOpen(false);
    setDrawerOpen(true);
  }

  function openEditVisitLimits() {
    setDrawerOpen(false);
    setEditVisitLimitsOpen(true);
  }

  function closeEditVisitLimits() {
    setEditVisitLimitsOpen(false);
    setDrawerOpen(true);
  }

  function openEditAppointment() {
    setDrawerOpen(false);
    setEditAppointmentOpen(true);
  }

  function closeEditAppointment() {
    setEditAppointmentOpen(false);
    setDrawerOpen(true);
  }

  function openSendForms() {
    setDrawerOpen(false);
    setSendFormsOpen(true);
  }

  function closeSendForms() {
    setSendFormsOpen(false);
    setDrawerOpen(true);
  }

  function openHistory() {
    setDrawerOpen(false);
    setHistoryOpen(true);
  }

  function closeHistory() {
    setHistoryOpen(false);
    setDrawerOpen(true);
  }

  function openSchedule() {
    setDrawerOpen(false);
    setScheduleOpen(true);
  }

  function closeSchedule() {
    setScheduleOpen(false);
    setDrawerOpen(true);
  }

  if (page === "note") {
    return (
      <div className="visits-embed">
        <ClinicalNotePage
          headerActions={prototypeControls()}
          onBack={returnToAppointments}
          onToast={setToast}
        />
        <Toast message={toast} />
      </div>
    );
  }

  return (
    <div className={`visits-embed prototype-root${drawerOpen ? " is-drawer-open" : ""}`}>
      <CalendarShell
        onOpenDrawer={(appointment) => {
          setSelectedAppointment(appointment);
          setDrawerOpen(true);
        }}
        readiness={query.state}
        headerActions={prototypeControls()}
        onEditAppointment={openEditAppointment}
        onCharge={openCharge}
        onPriorAuth={openPriorAuth}
        onViewNote={openNote}
        onToast={setToast}
      />

      {drawerOpen ? (
        <>
          <div className="scrim" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <aside className="drawer" role="dialog" aria-modal="true" aria-label="Appointment details">
            <div className="drawer-content">
              <AppointmentDrawerScreen
                state={prototypeState}
                onToast={setToast}
                onClose={() => setDrawerOpen(false)}
                onViewNote={openNote}
                onCharge={openCharge}
                onOverride={openOverride}
                onPriorAuth={openPriorAuth}
                onSelectProvider={openSelectProvider}
                onEditVisitLimits={openEditVisitLimits}
                onEditAppointment={openEditAppointment}
                onCheckIn={checkIn}
                onSendForms={openSendForms}
                onViewHistory={openHistory}
                onViewSchedule={openSchedule}
              />
            </div>
          </aside>
        </>
      ) : null}

      {chargeOpen ? (
        <ChargeAppointmentModal
          onClose={closeCharge}
          onConfirm={() => {
            setToast("Payment link ready to send");
            setChargeOpen(false);
            setDrawerOpen(true);
          }}
        />
      ) : null}

      {overrideOpen ? (
        <ChargeOverrideDrawer
          onClose={closeOverride}
          onSubmit={() => {
            setToast("Charge override saved");
            closeOverride();
          }}
        />
      ) : null}

      {priorAuthOpen ? (
        <PriorAuthorizationModal
          onClose={closePriorAuth}
          onNewPriorAuth={() => setToast("New prior authorization")}
        />
      ) : null}

      {selectProviderOpen ? <SelectProviderModal onClose={closeSelectProvider} /> : null}

      {editVisitLimitsOpen ? (
        <EditVisitLimitsModal
          onClose={closeEditVisitLimits}
          onSave={() => {
            setToast("Visit limits saved");
            closeEditVisitLimits();
          }}
        />
      ) : null}

      {historyOpen ? <AppointmentHistoryDrawer onClose={closeHistory} /> : null}

      {scheduleOpen ? (
        <UpcomingAppointmentsPopover
          patientName={prototypeState.patient.name}
          provider={prototypeState.appointment.provider}
          facility={prototypeState.appointment.location}
          onClose={closeSchedule}
          onPrint={() => setToast("Printing appointments")}
        />
      ) : null}

      {sendFormsOpen ? (
        <SendTextMessageModal
          patientName={prototypeState.patient.name}
          phone={prototypeState.patient.phone}
          onClose={closeSendForms}
          onSend={() => {
            setToast("Forms sent");
            closeSendForms();
          }}
        />
      ) : null}

      {editAppointmentOpen ? (
        <EditAppointmentDrawer
          onClose={closeEditAppointment}
          onUpdate={() => {
            setToast("Appointment updated");
            closeEditAppointment();
          }}
        />
      ) : null}

      <Toast message={toast} />
    </div>
  );
}
