/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Backend dev do proxy w trybie deweloperskim (omija CORS — ten sam origin).
const API_PROXY_TARGET = process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // Żądania do /api lecą na ten sam origin (:5173) i są przekazywane do
    // backendu — dzięki temu w dev nie ma CORS. Wymaga VITE_API_BASE_URL pustego.
    proxy: {
      '/api': { target: API_PROXY_TARGET, changeOrigin: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      // `lcov` czyta SonarCloud, `text` jest po to, żeby lokalne uruchomienie
      // od razu coś pokazywało; `json-summary` ułatwia szybki podgląd liczb.
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      // `include` obejmuje też pliki bez ani jednego testu — inaczej pokrycie
      // rosłoby przez samo nietestowanie modułu.
      include: ['src/**/*.{ts,tsx}'],
      // Wykluczenia w duchu backendu (dto/model/config): kod bez logiki do
      // przetestowania — generowany, czysto typowy albo należący do samych testów.
      exclude: [
        'src/api/schema.d.ts', // generowany z OpenAPI (npm run gen:api)
        'src/api/schema.contract.ts', // sam strażnik typów, zero runtime'u
        'src/api/types.ts', // aliasy DTO
        'src/main.tsx', // punkt wejścia
        'src/vite-env.d.ts',
        'src/test/**', // pomoce testowe (MSW, fixture'y)
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
      ],
    },
  },
})