/*! bc-i18n-custom.js | TVO Media Education Group | Localization overrides for Video.js core + custom labels
   Notes:
   - Loads as a "Custom plugin URL" in Brightcove Studio (place *after* other plugins).
   - Registers a plugin `bcI18nOverride` that applies language after player + plugins initialize.
   - Preserves per-embed `?language=xx` while allowing you to set a player-level default in Studio JSON.
*/
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['video.js'], function (videojs) { return factory(videojs); });
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('video.js'));
  } else {
    // Browser global
    root.bcI18nCustom = factory(root.videojs);
  }
}(this, function (videojs) {
  'use strict';

  // Abort early if Video.js is not available yet
  if (!videojs) { return; }

  // --- 1) Define/override language packs -------------------------------

  // German
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

  // French
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

  // Spanish
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

  // Japanese
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

  // --- 2) Register a tiny plugin that applies language at the right time ----

  // Plugin name used in Studio JSON
  var PLUGIN_NAME = 'bcI18nOverride';

  // Guard for both registerPlugin (v7+) and plugin() (very old v5/6)
  var register = videojs.registerPlugin || videojs.plugin;
  if (!register) { return; }

  register.call(videojs, PLUGIN_NAME, function pluginFn(options) {
    var player = this;

    // Options you might set in Studio JSON later if required
    var defaults = {
      // If you want a fallback default here (usually leave null so Studio JSON or ?language wins)
      defaultLanguage: null   // e.g., "de" if you want the plugin to force a fallback
    };
    var cfg = Object.assign({}, defaults, options || {});

    // Apply language after the player + plugins are ready
    player.ready(function onReady() {
      try {
        // If Brightcove/Video.js already established a language (Studio "language" or ?language=xx), keep it.
        var currentLang = (typeof player.language === 'function') ? player.language() : null;

        if (!currentLang && cfg.defaultLanguage) {
          player.language(cfg.defaultLanguage);
        }

        // Nothing else to do; strings defined above are now the active translations.
        // If you need to adjust *after* fullscreen/PiP plugin init, you can defer to the next tick:
        // setTimeout(function(){ player.trigger('languagechange'); }, 0);

      } catch (e) {
        // Fail silently; localization should not break playback
        // console.warn('[bcI18nOverride] error applying language', e);
      }
    });

    // Optional: If your transcript control toggles label text at runtime and listens for `languagechange`,
    // it will re-pull `player.localize('Display Transcript')`. If not, you can force a refresh by:
    // player.on('bc-transcript-toggle', () => player.trigger('languagechange'));
  });

  // Return a tiny API in case someone wants to inspect from console
  return {
    name: PLUGIN_NAME,
    version: '1.0.0'
  };
}));
