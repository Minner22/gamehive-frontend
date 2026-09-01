import { useEffect, useState } from 'react'
import { listCategories, listMechanics } from '@/api/taxonomy'
import type { CategoryDto, MechanicDto } from '@/api/types'
import { useToast } from '@/components/ui'
import { getApiErrorMessage } from '@/lib/apiError'

/**
 * Kategorie i mechaniki do kontrolek filtrów. Obie listy są kuratorowane i krótkie,
 * więc backend zwraca je w całości — pobieramy je raz na wejściu strony.
 *
 * Każdy widok z filtrami potrzebuje dokładnie tego samego, stąd wspólny hook
 * zamiast trzeciej kopii tego samego efektu.
 */
export function useTaxonomyOptions() {
  const toast = useToast()
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [mechanics, setMechanics] = useState<MechanicDto[]>([])

  useEffect(() => {
    let active = true
    Promise.all([listCategories(), listMechanics()])
      .then(([loadedCategories, loadedMechanics]) => {
        if (!active) return
        setCategories(loadedCategories)
        setMechanics(loadedMechanics)
      })
      .catch((err) => active && toast.error(getApiErrorMessage(err)))
    return () => {
      active = false
    }
  }, [toast])

  return { categories, mechanics }
}
