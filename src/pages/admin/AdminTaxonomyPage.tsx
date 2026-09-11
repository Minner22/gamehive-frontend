import { useCallback, useState } from 'react'
import {
  approveAuthor,
  approvePublisher,
  createAuthor,
  createCategory,
  createMechanic,
  createPublisher,
  deleteAuthor,
  deleteCategory,
  deleteMechanic,
  deletePublisher,
  listAuthors,
  listCategories,
  listMechanics,
  listPublishers,
  renameCategory,
  renameMechanic,
  type TaxonomyFilter,
  updateAuthor,
} from '@/api/adminTaxonomy'
import type { AuthorDto } from '@/api/types'
import { CuratedDictionary } from '@/components/admin/CuratedDictionary'
import { GrowingDictionary } from '@/components/admin/GrowingDictionary'
import { Chip } from '@/components/ui'
import { formatAuthorName } from '@/lib/authorName'

type Tab = 'categories' | 'mechanics' | 'publishers' | 'authors'

const TABS: { value: Tab; label: string }[] = [
  { value: 'publishers', label: 'Wydawcy' },
  { value: 'authors', label: 'Autorzy' },
  { value: 'categories', label: 'Kategorie' },
  { value: 'mechanics', label: 'Mechaniki' },
]

const PUBLISHER_FIELDS = [{ key: 'name', label: 'Nazwa' }] as const
const AUTHOR_FIELDS = [
  { key: 'firstName', label: 'Imię' },
  { key: 'lastName', label: 'Nazwisko' },
] as const

const authorValues = (author: AuthorDto) => ({
  firstName: author.firstName ?? '',
  lastName: author.lastName ?? '',
})

export default function AdminTaxonomyPage() {
  // Wydawcy i autorzy na początku: to tam powstają wpisy PENDING do zatwierdzenia.
  const [tab, setTab] = useState<Tab>('publishers')

  const fetchPublishers = useCallback(
    (filter: TaxonomyFilter, page: number, size: number) =>
      listPublishers(filter, { page, size }),
    [],
  )
  const fetchAuthors = useCallback(
    (filter: TaxonomyFilter, page: number, size: number) => listAuthors(filter, { page, size }),
    [],
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-headline text-3xl font-extrabold tracking-tight">Słowniki</h1>
        <p className="mt-1 text-on-surface-variant">
          Wydawcy i autorzy przybywają ze zgłoszeniami użytkowników. Kategorie i mechaniki są
          kuratorowane — tylko administrator je dodaje.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((entry) => (
          <Chip key={entry.value} selected={tab === entry.value} onClick={() => setTab(entry.value)}>
            {entry.label}
          </Chip>
        ))}
      </div>

      {tab === 'publishers' && (
        <GrowingDictionary
          key="publishers"
          title="Wydawcy"
          addLabel="Dodaj wydawcę"
          noun={['wydawca', 'wydawców', 'wydawców']}
          fields={PUBLISHER_FIELDS}
          fetchPage={fetchPublishers}
          labelOf={(publisher) => publisher.name ?? ''}
          create={({ name }) => createPublisher({ name })}
          approve={approvePublisher}
          remove={deletePublisher}
        />
      )}

      {tab === 'authors' && (
        <GrowingDictionary
          key="authors"
          title="Autorzy"
          addLabel="Dodaj autora"
          noun={['autor', 'autorów', 'autorów']}
          fields={AUTHOR_FIELDS}
          fetchPage={fetchAuthors}
          labelOf={formatAuthorName}
          create={({ firstName, lastName }) => createAuthor({ firstName, lastName })}
          approve={approveAuthor}
          remove={deleteAuthor}
          update={(id, { firstName, lastName }) => updateAuthor(id, { firstName, lastName })}
          valuesOf={authorValues}
        />
      )}

      {tab === 'categories' && (
        <CuratedDictionary
          key="categories"
          title="Kategorie"
          addLabel="Dodaj kategorię"
          list={listCategories}
          create={(name) => createCategory({ name })}
          rename={(id, name) => renameCategory(id, { name })}
          remove={deleteCategory}
        />
      )}

      {tab === 'mechanics' && (
        <CuratedDictionary
          key="mechanics"
          title="Mechaniki"
          addLabel="Dodaj mechanikę"
          list={listMechanics}
          create={(name) => createMechanic({ name })}
          rename={(id, name) => renameMechanic(id, { name })}
          remove={deleteMechanic}
        />
      )}
    </div>
  )
}
