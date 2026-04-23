videojs.getPlayer('FaSDPMPnM').ready(function () {
  var player = this;

  // Poster image
  var poster = player.el().querySelector('.vjs-poster');
  if (poster) {
    poster.setAttribute('aria-hidden', 'true');
    poster.setAttribute('role', 'presentation');
  }

  // Thumbnail previews
  var thumbnails = player.el().querySelectorAll('.vjs-thumbnail-display');
  thumbnails.forEach(function (thumb) {
    thumb.setAttribute('aria-hidden', 'true');
    thumb.setAttribute('role', 'presentation');
  });
});
