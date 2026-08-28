(function () {
  'use strict';

  function mountVideo() {
    var root = document.getElementById('videoMount');
    if (!root) return;

    var cfg = window.DOCS_DEMO_VIDEO || {};
    var iframeSrc = (cfg.iframeSrc || '').trim();
    var openUrl = (cfg.openUrl || '').trim();
    var mp4Url = (cfg.mp4Url || '').trim();
    var title = cfg.title || 'Демонстрация плагина';

    root.innerHTML = '';

    if (iframeSrc) {
      var frameWrap = document.createElement('div');
      frameWrap.className = 'video-embed';
      var iframe = document.createElement('iframe');
      iframe.src = iframeSrc;
      iframe.title = title;
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('loading', 'lazy');
      frameWrap.appendChild(iframe);
      root.appendChild(frameWrap);
    } else if (mp4Url) {
      var video = document.createElement('video');
      video.className = 'video-native';
      video.controls = true;
      video.preload = 'metadata';
      video.src = mp4Url;
      video.setAttribute('playsinline', '');
      root.appendChild(video);
    } else {
      var placeholder = document.createElement('div');
      placeholder.className = 'video-placeholder';
      placeholder.setAttribute('aria-label', 'Видео будет добавлено');
      placeholder.innerHTML = '<span>▶</span><p>' + escapeHtml(title) + '</p>';
      if (openUrl) {
        var link = document.createElement('a');
        link.className = 'video-open-link';
        link.href = openUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'Смотреть на Яндекс.Диске';
        placeholder.appendChild(link);
      } else {
        var hint = document.createElement('p');
        hint.className = 'video-placeholder-hint';
        hint.textContent = 'После записи — ссылка с Яндекс.Диска (без YouTube, VPN не нужен).';
        placeholder.appendChild(hint);
      }
      root.appendChild(placeholder);
    }

    if (openUrl && iframeSrc) {
      var ext = document.createElement('p');
      ext.className = 'video-external';
      ext.innerHTML = 'Если плеер не открылся: <a href="' + escapeAttr(openUrl) + '" target="_blank" rel="noopener noreferrer">открыть на Яндекс.Диске</a>.';
      root.appendChild(ext);
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountVideo);
  } else {
    mountVideo();
  }
})();
