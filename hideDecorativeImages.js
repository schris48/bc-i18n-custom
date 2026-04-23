videojs.registerPlugin('hideDecorativeImages', function () {
  var player = this;

  function applyAria() {
    // Poster
    var poster = player.el().querySelector('.vjs-poster');
    if (poster) {
      poster.setAttribute('aria-hidden', 'true');
      poster.setAttribute('role', 'presentation');
    }

    // Thumbnail preview containers
    player.el()
      .querySelectorAll('.vjs-thumbnail-display')
      .forEach(function (el) {
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('role', 'presentation');
      });
  }

  player.ready(applyAria);
  player.on('loadeddata', applyAria);
  player.on('play', applyAria);
});
