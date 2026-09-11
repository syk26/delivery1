var Cards = (function () {
  'use strict';

  var api = {};

  var FALLBACK_IMAGE =
    'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
        '<rect width="400" height="300" fill="#e9edf2"/>' +
        '<text x="200" y="158" font-family="sans-serif" font-size="18" ' +
              'fill="#8a95a2" text-anchor="middle">No image</text>' +
      '</svg>'
    );

  api.carCard = function (car, opts) {
    if (!car) { return ''; }

    var o = opts || {};
    var href;
    if (typeof o.href === 'function') {
      href = o.href(car);
    } else if (typeof o.href === 'string' && o.href) {
      href = o.href;
    } else {
      href = 'car.html?id=' + encodeURIComponent(car.id);
    }

    var src = Store.safeImageSrc(car.image, FALLBACK_IMAGE);
    var alt = 'Photo of the ' + Store.esc(car.colour) + ' ' + Store.esc(car.model);

    return '' +
      '<article class="car-card">' +
        '<a class="car-card-link" href="' + Store.esc(href) + '">' +

          '<div class="car-card-img">' +
            '<img src="' + src + '" alt="' + alt + '" loading="lazy" width="400" height="300">' +
          '</div>' +

          '<div class="car-card-body">' +
            '<h3 class="car-card-title">' + Store.esc(car.model) + '</h3>' +
            '<p class="car-card-meta">' +
              Store.esc(car.year) + ' &middot; ' +
              Store.esc(car.colour) + ' &middot; ' +
              Store.esc(car.location) +
            '</p>' +
            '<p class="car-card-price">' + Store.esc(Store.formatPrice(car.price)) + '</p>' +
          '</div>' +

          '<div class="car-card-foot">' +
            '<span class="btn btn-primary btn-sm btn-block">View details</span>' +
          '</div>' +

        '</a>' +
      '</article>';
  };

  api.carCards = function (cars, opts) {
    var list = Array.isArray(cars) ? cars : [];
    return list.map(function (car) { return api.carCard(car, opts); }).join('');
  };

  api.emptyState = function (opts) {
    var o = opts || {};
    var html = '<div class="empty">';
    html += '<h3>' + Store.esc(o.title || 'Nothing here yet') + '</h3>';
    if (o.text) { html += '<p>' + Store.esc(o.text) + '</p>'; }
    if (o.actionLabel && o.actionHref) {
      html += '<a class="btn btn-secondary" href="' + Store.esc(o.actionHref) + '">' +
                Store.esc(o.actionLabel) + '</a>';
    }
    if (o.extraHtml) { html += o.extraHtml; }
    html += '</div>';
    return html;
  };

  api.FALLBACK_IMAGE = FALLBACK_IMAGE;

  return api;
})();
