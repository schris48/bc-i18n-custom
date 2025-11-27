videojs.registerPlugin('ilcResponsivePlugin', function() {
  var ilcVideoPlayer = this;

  // --- DEBUG: plugin loaded
  try {
    console.log('[ilcResponsivePlugin] init: player id=', ilcVideoPlayer.id(), 'language=', (ilcVideoPlayer.language && ilcVideoPlayer.language()) || '(n/a)');
  } catch (e) {
    console.warn('[ilcResponsivePlugin] init: error logging player id/language', e);
  }

  // Remove picture-in-picture button
  var pip_control = ilcVideoPlayer.el().getElementsByClassName("vjs-picture-in-picture-control")[0];
  if (pip_control) {
    console.log('[ilcResponsivePlugin] removing PiP control');
    pip_control.parentNode.removeChild(pip_control);
  } else {
    console.log('[ilcResponsivePlugin] PiP control not found (ok)');
  }

  // Initialize player
  ilcVideoPlayer.on('loadstart', function() {
    console.log('[ilcResponsivePlugin] loadstart fired');

    var numTracks = ilcVideoPlayer.mediainfo && ilcVideoPlayer.mediainfo.textTracks ? ilcVideoPlayer.mediainfo.textTracks.length : 0;
    console.log('[ilcResponsivePlugin] textTracks count=', numTracks);

    for (var i = 0; i < numTracks; i++) {
      var track = ilcVideoPlayer.mediainfo.textTracks[i];
      console.log('[ilcResponsivePlugin] inspecting track', i, 'kind=', track && track.kind);

      if (track && track.kind === "metadata") {
        console.log('[ilcResponsivePlugin] using metadata track at index', i);

        // Create transcript button
        var bcTxtButton = document.createElement('button');
        bcTxtButton.className = 'vjs-transcript-control vjs-control vjs-button';
        bcTxtButton.setAttribute('style', 'z-index:1');
        bcTxtButton.setAttribute('type', 'button');
        bcTxtButton.setAttribute('aria-disabled', 'false');

        var bcSpanPlaceholder = document.createElement('span');
        bcSpanPlaceholder.setAttribute('aria-hidden', 'true');
        bcSpanPlaceholder.className = 'vjs-icon-placeholder';

        var bcSpanText = document.createElement('span');
        bcSpanText.className = 'vjs-control-text';
        bcSpanText.setAttribute('aria-live', 'polite');

        // Initial localized label
        var initialDisplayLabel = ilcVideoPlayer.localize('Display Transcript');
        bcSpanText.textContent = initialDisplayLabel;
        bcTxtButton.setAttribute('title', initialDisplayLabel);

        bcTxtButton.appendChild(bcSpanPlaceholder);
        bcTxtButton.appendChild(bcSpanText);

        // --- Insert into control bar: prefer customControlSpacer; fallback to end of controlBar
        try {
          var spacer = ilcVideoPlayer.controlBar && ilcVideoPlayer.controlBar.customControlSpacer;
          if (spacer && spacer.el) {
            console.log('[ilcResponsivePlugin] inserting button into customControlSpacer');
            $(spacer.el()).html(bcTxtButton); // original behavior
          } else {
            console.warn('[ilcResponsivePlugin] customControlSpacer not available; appending to controlBar');
            ilcVideoPlayer.controlBar.el().appendChild(bcTxtButton);
          }
        } catch (e) {
          console.warn('[ilcResponsivePlugin] error inserting transcript button; falling back to controlBar.appendChild', e);
          ilcVideoPlayer.controlBar.el().appendChild(bcTxtButton);
        }

        // Create transcript container + return button
        var bcTextContainer = document.createElement('div');
        var bcTextContent = document.createElement('div');
        var bcTextFooter = document.createElement('div');
        var bcRtnButton = document.createElement('button');

        bcTextContainer.style.display = "none";
        bcTextContainer.setAttribute('aria-hidden', 'true');
        bcTextContainer.className = 'bcTextContainer';
        bcTextContent.className = 'bcTextContent';
        bcTextContent.setAttribute('tabindex', '0');
        bcTextFooter.className = 'bcTextFooter';
        bcRtnButton.className = 'bcRtnButton';
        bcRtnButton.setAttribute('type', 'button');

        // Initial localized label
        var initialHideLabel = ilcVideoPlayer.localize('Hide Transcript');
        bcRtnButton.textContent = initialHideLabel;
        bcRtnButton.setAttribute('title', initialHideLabel);

        bcTextFooter.appendChild(bcRtnButton);
        bcTextContainer.appendChild(bcTextContent);
        bcTextContainer.appendChild(bcTextFooter);

        // Insert container after player element
        $(bcTextContainer).insertAfter(ilcVideoPlayer.el());
        console.log('[ilcResponsivePlugin] transcript container inserted after player');

        // Load transcript text
        var url = track.src;
        console.log('[ilcResponsivePlugin] fetching transcript from', url);
        $.get(url, function(data) {
          try {
            var newdata = data.slice(data.indexOf("-->") + 16);
            bcTextContent.innerHTML = newdata;
            console.log('[ilcResponsivePlugin] transcript content loaded (length=', (newdata && newdata.length) || 0, ')');
          } catch (e) {
            console.warn('[ilcResponsivePlugin] error parsing transcript content', e);
            bcTextContent.textContent = data; // fallback: raw
          }
        }).fail(function(xhr, status, err) {
          console.warn('[ilcResponsivePlugin] failed to load transcript', status, err);
        });

        // Hide transcript button in fullscreen
        ilcVideoPlayer.on('fullscreenchange', function() {
          if (ilcVideoPlayer.isFullscreen()) {
            bcTxtButton.style.visibility = "hidden";
            bcTxtButton.setAttribute('aria-hidden', 'true');
            console.log('[ilcResponsivePlugin] fullscreen: hide transcript trigger');
          } else {
            bcTxtButton.style.visibility = "visible";
            bcTxtButton.setAttribute('aria-hidden', 'false');
            console.log('[ilcResponsivePlugin] fullscreen: show transcript trigger');
          }
        });

        // Show transcript
        $(bcTxtButton).click(function() {
          console.log('[ilcResponsivePlugin] transcript trigger clicked');
          ilcVideoPlayer.pause();
          ilcVideoPlayer.el().style.display = "none";
          ilcVideoPlayer.el().setAttribute('aria-hidden', 'true');
          bcTextContainer.style.display = "block";
          bcTextContainer.setAttribute('aria-hidden', 'false');
          bcTextContent.focus();

          // ensure labels are localized when overlay opens
          updateTranscriptLabels();
        });

        // Hide transcript
        $(bcRtnButton).click(function() {
          console.log('[ilcResponsivePlugin] transcript close clicked');
          bcTextContainer.style.display = "none";
          bcTextContainer.setAttribute('aria-hidden', 'true');
          ilcVideoPlayer.el().style.display = "block";
          ilcVideoPlayer.el().setAttribute('aria-hidden', 'false');
          bcTxtButton.focus();
        });

        // ✅ Dynamic language update logic (resilient)
        function updateTranscriptLabels() {
          try {
            var displayLabel = ilcVideoPlayer.localize('Display Transcript');
            var hideLabel = ilcVideoPlayer.localize('Hide Transcript');

            bcSpanText.textContent = displayLabel;
            bcTxtButton.setAttribute('title', displayLabel);

            bcRtnButton.textContent = hideLabel;
            bcRtnButton.setAttribute('title', hideLabel);

            console.log('[ilcResponsivePlugin] labels updated:', {
              language: (ilcVideoPlayer.language && ilcVideoPlayer.language()) || '(n/a)',
              displayLabel: displayLabel,
              hideLabel: hideLabel
            });
          } catch (e) {
            console.warn('[ilcResponsivePlugin] updateTranscriptLabels error', e);
          }
        }

        // Initial set + listener
        updateTranscriptLabels();
        ilcVideoPlayer.on('languagechange', function() {
          console.log('[ilcResponsivePlugin] languagechange event received; language=', (ilcVideoPlayer.language && ilcVideoPlayer.language()) || '(n/a)');
          // Delay a tick in case DOM was (re)created by Brightcove
          setTimeout(updateTranscriptLabels, 0);
        });

        // Safety net: observe DOM for late injection
        try {
          var observer = new MutationObserver(function(muts) {
            // update when our elements (or control bar) change
            var needsUpdate = false;
            for (var k = 0; k < muts.length; k++) {
              var t = muts[k].target;
              if (!t) continue;
              if (t === bcTextContainer || t === ilcVideoPlayer.controlBar.el()) {
                needsUpdate = true; break;
              }
              // also check additions under body for our classnames
              var added = muts[k].addedNodes || [];
              for (var a = 0; a < added.length; a++) {
                if (added[a].querySelector && (added[a].querySelector('.vjs-transcript-control') || added[a].querySelector('.bcRtnButton'))) {
                  needsUpdate = true; break;
                }
              }
              if (needsUpdate) break;
            }
            if (needsUpdate) {
              // debounce slightly
              setTimeout(updateTranscriptLabels, 50);
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
          console.log('[ilcResponsivePlugin] MutationObserver started');
        } catch (e) {
          console.warn('[ilcResponsivePlugin] MutationObserver unavailable', e);
        }

        // Expose for manual testing
        try {
          window.ilcVideoPlayer = ilcVideoPlayer;
          console.log('[ilcResponsivePlugin] window.ilcVideoPlayer exposed');
        } catch (e) {
          /* ignore */
        }

        break; // Stop after first metadata track
      }
    }
  });
});
