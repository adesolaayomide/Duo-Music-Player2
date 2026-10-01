interface DuoLogoProps {
  /** When true, show only the icon mark without the wordmark */
  collapsed?: boolean;
  /** Icon size in px (applies to the icon mark) */
  size?: number;
}

/**
 * Duo Player logo — original SVG mark.
 * The icon is two interlocking ovals (like a sound-wave / dual speaker),
 * in accent green. The wordmark is "duo" in a bold rounded font.
 */
export function DuoLogo({ collapsed = false, size = 32 }: DuoLogoProps) {
  return (
    <div
      className="flex items-center gap-2 select-none"
      aria-label="Duo Player"
    >
      {/* Icon mark: two interlocking circles */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        {/* Left oval */}
        <ellipse
          cx="12"
          cy="16"
          rx="9"
          ry="13"
          fill="none"
          stroke="#1ED760"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Right oval */}
        <ellipse
          cx="20"
          cy="16"
          rx="9"
          ry="13"
          fill="none"
          stroke="#1ED760"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Center accent dot */}
        <circle cx="16" cy="16" r="2" fill="#1ED760" />
      </svg>

      {/* Wordmark */}
      {!collapsed && (
        <span
          className="text-white font-black tracking-tight leading-none"
          style={{
            fontSize: "1.125rem",
            fontFamily: "Inter, ui-sans-serif, system-ui",
          }}
        >
          duo
          <span className="text-accent">.</span>
        </span>
      )}
    </div>
  );
}
