// Демо-видео: Google Диск / Яндекс.Диск (YouTube не используем).
//
// Чтобы видео играло прямо на сайте:
// 1. В папке Google Диска откройте «Демонстрация работы плагина.mp4»
// 2. Поделиться → «Все, у кого есть ссылка» → скопируйте ссылку на ФАЙЛ
//    (вид: https://drive.google.com/file/d/XXXXXXXX/view?usp=sharing)
// 3. Вставьте её в openUrl ниже (или только ID файла в googleFileId)
//
window.DOCS_DEMO_VIDEO = {
  // Ссылка на файл mp4 (не на папку) — из неё автоматически строится плеер
  openUrl: '',

  // Можно указать только ID между /d/ и /view:
  googleFileId: '',

  // Явный iframe (обычно не нужен — соберётся из openUrl / googleFileId)
  iframeSrc: '',

  // Запасная ссылка на папку, если файл ещё не настроен
  folderUrl: 'https://drive.google.com/drive/folders/1cWg8UbrYCM7EadFriPQUVjbCSGEk-vee?usp=sharing',

  openLabel: 'Открыть папку с видео на Google Диске',

  mp4Url: '',

  title: 'Демонстрация работы плагина'
};
