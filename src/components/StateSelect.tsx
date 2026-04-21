import { AUTH_STATES, type AuthState } from '../types';

interface StateSelectProps {
  value: AuthState;
  onChange: (val: AuthState) => void;
}

export default function StateSelect({ value, onChange }: StateSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as AuthState)}
      className="appearance-none bg-white border border-outline rounded px-2 py-1 text-sm text-text-primary pr-6 cursor-pointer hover:border-primary/40 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/30 w-full max-w-[160px]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 6px center',
      }}
    >
      <option value="" disabled>Select State</option>
      {AUTH_STATES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
