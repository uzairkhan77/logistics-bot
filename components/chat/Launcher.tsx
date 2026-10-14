"use client";

/**
 * Hidden while the widget is open — the panel covers the screen on mobile and
 * carries its own close control, so a second one only gets in the way.
 */
export function Launcher({
  name,
  isOpen,
  onClick,
}: {
  /** The agent on this page — the pill is the only place it is named outside the widget. */
  name: string;
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${name}`}
      aria-expanded={isOpen}
      tabIndex={isOpen ? -1 : 0}
      className={`fixed bottom-5 right-5 z-50 flex h-12 items-center gap-2.5 rounded-[3px] bg-ink px-4 text-paper
        shadow-[0_10px_28px_-8px_rgba(16,17,19,0.45)]
        transition-[transform,opacity] duration-200 ease-out hover:-translate-y-0.5
        sm:bottom-6 sm:right-6
        ${isOpen ? "pointer-events-none translate-y-2 opacity-0" : "opacity-100"}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
        <path
          d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.5-5.2A8 8 0 1 1 21 12Z"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
      </svg>
      <span className="label">{name}</span>
    </button>
  );
}
