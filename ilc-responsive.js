videojs.registerPlugin('ilcResponsivePlugin', function() {
  var ilcVideoPlayer = this;

  // Remove picture-in-picture button
  var pip_control = ilcVideoPlayer.el().getElementsByClassName("vjs-picture-in-picture-control")[0];
  if (pip_control) {
    pip_control.parentNode.removeChild(pip_control);
  }

  // Initialize player
  ilcVideoPlayer.on('loadstart', function() {
    var numTracks = ilcVideoPlayer.mediainfo.textTracks.length;

    for (var i = 0; i < numTracks; i++) {
      if (ilcVideoPlayer.mediainfo.textTracks[i].kind === "metadata") {

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
        bcSpanText.textContent = ilcVideoPlayer.localize('Display Transcript');
        bcTxtButton.setAttribute('title', ilcVideoPlayer.localize('Display Transcript'));

        bcTxtButton.appendChild(bcSpanPlaceholder);
        bcTxtButton.appendChild(bcSpanText);
        $(ilcVideoPlayer.controlBar.customControlSpacer.el()).html(bcTxtButton);

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
        bcRtnButton.textContent = ilcVideoPlayer.localize('Hide Transcript');
        bcRtnButton.setAttribute('title', ilcVideoPlayer.localize('Hide Transcript'));

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

        // Hide transcript button in fullscreen
        ilcVideoPlayer.on('fullscreenchange', function() {
          if (ilcVideoPlayer.isFullscreen()) {
            bcTxtButton.style.visibility = "hidden";
            bcTxtButton.setAttribute('aria-hidden', 'true');
          } else {
            bcTxtButton.style.visibility = "visible";
            bcTxtButton.setAttribute('aria-hidden', 'false');
          }
        });

        // Show transcript
        $(bcTxtButton).click(function() {
          ilcVideoPlayer.pause();
          ilcVideoPlayer.el().style.display = "none";
          ilcVideoPlayer.el().setAttribute('aria-hidden', 'true');
          bcTextContainer.style.display = "block";
          bcTextContainer.setAttribute('aria-hidden', 'false');
          bcTextContent.focus();
        });

        // Hide transcript
        $(bcRtnButton).click(function() {
          bcTextContainer.style.display = "none";
          bcTextContainer.setAttribute('aria-hidden', 'true');
          ilcVideoPlayer.el().style.display = "block";
          ilcVideoPlayer.el().setAttribute('aria-hidden', 'false');
          bcTxtButton.focus();
        });

        // ✅ Dynamic language update
        function updateTranscriptLabels() {
          bcSpanText.textContent = ilcVideoPlayer.localize('Display Transcript');
          bcTxtButton.setAttribute('title', ilcVideoPlayer.localize('Display Transcript'));
          bcRtnButton.textContent = ilcVideoPlayer.localize('Hide Transcript');
          bcRtnButton.setAttribute('title', ilcVideoPlayer.localize('Hide Transcript'));
        }

        // Initial set + listener
        updateTranscriptLabels();
        ilcVideoPlayer.on('languagechange', updateTranscriptLabels);

        break; // Stop after first metadata track
      }
    }
  });
});
