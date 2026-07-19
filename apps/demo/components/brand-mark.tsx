export function BrandMark({ className = "brand-mark" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 128 128" aria-hidden="true" focusable="false">
    <rect x="4" y="4" width="120" height="120" rx="30" fill="#12372C" />
    <circle cx="64" cy="62" r="34" fill="none" stroke="#B9F2D0" strokeWidth="7" />
    <path d="M30 62h68M64 28c11 10 17 22 17 34S75 86 64 96M64 28C53 38 47 50 47 62s6 24 17 34" fill="none" stroke="#B9F2D0" strokeWidth="5" strokeLinecap="round" />
    <path d="m50 63 10 10 22-25" fill="none" stroke="#FFD56A" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
