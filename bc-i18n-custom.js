/*! bc-i18n-custom.js | Safe localization + auto-select + caption label localization */
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
  if (!videojs) return;

  // -------------------------------
  // 1) Language packs (strings only)
  // -------------------------------
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

  // -----------------------------------------------
  // 2) Plugin registration and browser language pick
  // -----------------------------------------------
  var PLUGIN_NAME = 'bcI18nOverride';
  var register = videojs.registerPlugin || videojs.plugin;
  if (!register) return;

  function getBrowserLocales() {
    var list = [];
    try {
      if (Array.isArray(navigator.languages) && navigator.languages.length) {
        list = navigator.languages.slice(0);
      } else if (navigator.language) {
        list = [navigator.language];
      } else if (navigator.userLanguage) {
        list = [navigator.userLanguage];
      }
    } catch (e) { /* ignore */ }
    return list.map(function (l) { return String(l).replace('_', '-').toLowerCase(); });
  }

  function expandLocaleCandidates(locale) {
    var parts = String(locale || '').split('-');
    if (!parts.length) return [];
    var out = [parts.join('-')];
    while (parts.length > 1) { parts.pop(); out.push(parts.join('-')); }
    return out;
  }

  function resolveSupportedLocale(supportedSet, locales) {
    for (var i = 0; i < locales.length; i++) {
      var loc = locales[i];
      var candidates = expandLocaleCandidates(loc);
      for (var j = 0; j < candidates.length; j++) {
        var c = candidates[j], base = c.split('-')[0];
        if (supportedSet.has(c)) return c;
        if (supportedSet.has(base)) return base;
      }
    }
    return null;
  }

  // ---------------------------------------------
  // 3) Caption label localization (safe + DOM‑only)
  // ---------------------------------------------
  var LANG_NAMES = {
    en: { en:'English', fr:'French', de:'German', es:'Spanish', ja:'Japanese' },
    de: { en:'Englisch', fr:'Französisch', de:'Deutsch', es:'Spanisch', ja:'Japanisch' },
    fr: { en:'Anglais', fr:'Français', de:'Allemand', es:'Espagnol', ja:'Japonais' },
    es: { en:'Inglés', fr:'Francés', de:'Alemán', es:'Español', ja:'Japonés' },
    ja: { en:'英語', fr:'フランス語', de:'ドイツ語', es:'スペイン語', ja:'日本語' }
  };

  function getUiLang(player, fallback) {
    try {
      var langFn = player && player.language;
      var lang = (typeof langFn === 'function') ? langFn.call(player) : null;
      return String(lang || fallback || 'en').toLowerCase();
    } catch (e) { return String(fallback || 'en'); }
  }

  function resolveLanguageName(code, uiLang) {
    if (!code) return null;
    var base = String(code).toLowerCase().split('-')[0];

    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      try {
        var dn = new Intl.DisplayNames([uiLang], { type: 'language' });
        var name = dn.of(base);
        if (name) return name;
      } catch (e) { /* ignore */ }
    }

    var dict = LANG_NAMES[uiLang] || LANG_NAMES.en;
    return dict[base] || null;
  }

  function buildTrackLabelMap(player) {
    var map = {};
    var uiLang = getUiLang(player, 'en');
    var list;
    try { list = player.textTracks(); } catch (e) { list = []; }
    if (!list || !list.length) return map;

    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      if (!t || !(t.kind === 'captions' || t.kind === 'subtitles')) continue;
      var code = (t.language || t.lang || '').toLowerCase();
      var localized = resolveLanguageName(code, uiLang);
      if (!localized) continue;
      // Use the existing label text if present; otherwise fallback to the code
      var originalLabel = String((t.label || '').trim() || code || '').trim();
      if (originalLabel) map[originalLabel] = localized;
    }
    return map;
  }

  function localizeCaptionMenuDom(player) {
    var map = buildTrackLabelMap(player);
    if (!map || !Object.keys(map).length) return;

    var root = player && player.el && player.el();
    if (!root) return;

    // Support both buttons across Brightcove variants
    var items = root.querySelectorAll(
      '.vjs-captions-button .vjs-menu-item .vjs-menu-item-text, ' +
      '.vjs-subs-caps-button .vjs-menu-item .vjs-menu-item-text'
    );
    if (!items || !items.length) return;

    for (var k = 0; k < items.length; k++) {
      var span = items[k];
      var current = (span.textContent || '').trim();
      var localized = map[current];
      if (localized) span.textContent = localized;
    }
  }

  function updateTranscriptLabels(player) {
    try {
      var btn = document.querySelector('.vjs-transcript-control .vjs-control-text');
      if (btn) btn.textContent = player.localize('Display Transcript');
      var hideBtn = document.querySelector('.bcRtnButton');
      if (hideBtn) hideBtn.textContent = player.localize('Hide Transcript');
    } catch (e) { /* ignore */ }
  }

  // ---------------------------------------
  // 4) Register plugin with defensive hooks
  // ---------------------------------------
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
        // 1) Choose/keep player language safely
        var currentLang = (typeof player.language === 'function') ? player.language() : null;
        if (!currentLang) {
          var browserLocales = getBrowserLocales();
          var best = resolveSupportedLocale(supportedSet, browserLocales);
          var chosen = best || fallback;
          if (cfg.debug) console.info('[bcI18nOverride] language chosen=', chosen, 'browserLocales=', browserLocales);
          if (typeof player.language === 'function') player.language(chosen);
        } else if (cfg.debug) {
          console.info('[bcI18nOverride] keeping existing language:', currentLang);
        }

        // 2) Merge our dictionary into player options (do NOT overwrite core)
        try {
          var uiLang = getUiLang(player, fallback);
          var dict = videojs.options && (videojs.options.languages[uiLang] || videojs.options.languages[uiLang.split('-')[0]]);
          if (dict) {
            player.options_ = player.options_ || {};
            player.options_.languages = player.options_.languages || {};
            var existing = player.options_.languages[uiLang] || {};
            player.options_.languages[uiLang] = Object.assign({}, existing, dict);
            if (cfg.debug) console.info('[bcI18nOverride] injected dict for', uiLang);
          }
        } catch (e) {
          if (cfg.debug) console.warn('[bcI18nOverride] dictionary injection skipped:', e);
        }

        // 3) Only trigger languagechange if we set language just now
        if (!currentLang && typeof player.trigger === 'function') {
          player.trigger('languagechange');
        }

        // 4) Wire events AFTER metadata to avoid empty track list
        player.on('loadedmetadata', function () {
          updateTranscriptLabels(player);
          localizeCaptionMenuDom(player);
        });

        // 5) Refresh on language & track changes
        player.on('languagechange', function () {
          updateTranscriptLabels(player);
          localizeCaptionMenuDom(player);
        });
        player.on('texttrackchange', function () {
          localizeCaptionMenuDom(player);
        });

        // 6) Patch labels when the menu is opened (variant-safe)
        player.el().addEventListener('click', function (e) {
          var btn = e.target.closest('.vjs-captions-button, .vjs-subs-caps-button, .vjs-transcript-control');
          if (btn) setTimeout(function () {
            updateTranscriptLabels(player);
            localizeCaptionMenuDom(player);
          }, 100);
        });

        // 7) Conservative MutationObserver: only on player subtree
        try {
          var root = player.el();
          if (root && typeof MutationObserver !== 'undefined') {
            var observer = new MutationObserver(function () {
              // Avoid heavy work: only try if tracks exist
              var tracks = player.textTracks && player.textTracks();
              if (tracks && tracks.length) {
                updateTranscriptLabels(player);
                localizeCaptionMenuDom(player);
              }
            });
            observer.observe(root, { childList: true, subtree: true });
          }
        } catch (e) { /* ignore */ }

      } catch (e) {
        console.warn('[bcI18nOverride] error initializing plugin', e);
      }
    });
  });

  return { name: PLUGIN_NAME, version: '1.3.1-safe' };
}));
