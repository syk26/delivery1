(function () {
  'use strict';

  var detailEl  = document.querySelector('[data-detail]');
  var notfoundEl = document.querySelector('[data-notfound]');

  function setText(selector, value) {
    var nodes = document.querySelectorAll(selector);
    var text = (value === null || value === undefined) ? '' : String(value);
    for (var i = 0; i < nodes.length; i++) { nodes[i].textContent = text; }
  }

  function setHref(selector, url) {
    var node = document.querySelector(selector);
    if (!node) { return; }
    if (/^(mailto:|tel:|https?:|search\.html|index\.html|seller\.html|#)/.test(url)) {
      node.setAttribute('href', url);
    }
  }

  function toggle(selector, show) {
    var node = document.querySelector(selector);
    if (node) { node.hidden = !show; }
  }

  function showNotFound(reason) {
    if (detailEl) { detailEl.hidden = true; }
    if (notfoundEl) { notfoundEl.hidden = false; }

    var reasonEl = document.querySelector('[data-notfound-reason]');
    if (reasonEl && reason) { reasonEl.textContent = reason; }

    setText('[data-crumb-current]', 'Not found');
    document.title = 'Car not found \u2014 AutoLink Online Car Sales';
  }

  function renderCar(car, backHref) {
    if (notfoundEl) { notfoundEl.hidden = true; }
    if (detailEl) { detailEl.hidden = false; }

    var img = document.querySelector('[data-d-img]');
    if (img) {
      img.src = Store.safeImageSrc(car.image, Cards.FALLBACK_IMAGE);
      img.alt = 'Photo of the ' + car.colour + ' ' + car.model;
    }
    setText('[data-d-imgcap]',
      'Photo uploaded by the seller. Posted on ' + Store.formatDate(car.createdAt));

    setText('[data-d-title]', car.model);
    setText('[data-d-price]', Store.formatPrice(car.price));

    setText('[data-d-year]', car.year);
    setText('[data-d-location]', car.location);

    setText('[data-d-model]',    car.model);
    setText('[data-d-year2]',    car.year);
    setText('[data-d-colour]',   car.colour);
    setText('[data-d-location2]', car.location);
    setText('[data-d-price2]',   Store.formatPrice(car.price));
    setText('[data-d-posted]',   Store.formatDate(car.createdAt));
    setText('[data-d-id]',       car.id);
    setText('[data-d-id2]',      car.id);

    var notes = String(car.notes || '').trim();
    toggle('[data-d-notes-wrap]', notes.length > 0);
    if (notes.length > 0) {
      setText('[data-d-notes]', notes);
    }

    var seller = Store.getSellerById(car.sellerId);
    if (seller) {
      setText('[data-d-seller]',     seller.name);
      setText('[data-d-selleruser]', seller.username);
      setText('[data-d-sellerdate]', Store.formatDate(seller.createdAt));
      setText('[data-d-address]',    seller.address);

      setText('[data-d-email]', seller.email);
      setHref('[data-d-email]', 'mailto:' + seller.email);

      setText('[data-d-phone]', seller.phone);
      setHref('[data-d-phone]', 'tel:+86' + seller.phone);
    } else {
      setText('[data-d-seller]', car.sellerName || '(seller record no longer available)');
      setText('[data-d-selleruser]', '\u2014');
      setText('[data-d-sellerdate]', '\u2014');
      setText('[data-d-address]', '\u2014');
      setText('[data-d-email]', '\u2014');
      setText('[data-d-phone]', '\u2014');
    }

    var others = Store.getCarsBySeller(car.sellerId).filter(function (c) {
      return c.id !== car.id;
    });
    var otherWrap = document.querySelector('[data-d-other-wrap]');
    var otherGrid = document.querySelector('[data-d-other-grid]');
    if (otherWrap && otherGrid) {
      if (others.length === 0) {
        otherWrap.hidden = true;
      } else {
        otherWrap.hidden = false;
        otherGrid.innerHTML = Cards.carCards(others, { href: backHrefFor });
      }
    }

    setText('[data-crumb-current]', car.model);
    setHref('[data-crumb-search]', backHref);
    setHref('[data-d-back]', backHref);

    document.title = car.model + ' (' + car.year + ' \u00b7 ' +
                     Store.formatPrice(car.price) + ') \u2014 AutoLink Online Car Sales';
  }

  function backHrefFor(car) {
    return 'car.html?id=' + encodeURIComponent(car.id) +
           '&back=' + encodeURIComponent(currentBack);
  }

  var currentBack = 'search.html';

  function init() {
    var params = new URLSearchParams(window.location.search);

    var rawBack = params.get('back') || '';
    if (/^search\.html(\?.*)?$/.test(rawBack)) {
      currentBack = rawBack;
    }

    var id = params.get('id') || '';

    if (!id) {
      showNotFound('The link is missing a car id parameter. Please open a car from the search results instead.');
      return;
    }

    var car = Store.getCarById(id);
    if (!car) {
      showNotFound('There is no car with the id "' + id + '". It may have been removed, ' +
                   'or the local data may have been cleared.');
      return;
    }

    renderCar(car, currentBack);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
