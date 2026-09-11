(function () {
  'use strict';

  function renderLoggedOut() {
    return '' +
      '<div class="status-card">' +
        '<div class="status-top">' +
          '<div>' +
            '<h2 id="status-title">You are not signed in</h2>' +
            '<p>Register a seller account to post car adverts. Buyers do not need ' +
               'an account: they can <a href="search.html">search the listings</a> ' +
               'and open any car detail page straight away.</p>' +
          '</div>' +
          '<div class="status-actions">' +
            '<a class="btn btn-primary" href="register.html">Register a seller account</a>' +
            '<a class="btn btn-ghost" href="login.html">I already have an account</a>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderLoggedIn(seller, carCount) {
    function row(label, value) {
      return '<div><dt>' + Store.esc(label) + '</dt>' +
                   '<dd>' + Store.esc(value) + '</dd></div>';
    }

    return '' +
      '<div class="status-card status-card--in">' +
        '<div class="status-top">' +
          '<div>' +
            '<h2 id="status-title">Welcome back, ' + Store.esc(seller.name) + '</h2>' +
            '<p>You are signed in and can post car adverts.</p>' +
          '</div>' +
          '<div class="status-actions">' +
            '<a class="btn btn-primary" href="addcar.html">Post a car</a>' +
            '<a class="btn btn-ghost" href="#" data-logout>Sign out</a>' +
          '</div>' +
        '</div>' +
        '<dl class="status-grid">' +
          row('Username', seller.username) +
          row('Email', seller.email) +
          row('Phone', seller.phone) +
          row('Address', seller.address) +
          row('Registered on', Store.formatDate(seller.createdAt)) +
          row('Cars posted', carCount === 1 ? '1 car' : carCount + ' cars') +
        '</dl>' +
      '</div>';
  }

  function renderStatus() {
    var slot = document.querySelector('[data-status-panel]');
    if (!slot) { return null; }

    var seller = Store.currentSeller();
    slot.innerHTML = seller
      ? renderLoggedIn(seller, Store.getCarsBySeller(seller.id).length)
      : renderLoggedOut();

    return seller;
  }

  function renderMyCars(seller) {
    var section = document.querySelector('[data-mycars]');
    var grid = document.querySelector('[data-mycars-grid]');
    if (!section || !grid || !seller) { return; }

    var cars = Store.getCarsBySeller(seller.id);
    section.hidden = false;

    if (cars.length === 0) {
      grid.classList.remove('car-grid');
      grid.innerHTML = Cards.emptyState({
        title: 'You have not posted any cars yet',
        text: 'Once you post your first car it will appear here immediately, ' +
              'and buyers will be able to find it through search.',
        actionLabel: 'Post a car',
        actionHref: 'addcar.html'
      });
      return;
    }

    grid.innerHTML = Cards.carCards(cars);
  }

  function init() {
    renderMyCars(renderStatus());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
