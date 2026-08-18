// network.js — V Stuff community showcase
//
// There is no custom backend here. Posts are public GitHub issues on this
// project's repo, tagged "showcase". Reading them uses GitHub's unauthenticated
// public REST API (rate-limited but keyless); posting one happens by opening a
// pre-filled "new issue" page on github.com, since a static site has no safe
// place to hold a token that could create issues on someone's behalf.
//
// Search and sort are entirely client-side over the already-fetched batch —
// no extra API calls, so they don't cost any of the rate limit.

var NETWORK_CONFIG = {
  owner: 'Brenninho123',
  repo: 'V-Stuff',
  label: 'showcase',
  perPage: 30
};

var networkAllProjects = [];
var networkNextPageUrl = null;

function networkParseLinkHeader(header) {
  var links = {};
  if (!header) return links;
  header.split(',').forEach(function (part) {
    var match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
    if (match) links[match[2]] = match[1];
  });
  return links;
}

function updateLoadMoreButton() {
  var btn = document.getElementById('onlineLoadMoreBtn');
  if (btn) btn.style.display = networkNextPageUrl ? '' : 'none';
}

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

function networkReactionCount(issue) {
  return (issue.reactions && issue.reactions.total_count) || 0;
}

function networkBuildCard(issue) {
  var preview = networkStripMarkdown(issue.body);
  if (preview.length > 220) preview = preview.slice(0, 220) + '…';

  var avatar = issue.user && issue.user.avatar_url ? issue.user.avatar_url : '';
  var author = issue.user && issue.user.login ? issue.user.login : 'unknown';
  var reactionCount = networkReactionCount(issue);
  var commentCount = issue.comments || 0;

  return '' +
    '<a class="online-card" href="' + networkEscapeHtml(issue.html_url) + '" target="_blank" rel="noopener noreferrer">' +
      '<div class="online-card-header">' +
        (avatar ? '<img class="online-card-avatar" src="' + networkEscapeHtml(avatar) + '" alt="" loading="lazy">' : '<div class="online-card-avatar"></div>') +
        '<span class="online-card-author">@' + networkEscapeHtml(author) + '</span>' +
      '</div>' +
      '<div class="online-card-title">' + networkEscapeHtml(issue.title || 'Untitled') + '</div>' +
      '<div class="online-card-body">' + networkEscapeHtml(preview || 'No description.') + '</div>' +
      '<div class="online-card-footer">' +
        '<div class="online-card-date">' + networkEscapeHtml(networkFormatDate(issue.created_at)) + '</div>' +
        '<div class="online-card-stats">' +
          '<span title="Reactions">&#9825; ' + reactionCount + '</span>' +
          '<span title="Comments">&#128172; ' + commentCount + '</span>' +
        '</div>' +
      '</div>' +
    '</a>';
}

function setOnlineStatus(text, kind) {
  var el = document.getElementById('onlineStatus');
  if (!el) return;
  el.textContent = text || '';
  el.className = kind || '';
}

function networkFilterAndSort(projects) {
  var searchInput = document.getElementById('onlineSearchInput');
  var sortSelect = document.getElementById('onlineSortSelect');
  var query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  var sortBy = sortSelect ? sortSelect.value : 'newest';

  var result = projects;
  if (query) {
    result = result.filter(function (issue) {
      var title = (issue.title || '').toLowerCase();
      var body = (issue.body || '').toLowerCase();
      var author = (issue.user && issue.user.login || '').toLowerCase();
      return title.indexOf(query) !== -1 || body.indexOf(query) !== -1 || author.indexOf(query) !== -1;
    });
  }

  result = result.slice();
  if (sortBy === 'oldest') {
    result.sort(function (a, b) { return new Date(a.created_at) - new Date(b.created_at); });
  } else if (sortBy === 'reactions') {
    result.sort(function (a, b) { return networkReactionCount(b) - networkReactionCount(a); });
  } else if (sortBy === 'comments') {
    result.sort(function (a, b) { return (b.comments || 0) - (a.comments || 0); });
  } else {
    result.sort(function (a, b) { return new Date(b.created_at) - new Date(a.created_at); });
  }

  return result;
}

function networkRenderGrid() {
  var grid = document.getElementById('onlineGrid');
  if (!grid) return;

  var visible = networkFilterAndSort(networkAllProjects);

  if (!networkAllProjects.length) {
    grid.innerHTML = '<div class="empty-state">No projects posted yet — be the first!</div>';
    setOnlineStatus('', '');
    return;
  }

  if (!visible.length) {
    grid.innerHTML = '<div class="empty-state">No projects match that search.</div>';
    setOnlineStatus('0 of ' + networkAllProjects.length + ' project(s) shown.', '');
    return;
  }

  grid.innerHTML = visible.map(networkBuildCard).join('');
  var countMsg = visible.length === networkAllProjects.length
    ? visible.length + ' project(s) loaded.'
    : visible.length + ' of ' + networkAllProjects.length + ' project(s) shown.';
  setOnlineStatus(countMsg, 'ok');
}

function loadCommunityProjects() {
  var grid = document.getElementById('onlineGrid');
  if (!grid) return;

  networkNextPageUrl = null;
  updateLoadMoreButton();
  grid.innerHTML = '<div class="empty-state">Loading projects…</div>';
  setOnlineStatus('Fetching from GitHub…', '');

  fetch(networkApiUrl(), { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (res) {
      if (!res.ok) throw new Error('GitHub API returned ' + res.status);
      var links = networkParseLinkHeader(res.headers.get('Link'));
      networkNextPageUrl = links.next || null;
      return res.json();
    })
    .then(function (issues) {
      networkAllProjects = issues.filter(function (issue) { return !issue.pull_request; });
      networkRenderGrid();
      updateLoadMoreButton();
    })
    .catch(function (err) {
      networkAllProjects = [];
      networkNextPageUrl = null;
      updateLoadMoreButton();
      grid.innerHTML =
        '<div class="empty-state">Couldn\'t load projects right now (' + networkEscapeHtml(err.message) + '). ' +
        'You can still browse them directly on <a href="https://github.com/' + NETWORK_CONFIG.owner + '/' + NETWORK_CONFIG.repo +
        '/issues?q=is%3Aissue+is%3Aopen+label%3A' + NETWORK_CONFIG.label + '" target="_blank" rel="noopener noreferrer">GitHub</a>.</div>';
      setOnlineStatus('Failed to load.', 'err');
    });
}

function loadMoreProjects() {
  if (!networkNextPageUrl) return;
  var url = networkNextPageUrl;
  setOnlineStatus('Loading more…', '');
  fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (res) {
      if (!res.ok) throw new Error('GitHub API returned ' + res.status);
      var links = networkParseLinkHeader(res.headers.get('Link'));
      networkNextPageUrl = links.next || null;
      return res.json();
    })
    .then(function (issues) {
      var newOnes = issues.filter(function (issue) { return !issue.pull_request; });
      networkAllProjects = networkAllProjects.concat(newOnes);
      networkRenderGrid();
      updateLoadMoreButton();
    })
    .catch(function (err) {
      setOnlineStatus('Could not load more: ' + err.message, 'err');
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

  var searchInput = document.getElementById('onlineSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', networkRenderGrid);
  }

  var sortSelect = document.getElementById('onlineSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', networkRenderGrid);
  }

  var loadMoreBtn = document.getElementById('onlineLoadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreProjects);
  }
});
