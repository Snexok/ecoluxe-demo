# ЭКОЛЮКС — веб-демо (статический сайт)

Интерактивное демо операционного слоя кухни: производство → комплект → доставка → сборка → приёмка.

## Папки

- `demo/` — исходное демо (удобно для `python -m http.server`)
- `web/` — корень деплоя на Vercel (те же файлы + `vercel.json`)

Обе папки нужно держать синхронными после правок.

## Локальный запуск

```bash
cd /Users/konstantindarlin/Documents/Codex/2026-09-16/ye/outputs/ecoluxe/demo
python3 -m http.server 4187 --bind 127.0.0.1
```

Откройте http://127.0.0.1:4187/

## Деплой на Vercel (аккаунт snexok)

```bash
cd /Users/konstantindarlin/Documents/Codex/2026-09-16/ye/outputs/ecoluxe/web
vercel --yes --prod
```

Hash-маршруты (`#overview`, `#orders`, …) не требуют SPA-rewrites. `vercel.json` задаёт только заголовки кэша и безопасности.

## Состав корня деплоя

`index.html`, `app.js`, `model.js`, `styles.css`, `research.html`, `assets/`, `vercel.json`
