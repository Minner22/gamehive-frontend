/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Bazowy URL backendu Spring Boot (GameHive API). */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}