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
| Шейдер «чернила матчи» | `src/components/InkShader.tsx` |
| Чаинки на фоне | `src/components/LeafField.tsx` |

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
