(function () {
  'use strict';

  var page = document.body ? (document.body.getAttribute('data-page') || '') : '';

  function markCurrent() {
    if (!page) { return; }
    var links = document.querySelectorAll('.site-nav a[data-page]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      if (a.getAttribute('data-page') === page) {
        a.classList.add('is-current');
        a.setAttribute('aria-current', 'page');
        var sr = document.createElement('span');
        sr.className = 'visually-hidden';
        sr.textContent = ' (current page)';
        a.appendChild(sr);
      }
    }
  }

  function renderNavSession() {
    var slot = document.querySelector('[data-nav-session]');
    if (!slot) { return; }

    if (Store.isLoggedIn()) {
      slot.innerHTML =
        '<a href="addcar.html" data-page="addcar">Post a car</a>' +
        '<a href="#" data-logout>Sign out</a>';
    } else {
      slot.innerHTML =
        '<a href="login.html" data-page="login">Sign in</a>' +
        '<a href="register.html" data-page="register">Register</a>';
    }

    var here = slot.querySelector('a[data-page="' + page + '"]');
    if (here) { here.classList.add('is-current'); here.setAttribute('aria-current', 'page'); }
  }

  function renderHeaderSession() {
    var slot = document.querySelector('[data-header-session]');
    if (!slot) { return; }

    var seller = Store.currentSeller();
    if (seller) {
      slot.innerHTML = '<span>Signed in as <strong>' + Store.esc(seller.name) + '</strong></span>';
    } else {
      slot.innerHTML = '<span>Welcome. <a href="register.html">Become a seller</a></span>';
    }
  }

  function renderFooterYear() {
    var slot = document.querySelector('[data-year]');
    if (slot) { slot.textContent = String(new Date().getFullYear()); }
  }

  function bindLogout() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-logout]') : null;
      if (!el) { return; }
      e.preventDefault();
      Store.logout();
      window.location.replace('index.html?loggedout=1');
    });
  }

  var FLASH_MESSAGES = {
    registered: { type: 'success', text: 'Registration complete. You can now sign in with the username and password you just chose.' },
    welcome:    { type: 'success', text: 'Signed in successfully. Welcome back.' },
    loggedout:  { type: 'info',    text: 'You have been signed out.' },
    posted:     { type: 'success', text: 'Your car has been posted and is now listed in the search results.' },
    needlogin:  { type: 'error',   text: 'You need to sign in with a seller account before doing that.' },
    wiped:      { type: 'info',    text: 'All local data has been cleared (sellers, cars and the current session).' }
  };

  function renderFlash() {
    var slot = document.querySelector('[data-flash]');
    if (!slot) { return; }

    var params = new URLSearchParams(window.location.search);
    var keys = Object.keys(FLASH_MESSAGES);

    for (var i = 0; i < keys.length; i++) {
      if (params.get(keys[i]) === '1') {
        var cfg = FLASH_MESSAGES[keys[i]];
        slot.innerHTML =
          '<div class="alert alert-' + cfg.type + '" role="status">' +
            Store.esc(cfg.text) +
          '</div>';
        return;
      }
    }
  }

  function init() {
    markCurrent();
    renderNavSession();
    renderHeaderSession();
    renderFooterYear();
    renderFlash();
    bindLogout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
