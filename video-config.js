// Демо-видео на сайте: встроенный HTML5-плеер (без скачивания).
// Файл video/demo.mp4 лежит в репозитории сайта (сжатая копия для просмотра в браузере).
//
// Резерв: Яндекс.Диск (iframeSrc) или Google Диск — только если нет localUrl.
// Google Диск для больших файлов (>100 МБ) в iframe часто предлагает скачать, не смотреть.
//
window.DOCS_DEMO_VIDEO = {
  localUrl: 'video/demo.mp4',

  title: 'Демонстрация работы плагина',

  // Резервные ссылки (не используются, пока есть localUrl)
  iframeSrc: '',
  openUrl: 'https://drive.google.com/file/d/1Y9bO5Sm-cswuYXLe8kFIHmBX6bnbantT/view?usp=drive_link',
  googleFileId: '1Y9bO5Sm-cswuYXLe8kFIHmBX6bnbantT',
  folderUrl: 'https://drive.google.com/drive/folders/1cWg8UbrYCM7EadFriPQUVjbCSGEk-vee?usp=sharing'
};
