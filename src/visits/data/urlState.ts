import type { DesignDirection, PrototypeQueryState, ReadinessState } from "../types/prototype";
import { DESIGN_OPTIONS, READINESS_OPTIONS } from "../types/prototype";

const DESIGN_VALUES = new Set(DESIGN_OPTIONS.map((option) => option.value));
const STATE_VALUES = new Set(READINESS_OPTIONS.map((option) => option.value));

export const DEFAULT_QUERY: PrototypeQueryState = {
  design: "actions-first",
  state: "ready",
};

export function parsePrototypeQuery(search: string = window.location.search): PrototypeQueryState {
  const params = new URLSearchParams(search);
  const designParam = (params.get("design") ?? "") as DesignDirection;
  const state = params.get("state") as ReadinessState | null;

  const design =
    DESIGN_OPTIONS.length === 0
      ? ""
      : DESIGN_VALUES.has(designParam)
        ? designParam
        : DEFAULT_QUERY.design;

  return {
    design,
    state: state && STATE_VALUES.has(state) ? state : DEFAULT_QUERY.state,
  };
}

export function writePrototypeQuery(next: PrototypeQueryState, mode: "push" | "replace" = "push") {
  const params = new URLSearchParams();
  if (next.design) {
    params.set("design", next.design);
  }
  params.set("state", next.state);
  const query = params.toString();
  const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  if (mode === "replace") {
    window.history.replaceState(next, "", url);
  } else {
    window.history.pushState(next, "", url);
  }
}
