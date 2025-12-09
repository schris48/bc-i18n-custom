/*! bc-i18n-custom.js | Brightcove/Video.js i18n + caption label localization (global-only, safe) */
(function (videojs) {
  'use strict';
  if (!videojs || (!videojs.registerPlugin && !videojs.plugin)) {
    console && console.warn && console.warn('[bc-i18n] videojs not ready; plugin skipped');
    return;
  }

  // ---------------------------------------------------------------------------
  // 1) Language packs (override UI strings you care about)
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
  // 2) Utilities
  // ---------------------------------------------------------------------------
  var register = videojs.registerPlugin || videojs.plugin;

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
    } catch (e) {}
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

  function getUiLang(player, fallback) {
    try {
      var langFn = player && player.language;
      var lang = (typeof langFn === 'function') ? langFn.call(player) : null;
      return String(lang || fallback || 'en').toLowerCase();
    } catch (e) { return String(fallback || 'en'); }
  }

  // `Intl.DisplayNames` preferred for live language names; fallback keeps your 5 languages covered
  var LANG_NAMES = {
    en: { en:'English', fr:'French', de:'German', es:'Spanish', ja:'Japanese' },
    de: { en:'Englisch', fr:'Französisch', de:'Deutsch', es:'Spanisch', ja:'Japanisch' },
    fr: { en:'Anglais', fr:'Français', de:'Allemand', es:'Espagnol', ja:'Japonais' },
    es: { en:'Inglés', fr:'Francés', de:'Alemán', es:'Español', ja:'Japonés' },
    ja: { en:'英語', fr:'フランス語', de:'ドイツ語', es:'スペイン語', ja:'日本語' }
  };

  function resolveLanguageName(code, uiLang) {
    if (!code) return null;
    var base = String(code).toLowerCase().split('-')[0];

    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      try {
        var dn = new Intl.DisplayNames([uiLang], { type: 'language' });
        var name = dn.of(base);
        if (name) return name;
      } catch (e) {}
    }

    var dict = LANG_NAMES[uiLang] || LANG_NAMES.en;
    return dict[base] || null;
  }

  // Build a map from the *current* track labels to localized names (using srclang)
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

      var originalLabel = String((t.label || '').trim() || code || '').trim();
      if (originalLabel) map[originalLabel] = localized;
    }
    return map;
  }

  // Replace visible menu item text
  function localizeCaptionMenuDom(player) {
    var map = buildTrackLabelMap(player);
    if (!map || !Object.keys(map).length) return;

    var root = player && player.el && player.el();
    if (!root) return;

    // Your snippet shows `.vjs-subs-caps-button`; support both common variants
    var items = root.querySelectorAll(
      '.vjs-subs-caps-button .vjs-menu-item[role="menuitemradio"] .vjs-menu-item-text, ' +
      '.vjs-captions-button .vjs-menu-item[role="menuitemradio"] .vjs-menu-item-text'
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
    } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // 3) The plugin
  // ---------------------------------------------------------------------------
  var PLUGIN_NAME = 'bcI18nOverride';

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

    // Avoid double-binding
    if (player.bcI18nBound) return;
    player.bcI18nBound = true;

    player.ready(function () {
      try {
        // A) Choose player UI language (without touching player.options_)
        var currentLang = (typeof player.language === 'function') ? player.language() : null;
        if (!currentLang) {
          var browserLocales = getBrowserLocales();
          var best = resolveSupportedLocale(supportedSet, browserLocales);
          var chosen = best || fallback;
          if (cfg.debug && console && console.info) {
            console.info('[bc-i18n] language=', chosen, 'browserLocales=', browserLocales);
          }
          if (typeof player.language === 'function') player.language(chosen);
          // Only trigger if we set it now
          if (typeof player.trigger === 'function') player.trigger('languagechange');
        } else if (cfg.debug && console && console.info) {
          console.info('[bc-i18n] keeping language=', currentLang);
        }

        // B) Wire events—only after metadata is available (tracks exist)
        player.on('loadedmetadata', function () {
          updateTranscriptLabels(player);
          localizeCaptionMenuDom(player);
        });

        player.on('languagechange', function () {
          updateTranscriptLabels(player);
          localizeCaptionMenuDom(player);
        });

        player.on('texttrackchange', function () {
          localizeCaptionMenuDom(player);
        });

        // C) Update when captions menu opens (aligns with your HTML structure)
        var root = player.el();
        if (root) {
          root.addEventListener('click', function (e) {
            var btn = e.target && e.target.closest &&
                      e.target.closest('.vjs-subs-caps-button, .vjs-captions-button, .vjs-transcript-control');
            if (btn) {
              // Defer to let menu render
              window.requestAnimationFrame(function () {
                updateTranscriptLabels(player);
                localizeCaptionMenuDom(player);
              });
            }
          }, true);
        }

        // Note: No MutationObserver (to avoid potential perf regressions)
        // Note: We do NOT write to TextTrack.label (may be read-only in some UAs)
        // Note: We do NOT touch player.options_ (reduces risk of i18n/control issues)

      } catch (e) {
        console && console.warn && console.warn('[bc-i18n] init error', e);
      }
    });
  });

})(window.videojs);
