videojs.registerPlugin('ilcResponsivePlugin', function() {
  var ilcVideoPlayer = this;
  var bcTxtButton, bcSpanText, bcRtnButton;

  function updateTranscriptLabels() {
    if (bcSpanText && bcTxtButton && bcRtnButton) {
      bcSpanText.textContent = ilcVideoPlayer.localize('Display Transcript');
      bcTxtButton.title = ilcVideoPlayer.localize('Display Transcript');
      bcRtnButton.textContent = ilcVideoPlayer.localize('Hide Transcript');
      bcRtnButton.title = ilcVideoPlayer.localize('Hide Transcript');
    }
  }

  // ✅ Always refresh when language changes
  ilcVideoPlayer.on('languagechange', updateTranscriptLabels);

  ilcVideoPlayer.on('loadstart', function() {
    var numTracks = ilcVideoPlayer.mediainfo.textTracks.length;

    for (var i = 0; i < numTracks; i++) {
      if (ilcVideoPlayer.mediainfo.textTracks[i].kind === "metadata") {
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
        $(ilcVideoPlayer.controlBar.customControlSpacer.el()).html(bcTxtButton);

        // Create transcript container
        var bcTextContainer = document.createElement('div');
        var bcTextContent = document.createElement('div');
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
        $(bcTextContainer).insertAfter(ilcVideoPlayer.el());

        // Load transcript text
        var url = ilcVideoPlayer.mediainfo.textTracks[i].src;
        $.get(url, function(data) {
          var newdata = data.slice(data.indexOf("-->") + 16);
          bcTextContent.innerHTML = newdata;
        });

        // Fullscreen toggle
        ilcVideoPlayer.on('fullscreenchange', function() {
          bcTxtButton.style.visibility = ilcVideoPlayer.isFullscreen() ? "hidden" : "visible";
          bcTxtButton.setAttribute('aria-hidden', ilcVideoPlayer.isFullscreen());
        });

        // Show transcript
        $(bcTxtButton).click(function() {
          ilcVideoPlayer.pause();
          ilcVideoPlayer.el().style.display = "none";
          bcTextContainer.style.display = "block";
          bcTextContent.focus();
        });

        // Hide transcript
        $(bcRtnButton).click(function() {
          bcTextContainer.style.display = "none";
          ilcVideoPlayer.el().style.display = "block";
          bcTxtButton.focus();
        });

        // ✅ Initial label set
        updateTranscriptLabels();

        // ✅ Force refresh after player ready (language override happens here)
        ilcVideoPlayer.ready(function() {
          updateTranscriptLabels();
        });

        break;
      }
    }
  });
});
