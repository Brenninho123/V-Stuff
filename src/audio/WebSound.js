// src/audio/WebSound.js — tiny reusable sound-effect player for V Stuff
//
// Not a full audio engine — just a small wrapper around <audio> for short
// UI sound effects (menu clicks, scrolls, etc.) with a shared mute flag,
// so the rest of the site never has to touch an <audio> element directly.
// Load a sound once by name, then play it by that name from anywhere.

var WebSound = (function () {
  var registry = {};
  var globalMuted = false;

  function load(name, src) {
    var audio = new Audio(src);
    registry[name] = audio;
    return audio;
  }

  function play(name) {
    if (globalMuted) return;
    var audio = registry[name];
    if (!audio) return;
    try {
      audio.currentTime = 0;
      var playPromise = audio.play();
      if (playPromise && playPromise.catch) playPromise.catch(function () {});
    } catch (err) {}
  }

  function setMuted(muted) {
    globalMuted = !!muted;
  }

  function isMuted() {
    return globalMuted;
  }

  return { load: load, play: play, setMuted: setMuted, isMuted: isMuted };
})();
