# Презентация «Пакет в цех» (Docs v1)

Статический сайт для ООО «Меркатор Калуга». Публикуется в [solid-dxf-demo](https://github.com/AlexPror/solid-dxf-demo).

Интерактивный калькулятор окупаемости в `index.html` закомментирован (`CALCULATOR_HIDDEN`) — на публичной версии только замеры и блок «Стоимость vs рынок». Калькулятор остаётся в исходниках для локального использования.

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
