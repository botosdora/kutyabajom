// A Kutyabajom logója: mancs, amelynek a nagy párnája szív (kutya + gondoskodás).
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} className={className} aria-hidden="true" fill="currentColor">
      <g transform="translate(256 262) translate(-256 -280)">
        <ellipse cx="112" cy="206" rx="38" ry="50" transform="rotate(-24 112 206)" />
        <ellipse cx="196" cy="122" rx="40" ry="54" transform="rotate(-8 196 122)" />
        <ellipse cx="316" cy="122" rx="40" ry="54" transform="rotate(8 316 122)" />
        <ellipse cx="400" cy="206" rx="38" ry="50" transform="rotate(24 400 206)" />
        <path d="M256 444 C 200 408 152 366 152 314 C 152 278 178 254 210 254 C 232 254 248 266 256 284 C 264 266 280 254 302 254 C 334 254 360 278 360 314 C 360 366 312 408 256 444 Z" />
      </g>
    </svg>
  );
}

export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span
        className="flex shrink-0 items-center justify-center rounded-[28%] bg-primary text-on-primary"
        style={{ width: size, height: size }}
      >
        <LogoMark size={size * 0.72} />
      </span>
      <span className="font-semibold tracking-tight" style={{ fontSize: size * 0.62 }}>
        kutya<span className="font-extrabold text-link">bajom</span>
      </span>
    </span>
  );
}
