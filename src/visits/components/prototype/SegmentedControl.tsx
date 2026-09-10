import type { KeyboardEvent } from "react";

interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  size = "sm",
}: SegmentedControlProps<T>) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const nextIndex = (selectedIndex + delta + options.length) % options.length;
    onChange(options[nextIndex].value);
  }

  return (
    <div className={`segmented-control segmented-control-${size}`}>
      <span className="segmented-control-label" id={`${label}-label`}>
        {label}
      </span>
      <div
        className="segmented-control-options"
        role="radiogroup"
        aria-labelledby={`${label}-label`}
        onKeyDown={handleKeyDown}
      >
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              className={selected ? "is-selected" : undefined}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
