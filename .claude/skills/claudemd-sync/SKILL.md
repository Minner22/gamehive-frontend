---
name: claudemd-sync
description: Aktualizuje CLAUDE.md i skille frontu GameHive (.claude/skills/*) po KAŻDYM zakończonym issue — decyduje, czy wpis trafia do CLAUDE.md (reguła przekrojowa, drzewo architektury, roadmapa), do istniejącego skilla, czy zmiana zasługuje na nowy skill; weryfikuje fakty w kodzie, usuwa nieaktualne wpisy i trzyma styl "co + dlaczego". Użyj ZAWSZE i proaktywnie po zakończeniu implementacji issue (commit "GH-N docs: …"), po poprawkach z review, gdy weryfikacja na żywym backendzie coś potwierdziła, gdy powstał nowy plik w src/api lub src/lib, gdy użytkownik mówi "udokumentuj", "zaktualizuj CLAUDE.md", "zaktualizuj skille", oraz gdy w trakcie pracy wyszła nieoczywista pułapka.
---

# Synchronizacja dokumentacji i skilli

Aktualizacja dokumentacji to część „gotowe” każdego issue — nie czekaj na prośbę. Wynik ląduje w ostatnim commicie issue: `GH-<N> docs: …`.

## Gdzie co trafia
| treść | miejsce |
| --- | --- |
| Stack, komendy, CI, konwencje commitów/PR, tracking | `CLAUDE.md` |
| Drzewo „Architektura” — **każdy** plik `src/lib/` z krótkim opisem; w `src/api/` pliki infrastruktury z opisem, moduły obszarowe wystarczy wymienić w zbiorczej linii | `CLAUDE.md` |
| Reguła przekrojowa (dotyczy wielu modułów) — krótko, z odesłaniem do skilla | `CLAUDE.md` |
| Zakres vs backend, roadmapa, faza | `CLAUDE.md` |
| Szczegóły dodawania strony/trasy/nawigacji/ikon | skill `new-route` |
| Pułapki kontraktu, nowe kody błędów z własną obsługą, nowe moduły API | skill `api-contract` |
| Sesja, token, interceptor, ekrany auth | skill `auth-session` |
| Nowy wzorzec/pułapka testowa, nowy cache modułowy, nowa fabryka fixture'ów | skill `frontend-testing` |
| Nowy komponent UI-kitu, nowy token, nowy wzorzec a11y | skill `ui-review` |
| Nowe konto/procedura weryfikacji, zmiana progów rozmiaru paczki | skill `verify-ui` |
| Świadoma decyzja Won't fix w Sonarze | skill `sonar-triage` |

Gdy szczegół w CLAUDE.md rozrasta się ponad kilka linii, przenieś go do skilla i zostaw w CLAUDE.md jedną linię z odesłaniem. **CLAUDE.md ma się kurczyć, nie rosnąć** — po wydzieleniu skilli (GH-82) ok. 9 kB; sekcja „Zasady przekrojowe” to jedna linia na regułę.

## Nowy skill — kiedy
- nowy obszar z własnym cyklem życia (np. Hives, gdy backend da API; WebSocket/powiadomienia; i18n) → skill ekspert z mapą kodu, przepływami, niezmiennikami i testami (wzór: `auth-session`);
- powtarzalny proces zrobiony ręcznie drugi raz → skill procesowy z listą kontrolną (wzór: `new-route`);
- notatki o temacie przekroczyłyby ok. 1/3 istniejącego skilla.

**Nie** twórz skilla dla jednorazowej poprawki ani czegoś, co mieści się w trzech liniach istniejącego. Nowy skill: `.claude/skills/<nazwa>/SKILL.md`, frontmatter `name` + `description` (ścieżki plików, nazwy funkcji i frazy, po których ma się ładować), wpis w indeksie „Skille projektu” w CLAUDE.md i w tabeli wyżej.

## Styl
- Po polsku (jak reszta CLAUDE.md), gęsto, jeden punkt = jedna decyzja: **co** → **dlaczego** → czego nie „naprawiać”.
- Konkretne nazwy: plik, funkcja, `errorCode`, numer issue (`GH-74`, `backend#140`).
- Zapisuj odrzucone alternatywy i odstępstwa — to najcenniejsza część.
- Pułapka pinowana testem → nazwij test.
- „Sprawdzone na dev (RRRR-MM-DD)” tylko po faktycznej weryfikacji. Daty bezwzględne.

## Procedura
1. `git diff master...HEAD --stat` i lektura zmienionych plików. **Każdy fakt sprawdź w kodzie** — dokumentuj to, co jest, nie plan.
2. Kontrola dryfu drzewa architektury:
   ```bash
   for f in src/api/*.ts src/lib/*.ts; do case $f in *.test.*|*.d.ts) continue;; esac; grep -q "$(basename $f)" CLAUDE.md || echo "brak w CLAUDE.md: $f"; done
   ```
3. `Grep` po nazwach zmienionych plików/funkcji w `CLAUDE.md` i `.claude/skills/` — popraw wpisy, które zmiana dezaktualizuje. Nieaktualna dokumentacja jest gorsza niż brak.
4. Dopisz nowe wpisy według tabeli; zaktualizuj roadmapę (issue zamknięte → ✅).
5. Rozstrzygnij „aktualizacja czy nowy skill”.
6. Pokaż użytkownikowi krótkie podsumowanie: które pliki zmieniono i dlaczego.
