/*! bc-i18n-custom.js | Localization overrides + browser-language auto-select */
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

  register.call(videojs, PLUGIN_NAME, function pluginFn(options) {
    var player = this;
    var defaults = {
      supported: ['fr', 'es', 'de', 'ja'],
      fallback: 'en',
      debug: true // ✅ Turn on debug for troubleshooting
    };
    var cfg = Object.assign({}, defaults, options || {});
    var supportedSet = new Set(cfg.supported.map(function (s) { return String(s).toLowerCase(); }));
    var fallback = String(cfg.fallback || 'en').toLowerCase();

    player.ready(function () {
      try {
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

        // ✅ Inject dictionary into player options for custom keys
        var lang = player.language();
        var dict = videojs.options.languages[lang] || videojs.options.languages[lang.split('-')[0]];
        if (dict) {
          player.options_.languages = player.options_.languages || {};
          player.options_.languages[lang] = Object.assign({}, player.options_.languages[lang] || {}, dict);
          if (cfg.debug) console.info('[bcI18nOverride] injected dict for', lang, dict);
        }

        // ✅ Trigger languagechange
        player.trigger('languagechange');
      } catch (e) {
        console.warn('[bcI18nOverride] error applying language', e);
      }
    });
  });

  return { name: PLUGIN_NAME, version: '1.2.0' };
});
