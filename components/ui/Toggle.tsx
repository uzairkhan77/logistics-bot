"use client";

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-[2px] border transition-colors duration-150 ${
        checked ? "border-accent bg-accent" : "border-line bg-surface"
      }`}
    >
      <span
        className={`absolute top-1/2 block size-[13px] -translate-y-1/2 rounded-[1px] transition-[left,background-color] duration-150 ease-out ${
          checked ? "left-[19px] bg-accent-ink" : "left-[2px] bg-line"
        }`}
        aria-hidden
      />
    </button>
  );
}
