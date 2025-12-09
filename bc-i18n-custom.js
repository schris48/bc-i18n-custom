/*! bc-i18n-custom.js | Localization overrides + browser-language auto-select + caption-label localization */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['video.js'], function (videojs) { return factory(videojs); });
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('video.js'));
  } else {
    root.bcI18nCustom = factory(root.videojs);
  }
}(this, function (videojs) {
  'use strict';
  if (!videojs) { return; }

  // ---------------------------------------------------------------------------
  // 1) Language packs (override Video.js core + add custom transcript labels)
  // ---------------------------------------------------------------------------
  videojs.addLanguage('de', {
    "Play": "Wiedergabe",
    "Pause": "Pause",
    "Replay": "Erneut abspielen",
    "Mute": "Stumm",
    "Unmute": "Ton an",
    "Volume Level": "Lautstärke",
    "Fullscreen": "Vollbild",
    "Exit Fullscreen": "Vollbild beenden",
    "Captions": "Untertitel",
    "captions settings": "Untertitel‑Einstellungen",
    "captions off": "Untertitel aus",
    "Display Transcript": "Transkript anzeigen",
    "Hide Transcript": "Transkript ausblenden"
  });

  videojs.addLanguage('fr', {
    "Play": "Lecture",
    "Pause": "Pause",
    "Replay": "Rejouer",
    "Mute": "Muet",
    "Unmute": "Son activé",
    "Volume Level": "Niveau sonore",
    "Fullscreen": "Plein écran",
    "Exit Fullscreen": "Quitter le plein écran",
    "Captions": "Sous-titres",
    "captions settings": "Paramètres des sous‑titres",
    "captions off": "Sous‑titres désactivés",
    "Display Transcript": "Afficher la transcription",
    "Hide Transcript": "Masquer la transcription"
  });

  videojs.addLanguage('es', {
    "Play": "Reproducir",
    "Pause": "Pausa",
    "Replay": "Repetir",
    "Mute": "Silencio",
    "Unmute": "Activar sonido",
    "Volume Level": "Nivel de volumen",
    "Fullscreen": "Pantalla completa",
    "Exit Fullscreen": "Salir de pantalla completa",
    "Captions": "Subtítulos",
    "captions settings": "Configuración de subtítulos",
    "captions off": "Subtítulos desactivados",
    "Display Transcript": "Mostrar transcripción",
    "Hide Transcript": "Ocultar transcripción"
  });

  videojs.addLanguage('ja', {
    "Play": "再生",
    "Pause": "一時停止",
    "Replay": "もう一度再生",
    "Mute": "ミュート",
    "Unmute": "ミュート解除",
    "Volume Level": "音量レベル",
    "Fullscreen": "全画面表示",
    "Exit Fullscreen": "全画面終了",
    "Captions": "字幕",
    "captions settings": "字幕設定",
    "captions off": "字幕オフ",
    "Display Transcript": "トランスクリプトを表示",
    "Hide Transcript": "トランスクリプトを隠す"
  });

  // ---------------------------------------------------------------------------
  // 2) Plugin: detect browser language, set the player language with fallback
  // ---------------------------------------------------------------------------
  var PLUGIN_NAME = 'bcI18nOverride';
  var register = videojs.registerPlugin || videojs.plugin;
  if (!register) { return; }

  function getBrowserLocales() {
    var list = [];
    if (Array.isArray(navigator.languages) && navigator.languages.length) {
      list = navigator.languages.slice(0);
    } else if (navigator.language) {
      list = [navigator.language];
    } else if (navigator.userLanguage) {
      list = [navigator.userLanguage];
    }
    return list.map(function (l) { return String(l).replace('_', '-').toLowerCase(); });
  }

  function expandLocaleCandidates(locale) {
    var parts = String(locale || '').split('-');
    if (!parts.length) return [];
    var candidates = [];
    candidates.push(parts.join('-'));
    while (parts.length > 1) {
      parts.pop();
      candidates.push(parts.join('-'));
    }
    return candidates;
  }

  function resolveSupportedLocale(supportedSet, locales) {
    for (var i = 0; i < locales.length; i++) {
      var loc = locales[i];
      var candidates = expandLocaleCandidates(loc);
      for (var j = 0; j < candidates.length; j++) {
        var c = candidates[j];
        if (supportedSet.has(c)) return c;
        var base = c.split('-')[0];
        if (supportedSet.has(base)) return base;
      }
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // 3) Localize caption/subtitle track labels
  // ---------------------------------------------------------------------------
  // Fallback names if Intl.DisplayNames isn't available
  var LANG_NAMES = {
    en: { en:'English', fr:'French', de:'German', es:'Spanish', ja:'Japanese' },
    de: { en:'Englisch', fr:'Französisch', de:'Deutsch', es:'Spanisch', ja:'Japanisch' },
    fr: { en:'Anglais', fr:'Français', de:'Allemand', es:'Espagnol', ja:'Japonais' },
    es: { en:'Inglés', fr:'Francés', de:'Alemán', es:'Español', ja:'Japonés' },
    ja: { en:'英語', fr:'フランス語', de:'ドイツ語', es:'スペイン語', ja:'日本語' }
  };

  function getUiLang(player, fallback) {
    var lang = (typeof player.language === 'function') ? player.language() : fallback || 'en';
    return String(lang || fallback || 'en').toLowerCase();
  }

  function resolveLanguageName(code, uiLang) {
    if (!code) return null;
    var base = String(code).toLowerCase().split('-')[0];

    // Prefer Intl.DisplayNames if available
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      try {
        var dn = new Intl.DisplayNames([uiLang], { type: 'language' });
        var n = dn.of(base);
        if (n) return n;
      } catch (e) { /* ignore */ }
    }

    // Fallback to our small dictionary
    var dict = LANG_NAMES[uiLang] || LANG_NAMES.en;
    return dict[base] || null;
  }

  function buildTrackLabelMap(player) {
    var map = {};
    var uiLang = getUiLang(player, 'en');
    var list = player.textTracks();
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (t && (t.kind === 'captions' || t.kind === 'subtitles')) {
        var code = (t.language || t.lang || '').toLowerCase();
        var localized = resolveLanguageName(code, uiLang);
        if (localized) {
          var originalLabel = String(t.label || code || '').trim();
          map[originalLabel] = localized;
        }
      }
    }
    return map;
  }

  function localizeTrackObjects(player) {
    var uiLang = getUiLang(player, 'en');
    var list = player.textTracks();
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (t && (t.kind === 'captions' || t.kind === 'subtitles')) {
        var code = (t.language || t.lang || '').toLowerCase();
        var localized = resolveLanguageName(code, uiLang);
        if (localized) {
          try { t.label = localized; } catch (e) { /* some UAs make .label read-only */ }
        }
      }
    }
  }

  function localizeCaptionMenuDom(player, map) {
    var root = player && player.el();
    if (!root || !map) return;
    // Works across Brightcove variants: captions button or combined subs-caps
    var items = root.querySelectorAll(
      '.vjs-captions-button .vjs-menu-item .vjs-menu-item-text, ' +
      '.vjs-subs-caps-button .vjs-menu-item .vjs-menu-item-text'
    );
    if (!items || !items.length) return;
    for (var k = 0; k < items.length; k++) {
      var span = items[k];
      var current = (span.textContent || '').trim();
      if (map[current]) {
        span.textContent = map[current];
      }
    }
  }

  function updateCaptionLabels(player, cfg) {
    try { localizeTrackObjects(player); }
    catch (e) { if (cfg && cfg.debug) console.warn('[bcI18nOverride] label object update failed', e); }

    try {
      var map = buildTrackLabelMap(player);
      localizeCaptionMenuDom(player, map);
    } catch (e) {
      if (cfg && cfg.debug) console.warn('[bcI18nOverride] menu DOM update failed', e);
    }
  }

  // ---------------------------------------------------------------------------
  // 4) Register plugin and wire events
  // ---------------------------------------------------------------------------
  register.call(videojs, PLUGIN_NAME, function pluginFn(options) {
    var player = this;
    var defaults = {
      supported: ['fr', 'es', 'de', 'ja'],
      fallback: 'en',
      debug: true
    };
    var cfg = Object.assign({}, defaults, options || {});
    var supportedSet = new Set(cfg.supported.map(function (s) { return String(s).toLowerCase(); }));
    var fallback = String(cfg.fallback || 'en').toLowerCase();

    player.ready(function () {
      try {
        // Set/keep player language
        var current = (typeof player.language === 'function') ? player.language() : null;
        if (current) {
          if (cfg.debug) console.info('[bcI18nOverride] keeping existing language:', current);
        } else {
          var browserLocales = getBrowserLocales();
          var best = resolveSupportedLocale(supportedSet, browserLocales);
          var chosen = best || fallback;
          if (cfg.debug) console.info('[bcI18nOverride] browserLocales=', browserLocales, 'chosen=', chosen);
          if (typeof player.language === 'function') {
            player.language(chosen);
          }
        }

        // Inject our dictionary for the chosen language (to support custom keys)
        var lang = getUiLang(player, fallback);
        var dict = videojs.options.languages[lang] || videojs.options.languages[lang.split('-')[0]];
        if (dict) {
          player.options_.languages = player.options_.languages || {};
          player.options_.languages[lang] = Object.assign({}, player.options_.languages[lang] || {}, dict);
          if (cfg.debug) console.info('[bcI18nOverride] injected dict for', lang, dict);
        }

        // Trigger languagechange so dependent components refresh
        player.trigger('languagechange');

        // Transcript button labels (custom)
        function updateTranscriptLabels() {
          var btn = document.querySelector('.vjs-transcript-control .vjs-control-text');
          if (btn) btn.textContent = player.localize('Display Transcript');
          var hideBtn = document.querySelector('.bcRtnButton');
          if (hideBtn) hideBtn.textContent = player.localize('Hide Transcript');
        }

        // Update on language change
        player.on('languagechange', function () {
          updateTranscriptLabels();
          updateCaptionLabels(player, cfg);
        });

        // Update after metadata (tracks available)
        player.on('loadedmetadata', function () {
          updateTranscriptLabels();
          updateCaptionLabels(player, cfg);
        });

        // Update on text track changes (selection/availability)
        player.on('texttrackchange', function () {
          updateCaptionLabels(player, cfg);
        });

        // Update when menus open (captions/transcript)
        document.addEventListener('click', function (e) {
          var btn = e.target.closest('.vjs-captions-button, .vjs-subs-caps-button, .vjs-transcript-control');
          if (btn) {
            setTimeout(function () {
              updateTranscriptLabels();
              updateCaptionLabels(player, cfg);
            }, 100);
          }
        });

        // Fallback: observe DOM for late injection
        var observer = new MutationObserver(function () {
          updateTranscriptLabels();
          updateCaptionLabels(player, cfg);
        });
        observer.observe(document.body, { childList: true, subtree: true });

      } catch (e) {
        console.warn('[bcI18nOverride] error applying language', e);
      }
    });
  });

  return { name: PLUGIN_NAME, version: '1.3.0' };
}));
