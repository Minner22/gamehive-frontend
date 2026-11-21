---
name: sonar-triage
description: Pobiera otwarte issues, security hotspoty, pokrycie i stan quality gate frontu GameHive z SonarCloud (projekt Minner22_gamehive-frontend, organizacja minner22), grupuje po regułach (typescript:S*, javascript:S*, css:S*) i proponuje plan sprzątania — z podziałem na prawdziwe problemy, świadome decyzje (Won't fix) i fałszywe alarmy. Użyj, gdy użytkownik pyta o Sonara we froncie, dług techniczny, quality gate, code smells, pokrycie, "co pokazuje SonarCloud", albo gdy krok analizy w CI na PR jest czerwony.
---

# Triage SonarCloud (frontend)

Projekt `Minner22_gamehive-frontend` (`sonar-project.properties`). Analiza w `.github/workflows/ci.yml` po `lint` + `test:coverage` + `build`, **tylko gdy repo ma sekret `SONAR_TOKEN`**. Backendowy odpowiednik: skill `sonar-triage` w `gamehive-backend`.

## Pobranie danych
Projekt jest prywatny — anonimowe zapytanie zwraca „Project doesn't exist”. Potrzebna zmienna `SONAR_TOKEN` w środowisku, z którego startuje Claude Code (SonarCloud → My Account → Security). Brak zmiennej → zatrzymaj się i poproś. **Nigdy nie proś o wklejenie tokena do czatu.**

```bash
B=https://sonarcloud.io/api; P=Minner22_gamehive-frontend; A=(-u "$SONAR_TOKEN:")
curl -sS "${A[@]}" "$B/qualitygates/project_status?projectKey=$P"                     # &pullRequest=<nr> dla PR
curl -sS "${A[@]}" "$B/issues/search?componentKeys=$P&resolved=false&ps=500&facets=rules,severities,types"
curl -sS "${A[@]}" "$B/hotspots/search?projectKey=$P&status=TO_REVIEW&ps=500"
curl -sS "${A[@]}" "$B/measures/component?component=$P&metricKeys=coverage,bugs,vulnerabilities,code_smells,duplicated_lines_density,sqale_index"
```
Bez `jq` — parsuj przez `node -e`. Wyniki zapisuj w scratchpadzie, nie w repo.

Szybki podgląd bez tokena: komentarz bota SonarCloud pod PR-em (`gh pr view <nr> --comments`) pokazuje quality gate, nowe issues, pokrycie i duplikację nowego kodu.

## Klasyfikacja
Dla każdej reguły: liczba, przykładowe `plik:linia`, kategoria:
- **Naprawić** — prawdziwy problem.
- **Świadoma decyzja (Won't fix w UI SonarCloud — oznacza użytkownik)**. Przed uznaniem za błąd sprawdź `CLAUDE.md` i `.claude/skills/` (`Grep` po nazwie pliku). Znane przypadki:
  - `src/api/schema.d.ts` jest wykluczony z analizy (generowany) — uwagi do niego to sprawy backendu;
  - `// eslint-disable-next-line react-refresh/only-export-components` przy hookach eksportowanych obok providera (`useAuth`, `useCollection`, `useToast`) — wzorzec kontekstu, nie dług;
  - akcje GitHub przypięte do pełnych SHA z komentarzem wersji — to **odpowiedź** na regułę o ruchomych tagach, nie problem.
- **Fałszywy alarm** — z uzasadnieniem.

Pokrycie: wykluczenia w `sonar.coverage.exclusions` (muszą zgadzać się z `test.coverage.exclude` w `vite.config.ts` — skill `frontend-testing`). Niskie pokrycie komponentu bez własnego testu nie jest problemem, jeśli pokrywa go test strony; quality gate patrzy na nowy kod.

## Wynik
Tabela reguła → liczba → kategoria → działanie, plus propozycja jednego issue „sprzątanie” z jednym commitem na regułę (`GH-<N> refactor(sonar): S<reguła> …`). Najpierw plan, potem poprawki — po akceptacji użytkownika.
