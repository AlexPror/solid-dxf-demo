# Презентация «Пакет в цех» (Docs v1)

Статический сайт для ООО «Меркатор Калуга».

**Сайт:** [https://alexpror.github.io/solid-dxf-demo/](https://alexpror.github.io/solid-dxf-demo/)  
**Репозиторий:** [solid-dxf-demo](https://github.com/AlexPror/solid-dxf-demo)

Публичная версия: **v1.9** — шапка с контактами (телефон, почта), логичный порядок секций, минималистичный блок «Контакт».

Интерактивный калькулятор окупаемости в `index.html` закомментирован (`CALCULATOR_HIDDEN`) — на публичной версии только замеры и блок стоимости. Калькулятор остаётся в исходниках для локального использования.

## Локальный просмотр

Откройте `index.html` в браузере или:

```powershell
cd docs/site
python -m http.server 8080
```

## Видео (Яндекс.Диск, без YouTube)

Для гендиректора удобнее **Яндекс.Диск** — открывается в РФ без VPN. YouTube на сайте не используем.

1. Запишите экран (mp4, желательно до 500 МБ для быстрой загрузки).
2. Загрузите на [disk.yandex.ru](https://disk.yandex.ru).
3. ПКМ по файлу → **Поделиться** → включите публичный доступ → скопируйте ссылку (`disk.yandex.ru/i/…` или `yadi.sk/i/…`).
4. Если в меню есть **«Встроить» / HTML-код** — скопируйте `src` из `<iframe …>`.
5. Вставьте в `video-config.js`:
   - `iframeSrc` — адрес из iframe (плеер прямо на сайте), и/или
   - `openUrl` — публичная ссылка (кнопка «Смотреть на Яндекс.Диске» + запасной вариант).

Пример:

```javascript
window.DOCS_DEMO_VIDEO = {
  iframeSrc: 'https://disk.yandex.ru/iframe/…',
  openUrl: 'https://disk.yandex.ru/i/XXXXXXXX',
  mp4Url: '',
  title: 'Запись: Excel → проверка → лазер → PDF'
};
```

Только `openUrl` без iframe — тоже нормально: на сайте будет кнопка, видео откроется на Яндексе.

## Публикация

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/publish-demo-site.ps1
```
