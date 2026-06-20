interface BrandMarkProps {
  size?: number
  className?: string
  title?: string
}

/**
 * Znak marki GameHive (wektor): heksagon-obrys + meeple + dwa złote chevrony.
 * Obrys i meeple używają `currentColor` (ustaw text-* na rodzicu — reaguje na
 * dark mode); chevrony są stałe złote (primary-container). Odwzorowanie logo.png.
 */
export function BrandMark({ size = 36, className, title = 'GameHive' }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label={title}
      className={className}
    >
      {/* Heksagon (flat-top) */}
      <path
        d="M44 9.2 L56 30 L44 50.8 L20 50.8 L8 30 L20 9.2 Z"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      {/* Meeple */}
      <circle cx="32" cy="15" r="4.6" fill="currentColor" />
      <path
        d="M32 19 C29.3 19 27 20.4 25.6 22.5 C24.7 23.8 23.1 24.6 21.5 24.6
           C20.2 24.6 19.5 25.8 20.2 26.8 C21 28 23 28.4 24.6 27.7 L26.9 26.7
           C26.5 28.7 25.6 30.3 24.2 31.7 C23.3 32.6 23.9 34 25.2 34 L29 34
           C30 34 30.8 33.2 31 32.2 L32 28.8 L33 32.2 C33.2 33.2 34 34 35 34
           L38.8 34 C40.1 34 40.7 32.6 39.8 31.7 C38.4 30.3 37.5 28.7 37.1 26.7
           L39.4 27.7 C41 28.4 43 28 43.8 26.8 C44.5 25.8 43.8 24.6 42.5 24.6
           C40.9 24.6 39.3 23.8 38.4 22.5 C37 20.4 34.7 19 32 19 Z"
        fill="currentColor"
      />
      {/* Chevrony (złote) — dwie odseparowane warstwy ula */}
      <path
        d="M21 39 L32 42.5 L43 39"
        stroke="var(--color-primary-container)"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 45 L32 48.5 L43 45"
        stroke="var(--color-primary-container)"
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
