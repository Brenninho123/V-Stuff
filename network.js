// network.js — V Stuff community showcase
//
// There is no custom backend here. Posts are public GitHub issues on this
// project's repo, tagged "showcase". Reading them uses GitHub's unauthenticated
// public REST API (rate-limited but keyless); posting one happens by opening a
// pre-filled "new issue" page on github.com, since a static site has no safe
// place to hold a token that could create issues on someone's behalf.

var NETWORK_CONFIG = {
  owner: 'Brenninho123',
  repo: 'V-Stuff',
  label: 'showcase',
  perPage: 30
};

function networkEscapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function networkStripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~`]/g, '')
    .replace(/\r?\n+/g, ' ')
    .trim();
}

function networkFormatDate(iso) {
  try {
    var d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (err) {
    return iso;
  }
}

function getVisibleProfileName() {
  try {
    var visible = localStorage.getItem('vstuffProfileVisible');
    if (visible === 'false') return '';
    return (localStorage.getItem('vstuffProfileName') || '').trim();
  } catch (err) {
    return '';
  }
}

function buildSubmitUrl() {
  var title = '';
  var authorLine = getVisibleProfileName();
  var bodyLines = [
    '## Project',
    '',
    '(name and one-line summary)',
    '',
    '## Description',
    '',
    '(what it is, what engine/fork it targets, screenshots or a video link help a lot)',
    '',
    '## Links',
    '',
    '(GitHub repo, download link, itch.io page, whatever applies)'
  ];
  if (authorLine) {
    bodyLines.push('', '## Posted by', '', authorLine);
  }
  var body = bodyLines.join('\n');

  var params = new URLSearchParams();
  params.set('title', title);
  params.set('body', body);
  params.set('labels', NETWORK_CONFIG.label);

  return 'https://github.com/' + NETWORK_CONFIG.owner + '/' + NETWORK_CONFIG.repo + '/issues/new?' + params.toString();
}

function networkApiUrl() {
  var params = new URLSearchParams();
  params.set('labels', NETWORK_CONFIG.label);
  params.set('state', 'open');
  params.set('sort', 'created');
  params.set('direction', 'desc');
  params.set('per_page', String(NETWORK_CONFIG.perPage));
  return 'https://api.github.com/repos/' + NETWORK_CONFIG.owner + '/' + NETWORK_CONFIG.repo + '/issues?' + params.toString();
}

function networkBuildCard(issue) {
  var preview = networkStripMarkdown(issue.body);
  if (preview.length > 220) preview = preview.slice(0, 220) + '…';

  var avatar = issue.user && issue.user.avatar_url ? issue.user.avatar_url : '';
  var author = issue.user && issue.user.login ? issue.user.login : 'unknown';

  return '' +
    '<a class="online-card" href="' + networkEscapeHtml(issue.html_url) + '" target="_blank" rel="noopener noreferrer">' +
      '<div class="online-card-header">' +
        (avatar ? '<img class="online-card-avatar" src="' + networkEscapeHtml(avatar) + '" alt="" loading="lazy">' : '<div class="online-card-avatar"></div>') +
        '<span class="online-card-author">@' + networkEscapeHtml(author) + '</span>' +
      '</div>' +
      '<div class="online-card-title">' + networkEscapeHtml(issue.title || 'Untitled') + '</div>' +
      '<div class="online-card-body">' + networkEscapeHtml(preview || 'No description.') + '</div>' +
      '<div class="online-card-date">' + networkEscapeHtml(networkFormatDate(issue.created_at)) + '</div>' +
    '</a>';
}

function setOnlineStatus(text, kind) {
  var el = document.getElementById('onlineStatus');
  if (!el) return;
  el.textContent = text || '';
  el.className = kind || '';
}

function loadCommunityProjects() {
  var grid = document.getElementById('onlineGrid');
  if (!grid) return;

  grid.innerHTML = '<div class="empty-state">Loading projects…</div>';
  setOnlineStatus('Fetching from GitHub…', '');

  fetch(networkApiUrl(), { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (res) {
      if (!res.ok) throw new Error('GitHub API returned ' + res.status);
      return res.json();
    })
    .then(function (issues) {
      var projects = issues.filter(function (issue) { return !issue.pull_request; });

      if (!projects.length) {
        grid.innerHTML = '<div class="empty-state">No projects posted yet — be the first!</div>';
        setOnlineStatus('', '');
        return;
      }

      grid.innerHTML = projects.map(networkBuildCard).join('');
      setOnlineStatus(projects.length + ' project(s) loaded.', 'ok');
    })
    .catch(function (err) {
      grid.innerHTML =
        '<div class="empty-state">Couldn\'t load projects right now (' + networkEscapeHtml(err.message) + '). ' +
        'You can still browse them directly on <a href="https://github.com/' + NETWORK_CONFIG.owner + '/' + NETWORK_CONFIG.repo +
        '/issues?q=is%3Aissue+is%3Aopen+label%3A' + NETWORK_CONFIG.label + '" target="_blank" rel="noopener noreferrer">GitHub</a>.</div>';
      setOnlineStatus('Failed to load.', 'err');
    });
}

document.addEventListener('DOMContentLoaded', function () {
  var submitBtn = document.getElementById('onlineSubmitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      window.open(buildSubmitUrl(), '_blank', 'noopener');
    });
  }

  var refreshBtn = document.getElementById('onlineRefreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', loadCommunityProjects);
  }
});
