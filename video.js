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
    var openLabel = (cfg.openLabel || '').trim() || openLinkLabel(openUrl);

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
      placeholder.innerHTML = '<span>▶</span>';
      if (openUrl) {
        var link = document.createElement('a');
        link.className = 'video-open-link';
        link.href = openUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = openLabel;
        placeholder.appendChild(link);
      }
      root.appendChild(placeholder);
    }

    if (openUrl && iframeSrc) {
      var ext = document.createElement('p');
      ext.className = 'video-external';
      ext.innerHTML = 'Если плеер не открылся: <a href="' + escapeAttr(openUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(openLabel) + '</a>.';
      root.appendChild(ext);
    }
  }

  function openLinkLabel(url) {
    if (/drive\.google\.com\/drive\/folders/i.test(url)) {
      return 'Открыть папку с видео на Google Диске';
    }
    if (/drive\.google\.com/i.test(url)) {
      return 'Открыть видео на Google Диске';
    }
    if (/yandex\.(ru|com)|yadi\.sk/i.test(url)) {
      return 'Смотреть на Яндекс.Диске';
    }
    return 'Смотреть видео';
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
