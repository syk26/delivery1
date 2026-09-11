(function () {
  'use strict';

  var LATEST_COUNT = 3;

  function setStat(key, value) {
    var el = document.querySelector('[data-stat="' + key + '"]');
    if (el) { el.textContent = String(value); }
  }

  function renderStats() {
    var cars = Store.getCars();
    var sellers = Store.getSellers();

    var seen = {};
    cars.forEach(function (car) {
      var key = String(car.location || '').trim().toLowerCase();
      if (key) { seen[key] = true; }
    });

    setStat('cars', cars.length);
    setStat('sellers', sellers.length);
    setStat('cities', Object.keys(seen).length);
  }

  function renderLatest() {
    var slot = document.querySelector('[data-latest-cars]');
    if (!slot) { return; }

    var cars = Store.getCars().slice(0, LATEST_COUNT);

    if (cars.length === 0) {
      slot.classList.remove('car-grid');
      slot.innerHTML = Cards.emptyState({
        title: 'No cars listed yet',
        text: 'The platform is empty at the moment. You can load five sample cars ' +
              'from the search page to see how it works, or register as a seller ' +
              'and post your first car.',
        actionLabel: 'Go to the search page',
        actionHref: 'search.html'
      });
      return;
    }

    slot.innerHTML = Cards.carCards(cars);
  }

  function init() {
    renderStats();
    renderLatest();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
