import { useEffect, useState } from 'react'
import { listCategories, listMechanics } from '@/api/taxonomy'
import type { CategoryDto, MechanicDto } from '@/api/types'
import { useToast } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/apiError'

interface TaxonomyOptions {
  categories: CategoryDto[]
  mechanics: MechanicDto[]
}

/**
 * Obietnica trzymana na poziomie modułu — słowniki są kuratorowane i praktycznie
 * niezmienne, a korzystają z nich trzy ekrany z filtrami. Bez tego przejście
 * biblioteka → szukaj → dodatki wysyłało sześć zapytań o te same dwie listy.
 * Nieudane pobranie czyścimy, żeby kolejne wejście spróbowało ponownie.
 */
let cached: Promise<TaxonomyOptions> | null = null

function loadTaxonomy(): Promise<TaxonomyOptions> {
  cached ??= Promise.all([listCategories(), listMechanics()])
    .then(([categories, mechanics]) => ({ categories, mechanics }))
    .catch((err: unknown) => {
      cached = null
      throw err
    })
  return cached
}

/** Tylko dla testów: zapomnij zapamiętane słowniki. */
export function resetTaxonomyCache(): void {
  cached = null
}

/**
 * Kategorie i mechaniki do kontrolek filtrów. Obie listy są kuratorowane i krótkie,
 * więc backend zwraca je w całości — pobieramy je raz na sesję (cache wyżej).
 *
 * Każdy widok z filtrami potrzebuje dokładnie tego samego, stąd wspólny hook
 * zamiast trzeciej kopii tego samego efektu.
 */
export function useTaxonomyOptions(): TaxonomyOptions {
  const toast = useToast()
  const [options, setOptions] = useState<TaxonomyOptions>({ categories: [], mechanics: [] })

  useEffect(() => {
    let active = true
    loadTaxonomy()
      .then((loaded) => active && setOptions(loaded))
      .catch((err) => active && toast.error(getApiErrorMessage(err)))
    return () => {
      active = false
    }
  }, [toast])

  return options
}
