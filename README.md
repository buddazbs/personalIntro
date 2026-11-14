# personalIntro

Личная страничка-знакомство в эстетике «вечерней чайной».

Vite + React 19 + TypeScript + Tailwind v4, анимации на `motion`, плавный скролл на `lenis`, фон первого экрана — самописный WebGL-шейдер, чаинки — canvas 2D. Шрифты Cormorant и Manrope.

## Команды

```bash
npm install
npm run dev       # разработка → http://localhost:5173/personalIntro/
npm run build     # прод-сборка в dist/
npm run preview   # посмотреть прод-сборку
```

## Где что править

| Что | Где |
| --- | --- |
| Тексты, интересы, черты, соцсети | `src/content.ts` |
| Фотографии (подхватываются автоматически, по имени) | `src/assets/avatars/*.jpg` |
| Цвета и шрифты | `src/styles.css` (`@theme`) и `src/lib/colors.ts` |
| Туман на первом экране (симуляция жидкости) | `src/components/MatchaFog.tsx` |
| Чаинки на фоне | `src/components/LeafField.tsx` |
| Курсор | `src/components/Cursor.tsx` |
| Анкета «записаться на свидание»: шаги, кухни, форматы | `src/date/DateFlow.tsx`, `src/date/schema.ts` |
| Расписание: будни с 19:00, выходные и праздники весь день, переносы | `src/date/schedule.ts` |
| Сервер-посредник анкеты → Telegram | `worker/` |

## Анкета «записаться на свидание»

Карточка в разделе «связь» открывает анкету по адресу `/personalIntro/date`. Ответы уходят
в Telegram через Cloudflare Worker: токен бота хранится только на нём, в коде сайта его нет.
Worker повторно проверяет все поля и расписание, отсекает чужие сайты, ботов (поле-ловушка,
слишком быстрое заполнение) и ограничивает 5 отправок в минуту с одного IP.

Настройка (один раз):

1. **Бот.** В Telegram у [@BotFather](https://t.me/BotFather): `/newbot` → получить токен.
   Затем открыть своего бота и нажать **Start** — иначе бот не сможет вам писать.
2. **chat_id.** Написать боту любое сообщение и открыть
   `https://api.telegram.org/bot<ТОКЕН>/getUpdates` — число в `"chat":{"id": …}` и есть chat_id.
3. **Worker.** Заполнить `worker/.env` (шаблон — `worker/.env.example`, сам `.env` в git не попадает):
   ```bash
   cd worker
   npm install
   cp .env.example .env  # вписать TELEGRAM_TOKEN и TELEGRAM_CHAT_ID
   npx wrangler login
   npm run deploy        # выведет адрес вида https://date-request.<аккаунт>.workers.dev
   npm run secrets       # загрузит значения из .env секретами в Worker
   ```
   Тот же `.env` подхватывает и локальный `npm run dev`.
4. **Сайт.** На GitHub: Settings → Secrets and variables → Actions → **Variables** → New variable
   `DATE_ENDPOINT` = адрес Worker'а. Перезапустить деплой (Actions → Run workflow).
   Адрес попадает в сборку и в CSP (`connect-src`) — больше никуда сайт запросы не шлёт.

Локально: `npm run dev` без `VITE_DATE_ENDPOINT` — анкета «отправляется» понарошку и печатает
сообщение в консоль браузера. С Worker'ом в тестовом режиме (ничего не шлёт, возвращает текст):

```bash
cd worker && npx wrangler dev --port 8790 --var DRY_RUN:1 --var TELEGRAM_TOKEN:x --var TELEGRAM_CHAT_ID:1
VITE_DATE_ENDPOINT=http://localhost:8790 npm run dev   # в другом терминале, из корня
```

Раз в год, когда выходит производственный календарь, стоит дополнить `EXTRA_DAYS_OFF` в
`src/date/schedule.ts` переносами выходных (обычные праздники и переносы с выходных считаются сами).

## Деплой

Ветки:
- `main` — исходники;
- `gh-pages` — собранный сайт. Руками не трогать, его перезаписывает CI.

Каждый пуш в `main` запускает `.github/workflows/deploy.yml`: `npm ci` → `npm run build` → содержимое `dist/` публикуется в `gh-pages`.
Перезапустить деплой без коммита: вкладка **Actions** → **Deploy to GitHub Pages** → **Run workflow**.

Особенности GitHub Pages, которые уже учтены:
- `base: '/personalIntro/'` в `vite.config.ts` — сайт живёт не в корне домена;
- `public/.nojekyll` — иначе Jekyll на стороне GitHub может выкинуть файлы, начинающиеся с `_`;
- `dist/404.html` — копия `index.html`, чтобы неверный адрес показывал сайт, а не стандартную ошибку GitHub;
- `package-lock.json` содержит Linux-сборки нативных модулей, поэтому `npm ci` проходит в CI.

## Приватность

Шрифты, скрипты и картинки собираются в бандл и отдаются с того же домена — CSP в `index.html` запрещает сторонние ресурсы. Никаких cookie и аналитики.
