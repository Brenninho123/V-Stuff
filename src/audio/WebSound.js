// src/audio/WebSound.js — tiny reusable sound-effect player for V Stuff
//
// Not a full audio engine — just a small wrapper around <audio> for short
// UI sound effects (menu clicks, scrolls, etc.) with a shared mute flag,
// so the rest of the site never has to touch an <audio> element directly.
// Load a sound once by name, then play it by that name from anywhere.
//
//   WebSound.load('click', 'ui/sounds/scrollMenu.ogg');
//   WebSound.play('click');
//
// Everything below is additive — existing load/play/setMuted/isMuted calls
// behave exactly as before.
//
//   WebSound.play('click', { overlap: true });   // don't cut off a sound
//                                                 // still playing from the
//                                                 // last rapid click — plays
//                                                 // a separate copy instead
//   WebSound.play('click', { volume: 0.4 });      // one-off volume for this play
//   WebSound.setVolume('click', 0.6);              // per-sound volume (0-1), persists
//   WebSound.setMasterVolume(0.8);                 // scales every sound at once
//   WebSound.stop('click');                        // pause + rewind
//   WebSound.isLoaded('click');                    // true once the browser can play it through

var WebSound = (function () {
  var registry = {};
  var globalMuted = false;
  var masterVolume = 1;

  function clamp01(n) {
    n = Number(n);
    if (isNaN(n)) return 1;
    return Math.max(0, Math.min(1, n));
  }

  function applyVolume(audio, perSoundVolume) {
    try { audio.volume = clamp01(perSoundVolume * masterVolume); } catch (err) {}
  }

  function load(name, src) {
    var audio = new Audio(src);
    var entry = { audio: audio, volume: 1, loaded: false, failed: false };
    audio.addEventListener('canplaythrough', function () { entry.loaded = true; });
    audio.addEventListener('error', function () { entry.failed = true; });
    applyVolume(audio, entry.volume);
    registry[name] = entry;
    return audio;
  }

  function play(name, opts) {
    if (globalMuted) return;
    var entry = registry[name];
    if (!entry) return;
    opts = opts || {};
    try {
      var audio = opts.overlap ? entry.audio.cloneNode(true) : entry.audio;
      applyVolume(audio, opts.volume !== undefined ? clamp01(opts.volume) : entry.volume);
      if (opts.playbackRate) audio.playbackRate = opts.playbackRate;
      audio.loop = !!opts.loop;
      audio.currentTime = 0;
      var playPromise = audio.play();
      if (playPromise && playPromise.catch) playPromise.catch(function () {});
      return audio;
    } catch (err) {}
  }

  function stop(name) {
    var entry = registry[name];
    if (!entry) return;
    try {
      entry.audio.pause();
      entry.audio.currentTime = 0;
    } catch (err) {}
  }

  function setVolume(name, volume) {
    var entry = registry[name];
    if (!entry) return;
    entry.volume = clamp01(volume);
    applyVolume(entry.audio, entry.volume);
  }

  function setMasterVolume(volume) {
    masterVolume = clamp01(volume);
    Object.keys(registry).forEach(function (name) {
      applyVolume(registry[name].audio, registry[name].volume);
    });
  }

  function isLoaded(name) {
    var entry = registry[name];
    return !!(entry && entry.loaded);
  }

  function setMuted(muted) {
    globalMuted = !!muted;
  }

  function isMuted() {
    return globalMuted;
  }

  return {
    load: load,
    play: play,
    stop: stop,
    setVolume: setVolume,
    setMasterVolume: setMasterVolume,
    isLoaded: isLoaded,
    setMuted: setMuted,
    isMuted: isMuted
  };
})();
