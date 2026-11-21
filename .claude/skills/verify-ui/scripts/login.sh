#!/usr/bin/env bash
# Loguje seedowanego użytkownika dev i wypisuje sam access token na stdout.
# Użycie: TOKEN=$(bash .claude/skills/verify-ui/scripts/login.sh admin|user|<email> [base_url])
# Konta pochodzą z DevDataInitializer w gamehive-backend (hasło obu: password123).
set -euo pipefail
who="${1:-user}"
base="${2:-http://localhost:8080}"
case "$who" in
  admin) email="john.doe@example.com" ;;
  user)  email="jane.smith@example.com" ;;
  *)     email="$who" ;;
esac
resp=$(curl -sS -X POST "$base/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$email\",\"password\":\"password123\"}")
token=$(printf '%s' "$resp" | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
if [ -z "$token" ]; then
  echo "Logowanie $email nie powiodło się: $resp" >&2
  exit 1
fi
printf '%s\n' "$token"
