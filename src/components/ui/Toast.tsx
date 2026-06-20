import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'
import { Icon } from './Icon'

type ToastTone = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  tone: ToastTone
  message: string
}

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast musi być użyty wewnątrz <ToastProvider>')
  return ctx
}

const TONES: Record<ToastTone, { cls: string; icon: string }> = {
  success: { cls: 'bg-secondary-container text-on-secondary-container', icon: 'check_circle' },
  error: { cls: 'bg-error-container text-on-error-container', icon: 'error' },
  info: { cls: 'bg-surface-container-high text-on-surface', icon: 'info' },
}

const AUTO_DISMISS_MS = 5000

function ToastView({ item, onClose }: { item: ToastItem; onClose: () => void }) {
  const tone = TONES[item.tone]
  return (
    <div
      role="status"
      className={cn(
        'flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-2xl px-4 py-3 shadow-ambient',
        tone.cls,
      )}
    >
      <Icon name={tone.icon} filled className="shrink-0 text-xl" />
      <p className="flex-1 text-sm font-medium">{item.message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Zamknij powiadomienie"
        className="shrink-0 opacity-70 transition-opacity hover:opacity-100"
      >
        <Icon name="close" className="text-lg" />
      </button>
    </div>
  )
}

/** Dostarcza API toastów (useToast) i renderuje stos powiadomień. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)

  const remove = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(
    (message: string, tone: ToastTone = 'info') => {
      const id = ++idRef.current
      setToasts((list) => [...list, { id, tone, message }])
      window.setTimeout(() => remove(id), AUTO_DISMISS_MS)
    },
    [remove],
  )

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (m) => show(m, 'success'),
      error: (m) => show(m, 'error'),
      info: (m) => show(m, 'info'),
    }),
    [show],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-label="Powiadomienia"
        className="fixed right-4 top-4 z-[100] flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastView key={t.id} item={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
