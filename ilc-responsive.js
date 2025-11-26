
/* ilc-responsive.js
   - Creates a transcript toggle button and overlay.
   - Robust i18n: resolves labels from player/global dictionaries with base-language fallback.
   - Updates on languagechange and player ready.
*/

videojs.registerPlugin('ilcResponsivePlugin', function() {
  var ilcVideoPlayer = this;

  // Remove picture-in-picture button (if present)
  var pip_control = ilcVideoPlayer.el().getElementsByClassName("vjs-picture-in-picture-control")[0];
  if (pip_control && pip_control.parentNode) {
    pip_control.parentNode.removeChild(pip_control);
  }

  // Custom elements (declared up-front so updater can access them)
  var bcTxtButton, bcSpanText, bcRtnButton, bcTextContainer, bcTextContent;

  // ---- i18n helpers ---------------------------------------------------------

  function getCurrentLang() {
    // Returns normalized current language, e.g. "fr-ca" or "fr"
    var lang = (typeof ilcVideoPlayer.language === 'function') ? ilcVideoPlayer.language() : 'en';
    return String(lang || 'en').toLowerCase();
  }

  function getBaseLang(lang) {
    // "fr-ca" -> "fr"
    lang = String(lang || '').toLowerCase();
    return lang.split('-')[0] || lang;
  }

  function getLanguageDict(lang) {
    // Try player-level languages first, then fall back to global videojs languages
    var playerLangs = (ilcVideoPlayer.options_ && ilcVideoPlayer.options_.languages) || {};
    var globalLangs = (videojs.options && videojs.options.languages) || {};

    // Prefer full tag, then base tag
    var base = getBaseLang(lang);
    return playerLangs[lang] || playerLangs[base] || globalLangs[lang] || globalLangs[base] || {};
  }

  function resolveLabel(key) {
    // Resolve localized label with graceful fallback to English key string
    var lang = getCurrentLang();
    var dict = getLanguageDict(lang);
    return (dict && dict[key]) || key;
  }

  function updateTranscriptLabels() {
    if (!bcSpanText || !bcTxtButton || !bcRtnButton) return;

    var showLabel = resolveLabel('Display Transcript');
    var hideLabel = resolveLabel('Hide Transcript');

    bcSpanText.textContent = showLabel;
    bcTxtButton.title = showLabel;
    bcRtnButton.textContent = hideLabel;
    bcRtnButton.title = hideLabel;
  }

  // Listen early so we catch language changes triggered by bc-i18n-custom.js
  ilcVideoPlayer.on('languagechange', updateTranscriptLabels);

  // ---- UI creation ----------------------------------------------------------

  ilcVideoPlayer.on('loadstart', function() {
    var tracks = (ilcVideoPlayer.mediainfo && ilcVideoPlayer.mediainfo.textTracks) || [];
    var numTracks = tracks.length;

    for (var i = 0; i < numTracks; i++) {
      if (tracks[i].kind === "metadata") {
        // Create transcript button
        bcTxtButton = document.createElement('button');
        bcTxtButton.className = 'vjs-transcript-control vjs-control vjs-button';
        bcTxtButton.setAttribute('style', 'z-index:1');
        bcTxtButton.setAttribute('type', 'button');
        bcTxtButton.setAttribute('aria-disabled', 'false');

        var bcSpanPlaceholder = document.createElement('span');
        bcSpanPlaceholder.setAttribute('aria-hidden', 'true');
        bcSpanPlaceholder.className = 'vjs-icon-placeholder';

        bcSpanText = document.createElement('span');
        bcSpanText.className = 'vjs-control-text';
        bcSpanText.setAttribute('aria-live', 'polite');

        bcTxtButton.appendChild(bcSpanPlaceholder);
        bcTxtButton.appendChild(bcSpanText);

        // IMPORTANT: append without nuking the spacer component (avoid .html(...))
        var spacerEl = ilcVideoPlayer.controlBar && ilcVideoPlayer.controlBar.customControlSpacer && ilcVideoPlayer.controlBar.customControlSpacer.el();
        if (spacerEl) {
          // Remove prior instance if re-running on subsequent loadstart
          var existing = spacerEl.querySelector('.vjs-transcript-control');
          if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
          spacerEl.appendChild(bcTxtButton);
        }

        // Create transcript container + return button
        bcTextContainer = document.createElement('div');
        bcTextContent = document.createElement('div');
        var bcTextFooter = document.createElement('div');
        bcRtnButton = document.createElement('button');

        bcTextContainer.style.display = "none";
        bcTextContainer.setAttribute('aria-hidden', 'true');
        bcTextContainer.className = 'bcTextContainer';

        bcTextContent.className = 'bcTextContent';
        bcTextContent.setAttribute('tabindex', '0');

        bcTextFooter.className = 'bcTextFooter';
        bcRtnButton.className = 'bcRtnButton';
        bcRtnButton.setAttribute('type', 'button');

        bcTextFooter.appendChild(bcRtnButton);
        bcTextContainer.appendChild(bcTextContent);
        bcTextContainer.appendChild(bcTextFooter);

        // Insert immediately after the player root
        var playerRoot = ilcVideoPlayer.el();
        if (playerRoot && playerRoot.parentNode) {
          playerRoot.parentNode.insertBefore(bcTextContainer, playerRoot.nextSibling);
        }

        // Load transcript text from metadata track src
        var url = tracks[i].src;
        if (url && window.$ && $.get) {
          $.get(url, function(data) {
            // Extract everything after the first "-->" timestamp line (your original behavior)
            var idx = (data || '').indexOf("-->");
            var newdata = idx >= 0 ? data.slice(idx + 16) : data;
            bcTextContent.innerHTML = newdata;
          });
        }

        // Hide transcript button in fullscreen
        ilcVideoPlayer.on('fullscreenchange', function() {
          var isFs = ilcVideoPlayer.isFullscreen();
          bcTxtButton.style.visibility = isFs ? "hidden" : "visible";
          bcTxtButton.setAttribute('aria-hidden', isFs ? 'true' : 'false');
        });

        // Show transcript
        if (window.$) {
          $(bcTxtButton).off('click.ilcTranscript').on('click.ilcTranscript', function() {
            ilcVideoPlayer.pause();
            ilcVideoPlayer.el().style.display = "none";
            ilcVideoPlayer.el().setAttribute('aria-hidden', 'true');
            bcTextContainer.style.display = "block";
            bcTextContainer.setAttribute('aria-hidden', 'false');
            bcTextContent.focus();
          });
        } else {
          bcTxtButton.addEventListener('click', function() {
            ilcVideoPlayer.pause();
            ilcVideoPlayer.el().style.display = "none";
            ilcVideoPlayer.el().setAttribute('aria-hidden', 'true');
            bcTextContainer.style.display = "block";
            bcTextContainer.setAttribute('aria-hidden', 'false');
            bcTextContent.focus();
          });
        }

        // Hide transcript
        if (window.$) {
          $(bcRtnButton).off('click.ilcTranscript').on('click.ilcTranscript', function() {
            bcTextContainer.style.display = "none";
            bcTextContainer.setAttribute('aria-hidden', 'true');
            ilcVideoPlayer.el().style.display = "block";
            ilcVideoPlayer.el().setAttribute('aria-hidden', 'false');
            bcTxtButton.focus();
          });
        } else {
          bcRtnButton.addEventListener('click', function() {
            bcTextContainer.style.display = "none";
            bcTextContainer.setAttribute('aria-hidden', 'true');
            ilcVideoPlayer.el().style.display = "block";
            ilcVideoPlayer.el().setAttribute('aria-hidden', 'false');
            bcTxtButton.focus();
          });
        }

        // Initial labels
        updateTranscriptLabels();

        // After player is ready, update again (covers race with language override)
        ilcVideoPlayer.ready(function() {
          updateTranscriptLabels();

          // Also schedule a microtask update in case language settles one tick later
          setTimeout(updateTranscriptLabels, 0);
        });

        break; // Stop after the first metadata track
      }
    }
  });
