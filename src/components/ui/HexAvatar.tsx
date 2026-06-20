import { cn } from '@/lib/cn'

interface HexAvatarProps {
  /** URL zdjęcia. Gdy brak — pokazywane są inicjały z `name`. */
  src?: string | null
  /** Nazwa/login — źródło inicjałów i alt. */
  name?: string
  size?: number
  className?: string
}

function initials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const chars = parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)
  return chars.toUpperCase()
}

/** Awatar w masce heksagonalnej (motyw marki GameHive). */
export function HexAvatar({ src, name, size = 48, className }: HexAvatarProps) {
  return (
    <div
      className={cn(
        'hex grid place-items-center overflow-hidden bg-surface-container-highest',
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={name ?? ''} className="h-full w-full object-cover" />
      ) : (
        <span
          className="font-headline font-bold text-primary"
          style={{ fontSize: size * 0.36 }}
        >
          {initials(name)}
        </span>
      )}
    </div>
  )
}
