import { createContext, useContext, useState, type ReactNode } from 'react';

export const PROTOTYPE_VERSIONS = ['P00', 'P0', 'P1'] as const;

export type PrototypeVersion = (typeof PROTOTYPE_VERSIONS)[number];

const STORAGE_KEY = 'prior-auth:prototype-version';
const EDITION_EVENT = 'prior-auth:prototype-version';

function loadVersion(): PrototypeVersion {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return PROTOTYPE_VERSIONS.includes(stored as PrototypeVersion) ? (stored as PrototypeVersion) : 'P00';
  } catch {
    return 'P00';
  }
}

const PrototypeVersionContext = createContext<{
  version: PrototypeVersion;
  setVersion: (version: PrototypeVersion) => void;
} | null>(null);

export function PrototypeVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersionState] = useState<PrototypeVersion>(loadVersion);

  const setVersion = (next: PrototypeVersion) => {
    setVersionState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable in private browsing; the choice still holds for this session.
    }
    window.dispatchEvent(new CustomEvent(EDITION_EVENT, { detail: next }));
  };

  return (
    <PrototypeVersionContext.Provider value={{ version, setVersion }}>
      {children}
    </PrototypeVersionContext.Provider>
  );
}

export function usePrototypeVersion() {
  const context = useContext(PrototypeVersionContext);
  if (!context) {
    throw new Error('usePrototypeVersion must be used within PrototypeVersionProvider');
  }
  return context;
}
