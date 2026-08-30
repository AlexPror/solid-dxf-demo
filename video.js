(function () {
  'use strict';

  function mountVideo() {
    var root = document.getElementById('videoMount');
    if (!root) return;

    var cfg = window.DOCS_DEMO_VIDEO || {};
    var resolved = resolveVideoSources(cfg);
    var iframeSrc = resolved.iframeSrc;
    var openUrl = resolved.openUrl;
    var mp4Url = resolved.mp4Url;
    var title = cfg.title || 'Демонстрация плагина';
    var openLabel = (cfg.openLabel || '').trim() || openLinkLabel(openUrl, cfg.folderUrl);

    root.innerHTML = '';

    if (iframeSrc) {
      var frameWrap = document.createElement('div');
      frameWrap.className = 'video-embed';
      var iframe = document.createElement('iframe');
      iframe.src = iframeSrc;
      iframe.title = title;
      iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
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
      video.setAttribute('controlsList', 'nodownload');
      root.appendChild(video);
    } else {
      var placeholder = document.createElement('div');
      placeholder.className = 'video-placeholder';
      placeholder.setAttribute('aria-label', 'Видео будет добавлено');
      placeholder.innerHTML = '<span>▶</span>';
      var linkUrl = openUrl || (cfg.folderUrl || '').trim();
      if (linkUrl) {
        var link = document.createElement('a');
        link.className = 'video-open-link';
        link.href = linkUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = openLabel;
        placeholder.appendChild(link);
      }
      root.appendChild(placeholder);
    }

    var fallbackUrl = openUrl || (cfg.folderUrl || '').trim();
    if (fallbackUrl && iframeSrc) {
      var ext = document.createElement('p');
      ext.className = 'video-external';
      ext.innerHTML = 'Если плеер не открылся: <a href="' + escapeAttr(fallbackUrl) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(openLabel) + '</a>.';
      root.appendChild(ext);
    }
  }

  function googleFileIdFromUrl(url) {
    if (!url) return '';
    var match = String(url).match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
    return match ? match[1] : '';
  }

  function resolveVideoSources(cfg) {
    var iframeSrc = (cfg.iframeSrc || '').trim();
    var openUrl = (cfg.openUrl || '').trim();
    var mp4Url = (cfg.localUrl || cfg.mp4Url || '').trim();
    var fileId = (cfg.googleFileId || '').trim() || googleFileIdFromUrl(openUrl);

    // Встроенный плеер на сайте — приоритет (без Google Drive iframe)
    if (mp4Url) {
      return { iframeSrc: '', openUrl: openUrl, mp4Url: mp4Url };
    }

    if (!iframeSrc && fileId) {
      iframeSrc = 'https://drive.google.com/file/d/' + fileId + '/preview';
    }
    if (!openUrl && fileId) {
      openUrl = 'https://drive.google.com/file/d/' + fileId + '/view';
    }

    return { iframeSrc: iframeSrc, openUrl: openUrl, mp4Url: '' };
  }

  function openLinkLabel(url, folderUrl) {
    if (googleFileIdFromUrl(url)) {
      return 'Открыть видео на Google Диске';
    }
    if (/drive\.google\.com\/drive\/folders/i.test(url || folderUrl)) {
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
