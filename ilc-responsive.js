/* ilc-responsive.js
   - Creates a transcript toggle button and overlay.
   - Preserves all original functionality.
   - Adds debug checks for language and dictionary resolution.
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
    var lang = (typeof ilcVideoPlayer.language === 'function') ? ilcVideoPlayer.language() : 'en';
    return String(lang || 'en').toLowerCase();
  }

  function getBaseLang(lang) {
    lang = String(lang || '').toLowerCase();
    return lang.split('-')[0] || lang;
  }

  function getLanguageDict(lang) {
    var playerLangs = (ilcVideoPlayer.options_ && ilcVideoPlayer.options_.languages) || {};
    var globalLangs = (videojs.options && videojs.options.languages) || {};
    var base = getBaseLang(lang);
    return playerLangs[lang] || playerLangs[base] || globalLangs[lang] || globalLangs[base] || {};
  }

  function resolveLabel(key) {
    var lang = getCurrentLang();
    var dict = getLanguageDict(lang);
    var label = (dict && dict[key]) || key;
    console.log('[ilcResponsivePlugin] resolveLabel:', key, '=>', label, '(lang:', lang, ')');
    return label;
  }

  function updateTranscriptLabels() {
    console.log('[ilcResponsivePlugin] updateTranscriptLabels fired. Current lang:', getCurrentLang());
    if (!bcSpanText || !bcTxtButton || !bcRtnButton) {
      console.warn('[ilcResponsivePlugin] Elements not ready yet.');
      return;
    }
    var showLabel = resolveLabel('Display Transcript');
    var hideLabel = resolveLabel('Hide Transcript');
    bcSpanText.textContent = showLabel;
    bcTxtButton.title = showLabel;
    bcRtnButton.textContent = hideLabel;
    bcRtnButton.title = hideLabel;
    console.log('[ilcResponsivePlugin] Labels updated:', showLabel, hideLabel);
  }

  // Listen early so we catch language changes triggered by bc-i18n-custom.js
  ilcVideoPlayer.on('languagechange', function() {
    console.log('[ilcResponsivePlugin] languagechange event detected.');
    updateTranscriptLabels();
  });

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

        // Append without nuking spacer
        var spacerEl = ilcVideoPlayer.controlBar && ilcVideoPlayer.controlBar.customControlSpacer && ilcVideoPlayer.controlBar.customControlSpacer.el();
        if (spacerEl) {
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

        var playerRoot = ilcVideoPlayer.el();
        if (playerRoot && playerRoot.parentNode) {
          playerRoot.parentNode.insertBefore(bcTextContainer, playerRoot.nextSibling);
        }

        // Load transcript text
        var url = tracks[i].src;
        if (url && window.$ && $.get) {
          $.get(url, function(data) {
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

        // After player ready, update again
        ilcVideoPlayer.ready(function() {
          console.log('[ilcResponsivePlugin] Player ready, forcing label refresh.');
          updateTranscriptLabels();
          setTimeout(updateTranscriptLabels, 0);
        });

        break; // Stop after first metadata track
      }
    }
  });
});
