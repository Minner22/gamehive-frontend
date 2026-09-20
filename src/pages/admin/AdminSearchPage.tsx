import { useState } from 'react'
import { reindexSearch } from '@/api/adminSearch'
import type { ReindexResultDto } from '@/api/types'
import { Button, Dialog, Section, useToast } from '@/components/ui'
import { getApiErrorCode, getApiErrorMessage } from '@/lib/apiError'
import { pluralPl } from '@/lib/plural'

const COUNTERS: { key: keyof ReindexResultDto; label: string }[] = [
  { key: 'games', label: 'Gry' },
  { key: 'expansions', label: 'Dodatki' },
  { key: 'publishers', label: 'Wydawcy' },
  { key: 'authors', label: 'Autorzy' },
]

/**
 * Trzy stany, w których wina nie leży po stronie klikającego, mają własne
 * komunikaty — surowy kod błędu nic by tu nie powiedział.
 */
function reindexErrorMessage(err: unknown): string {
  switch (getApiErrorCode(err)) {
    case 'REINDEX_ALREADY_RUNNING':
      return 'Przebudowa już trwa — poczekaj, aż się skończy.'
    case 'SEARCH_INDEX_UNAVAILABLE':
      return 'Silnik wyszukiwania jest niedostępny. Spróbuj ponownie, gdy wróci.'
    case 'SEARCH_FAILED':
      return 'Przebudowa nie powiodła się. Zajrzyj w logi silnika wyszukiwania.'
    default:
      return getApiErrorMessage(err)
  }
}

/**
 * Przebudowa indeksów wyszukiwarki — narzędzie naprawcze na rozjazd między bazą
 * a Meilisearch. Dostęp ma MODERATOR i ADMIN, dlatego strona nie mieszka
 * w sekcji administracyjnej (ta jest tylko dla ADMIN-a).
 */
export default function AdminSearchPage() {
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ReindexResultDto | null>(null)

  const run = async () => {
    setConfirming(false)
    setRunning(true)
    try {
      const summary = await reindexSearch()
      setResult(summary)
      toast.success('Indeksy przebudowane.')
    } catch (err) {
      toast.error(reindexErrorMessage(err))
    } finally {
      setRunning(false)
    }
  }

  const total = result ? result.games + result.expansions + result.publishers + result.authors : 0

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">Wyszukiwarka</h1>
        <p className="mt-1 text-on-surface-variant">
          Przebudowa indeksów z bazy danych — jedyna droga naprawy rozjazdu między biblioteką
          a wynikami wyszukiwania.
        </p>
      </header>

      <Section title="Przebudowa indeksów">
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Operacja przebudowuje oba indeksy naraz: treści (gry i dodatki) oraz podpowiedzi
            taksonomii (wydawcy i autorzy). Trwa tym dłużej, im więcej jest pozycji, i nie da się
            jej uruchomić dwa razy równolegle.
          </p>
          <Button
            iconLeft="refresh"
            loading={running}
            disabled={running}
            onClick={() => setConfirming(true)}
          >
            Przebuduj indeksy
          </Button>
        </div>
      </Section>

      {result && (
        <Section title="Wynik ostatniej przebudowy">
          <div className="space-y-3">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COUNTERS.map((counter) => (
                <div
                  key={counter.key}
                  className="rounded-2xl bg-surface-container-low px-4 py-3 text-center"
                >
                  <dt className="text-sm text-on-surface-variant">{counter.label}</dt>
                  <dd className="font-headline text-2xl font-extrabold text-on-surface">
                    {result[counter.key]}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-on-surface-variant">
              Razem {total} {pluralPl(total, 'dokument', 'dokumenty', 'dokumentów')} w indeksach.
            </p>
          </div>
        </Section>
      )}

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Przebudować indeksy?"
      >
        <div className="space-y-4">
          <p className="text-sm text-on-surface-variant">
            Indeksy są najpierw czyszczone, a dopiero potem zapisywane od nowa, więc{' '}
            <b className="text-on-surface">
              w trakcie przebudowy wyszukiwarka może nie zwracać wyników
            </b>
            . Biblioteka i reszta aplikacji działają normalnie — czytają z bazy.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Anuluj
            </Button>
            <Button iconLeft="refresh" onClick={run}>
              Tak, przebuduj
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
