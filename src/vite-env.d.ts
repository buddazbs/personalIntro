/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Адрес Cloudflare Worker'а анкеты, например https://date-request.<аккаунт>.workers.dev */
  readonly VITE_DATE_ENDPOINT?: string
}
