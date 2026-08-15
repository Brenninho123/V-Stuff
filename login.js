// login.js — optional "Sign in with Google" for V Stuff
//
// This is purely decorative: signing in only shows your Google name and photo
// in the Options panel. It doesn't unlock any feature on the site, doesn't
// create an account anywhere, and doesn't talk to any server of ours — the ID
// token Google hands back is decoded locally in the browser and never sent
// anywhere. There is no server-side verification of the token, so treat this
// as "who the browser says you are," not real authentication.
//
// To turn this on: create an OAuth 2.0 Client ID at
// https://console.cloud.google.com/apis/credentials for this site's real
// domain (add it under "Authorized JavaScript origins"), then paste the
// client ID below. Until you do, the site works exactly the same — this
// whole feature is opt-in and the rest of the site never checks it.

var GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
var GOOGLE_PROFILE_STORAGE_KEY = 'vstuffGoogleProfile';

function isGoogleConfigured() {
  return !!GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.indexOf('YOUR_GOOGLE_CLIENT_ID') === -1;
}

function decodeJwtPayload(token) {
  var parts = token.split('.');
  if (parts.length !== 3) throw new Error('malformed token');
  var payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  var padded = payload + '==='.slice((payload.length + 3) % 4);
  var decoded = atob(padded);
  var json = decodeURIComponent(
    decoded.split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')
  );
  return JSON.parse(json);
}

function showGoogleSignedInState(profile) {
  var signedOut = document.getElementById('googleSignedOutView');
  var signedIn = document.getElementById('googleSignedInView');
  if (!signedOut || !signedIn) return;
  signedOut.style.display = 'none';
  signedIn.style.display = '';
  var avatar = document.getElementById('googleProfileAvatar');
  var name = document.getElementById('googleProfileName');
  if (avatar) avatar.src = profile.picture || '';
  if (name) name.textContent = profile.name || profile.email || 'Signed in';
}

function showGoogleSignedOutState() {
  var signedOut = document.getElementById('googleSignedOutView');
  var signedIn = document.getElementById('googleSignedInView');
  if (!signedOut || !signedIn) return;
  signedOut.style.display = '';
  signedIn.style.display = 'none';
}

function handleGoogleCredential(response) {
  try {
    var profile = decodeJwtPayload(response.credential);
    var saved = { name: profile.name, email: profile.email, picture: profile.picture };
    try { localStorage.setItem(GOOGLE_PROFILE_STORAGE_KEY, JSON.stringify(saved)); } catch (err) {}
    showGoogleSignedInState(saved);
  } catch (err) {
    console.error('Could not read the Google credential:', err);
  }
}

function signOutOfGoogle() {
  try { localStorage.removeItem(GOOGLE_PROFILE_STORAGE_KEY); } catch (err) {}
  if (window.google && window.google.accounts && window.google.accounts.id) {
    window.google.accounts.id.disableAutoSelect();
  }
  showGoogleSignedOutState();
}

function restoreSavedGoogleSession() {
  try {
    var raw = localStorage.getItem(GOOGLE_PROFILE_STORAGE_KEY);
    if (raw) showGoogleSignedInState(JSON.parse(raw));
  } catch (err) {}
}

function initGoogleSignIn() {
  var unconfiguredHint = document.getElementById('googleSignInUnconfigured');
  var container = document.getElementById('googleSignInContainer');

  if (!isGoogleConfigured()) {
    if (unconfiguredHint) unconfiguredHint.style.display = '';
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredential,
    auto_select: false
  });

  if (container) {
    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'medium',
      text: 'signin_with',
      shape: 'pill'
    });
  }
}

function initGoogleSignInWhenReady(attemptsLeft) {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    initGoogleSignIn();
    return;
  }
  if (attemptsLeft <= 0) {
    // The GSI script never loaded (offline, blocked, or just slow) — show the
    // same "not set up" hint rather than leaving an empty, unexplained gap.
    var unconfiguredHint = document.getElementById('googleSignInUnconfigured');
    if (unconfiguredHint) unconfiguredHint.style.display = '';
    return;
  }
  setTimeout(function () { initGoogleSignInWhenReady(attemptsLeft - 1); }, 150);
}

document.addEventListener('DOMContentLoaded', function () {
  restoreSavedGoogleSession();

  var signOutBtn = document.getElementById('googleSignOutBtn');
  if (signOutBtn) signOutBtn.addEventListener('click', signOutOfGoogle);

  initGoogleSignInWhenReady(40); // retry for up to ~6 seconds while the GSI script loads
});
