# Презентация «Пакет в цех» (Docs v1)

Статический сайт для ООО «Меркатор Калуга». Публикуется в [solid-dxf-demo](https://github.com/AlexPror/solid-dxf-demo).

Исходники плагина — в приватном репозитории; здесь только HTML/CSS/JS.

## Локальный просмотр

Откройте `index.html` в браузере или:

```powershell
cd docs/site
python -m http.server 8080
```

## Публикация

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/publish-demo-site.ps1
```
