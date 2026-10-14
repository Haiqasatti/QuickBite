export function Logo() {
  return (
    <span className="logo">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <circle cx="15" cy="15" r="9" fill="none" stroke="currentColor" strokeWidth="3" />
        <path d="M21.5 21.5 27 27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="logo-word">QuickBite</span>
    </span>
  );
}