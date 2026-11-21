---
name: ui-review
description: Przegląd UI frontu GameHive pod kątem dostępności (a11y) i design systemu Nectar — tokeny z @theme w src/index.css zamiast slate-*/violet-*/hex, cn() zamiast sklejania klas, brak linii 1px, fonty font-headline/font-body, UI-kit z '@/components/ui' zamiast własnych kontrolek, role=alert/status i jeden live-region tostów, aria-describedby przez describedById, aria-invalid, focus-trap/Escape/scroll-lock w Dialog, nazwy dostępne przycisków-ikon, aria-pressed, aria-busy list, porównanie z mockupami Stitch. Użyj przy review lub pisaniu komponentu albo strony, przed oddaniem PR z UI, gdy użytkownik pyta "czy to dostępne", "czy zgodne z designem", oraz przy dodawaniu nowego komponentu do UI-kitu.
---

# Review UI: dostępność + Nectar

Te punkty wracały w review niemal każdego PR-a z UI (commity „… a11y (review)” w GH-2, 3, 6, 9, 10, 20, 22, 23, 24, 41). Sprawdź je, zanim zrobi to recenzent.

## Najpierw UI-kit
`'@/components/ui'`: `Button`/`ButtonLink`, `Input`/`PasswordInput`, `Textarea`, `Select`, `Combobox`, `Card`, `Chip`, `Badge`, `HexAvatar`, `Icon`, `Spinner`, `Toast`, `Dialog`, `Pagination`, `EmptyState`, `ListSkeleton`, `Section`, `RouteLoader`. Mają już wbudowaną dostępność — własny `<input>`, modal czy przycisk to sygnał, że coś zgubisz. Brakujący wariant → rozszerz komponent kitu (np. `variant="danger"` w `Button`, GH-41) i pokaż go w `UiKitPage`.

## Dostępność — lista kontrolna
- **Pola formularza**: etykieta powiązana z polem; błąd i podpowiedź przez `aria-describedby` (`describedById(fieldId, error, hint)` z `components/ui/fieldDescription.ts` — błąd ma pierwszeństwo); `aria-invalid` tylko przy błędzie; komunikat błędu z `role="alert"`.
- **Tosty**: jeden live-region w `ToastProvider`; błąd = `role="alert"` + `aria-live="assertive"`, reszta `status`/`polite`. Nie dodawaj własnych regionów `aria-live` obok.
- **Modal**: `Dialog` — `role="dialog"`, `aria-modal`, `aria-label` z tytułu, focus na panelu na starcie, pułapka Tab, Escape i klik w tło zamykają, blokada scrolla tła, powrót fokusu do wywołującego. Mobilna szuflada w `AppShell` też ma Escape i scroll-lock.
- **Przyciski-ikony**: dostępna nazwa z kontekstem obiektu (`aria-label="Usuń z kolekcji: Agricola"`, nie „Usuń”). `Icon` jest `aria-hidden` — ikona sama nic nie mówi.
- **Przełączniki**: `aria-pressed` (`Chip`), combobox według wzorca ARIA (`aria-expanded`, `aria-controls`, `aria-activedescendant`, `role="listbox"/"option"`).
- **Listy i stany**: kontener ładowanej listy `aria-busy` + `role="status"`, placeholdery `ListSkeleton` są `aria-hidden`; `EmptyState` ma `role="status"`.
- **Nawigacja**: link to `<a>` (`ButtonLink`, `NavLink`), akcja to `<button>`. Nigdy `div` z `onClick`.
- **Semantyka**: jeden `h1` na stronę, hierarchia nagłówków bez skoków; dane typu klucz–wartość jako `dl` (profil, GH-10).
- **Fokus**: widoczny (`focus-visible:ring-*` jak w `Button`) — nie usuwaj obrysu bez zamiennika.
- **Kontrast**: tekst drugorzędny `text-on-surface-variant`, nie rozjaśniaj go przez `opacity`.

## Nectar — design system
- **Kolory wyłącznie z tokenów** `@theme` (`src/index.css`): `bg-primary`, `text-on-surface`, `bg-surface-container-low`, `bg-error-container`, `bg-scrim`… **Nie** `slate-*`, `violet-*`, `gray-*` ani hex w klasach. Tokeny mają wersję ciemną (motyw w `lib/theme.ts`), więc hardkod psuje dark mode.
- **Bez linii 1px**: podział przez tło (`surface-container-*`), odstęp i cień (`shadow-ambient`), nie `border`. Pola formularzy mają `border-0` i ghost-ring na focusie. Jedyny przyjęty wyjątek to ledwo widoczny separator sekcji `border-t border-outline-variant/20` (stopka `SideNav`, `UserActionsDialog`) — tego nie „naprawiaj”, ale nie rozszerzaj na karty i listy.
- **Typografia**: `font-headline` (Manrope) na nagłówki, `font-body` (Inter) na treść.
- **Motyw**: heksagony przez utility `hex` / `hex-flat` (pointy-top — GH-2), szkło przez `glass`. Zaokrąglenia duże (`rounded-2xl`/`3xl`), przyciski pigułki.
- **Klasy łącz `cn()`** (`lib/cn.ts`: clsx + tailwind-merge), nie template stringiem — inaczej konflikty klas nie są rozwiązywane.
- **Mockupy**: `stitch_extracted/stitch_gamehive/<ekran>/code.html` + `screen.png` (rozpakowane z `stitch_gamehive.zip`, ignorowane w git). Przy nowym ekranie sprawdź, czy istnieje mockup, i przenoś **układ i klasy**, a kolory zamieniaj na tokeny.
- **Ikony**: każda nowa → `icon_names` w `index.html` (skill `new-route`, punkt 4).

## Wynik review
Lista `plik:linia` → problem → poprawka, pogrupowana: dostępność / design / spójność z kitem. Gdy coś da się sprawdzić tylko wzrokowo (kontrast, wygląd w dark mode, wypełnione ikony) — powiedz to wprost i zaproponuj skill `verify-ui`.
