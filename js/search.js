(function () {
  'use strict';

  var form       = document.getElementById('searchForm');
  var modelInput = document.getElementById('model');
  var yearInput  = document.getElementById('year');
  var modelTip   = document.getElementById('model-tip');
  var yearTip    = document.getElementById('year-tip');
  var clearBtn   = document.getElementById('clearBtn');

  var resultsEl  = document.querySelector('[data-results]');
  var summaryEl  = document.querySelector('[data-result-summary]');

  var seedBtn    = document.getElementById('seedBtn');
  var wipeBtn    = document.getElementById('wipeBtn');
  var statusEl   = document.querySelector('[data-demo-status]');

  var wipeTimer = null;

  function readUrl() {
    var params = new URLSearchParams(window.location.search);
    var model = params.get('model') || '';
    var year = params.get('year') || '';
    if (!/^\d{4}$/.test(year)) { year = ''; }
    return { model: model.slice(0, 40), year: year };
  }

  function toQueryString(criteria) {
    var params = new URLSearchParams();
    if (criteria.model) { params.set('model', criteria.model); }
    if (criteria.year)  { params.set('year', criteria.year); }
    var qs = params.toString();
    return qs ? '?' + qs : '';
  }

  function syncUrl(criteria) {
    var url = 'search.html' + toQueryString(criteria);
    try {
      window.history.replaceState(null, '', url);
    } catch (e) {
      return;
    }
  }

  function backHref(criteria) {
    return 'search.html' + toQueryString(criteria);
  }

  function setSummary(html) {
    if (summaryEl) { summaryEl.innerHTML = html; }
  }

  function setStatus(text, isError) {
    if (!statusEl) { return; }
    statusEl.textContent = text || '';
    statusEl.classList.toggle('is-error', Boolean(isError));
  }

  function hasCriteria(criteria) {
    return Boolean(criteria.model || criteria.year);
  }

  function describeCriteria(criteria) {
    var parts = [];
    if (criteria.model) { parts.push('a model containing "' + criteria.model + '"'); }
    if (criteria.year)  { parts.push('the year ' + criteria.year); }
    return parts.length ? parts.join(' and ') : 'your search criteria';
  }

  function pluralCars(n) {
    return '<span class="result-count">' + n + '</span> ' + (n === 1 ? 'car' : 'cars');
  }

  function render(cars, criteria) {
    if (!resultsEl) { return; }

    var total = Store.countCars();

    if (total === 0) {
      resultsEl.classList.remove('car-grid');
      resultsEl.innerHTML = Cards.emptyState({
        title: 'There are no cars on the platform yet',
        text: 'This is a fresh demonstration environment and the data lives in your own ' +
              'browser. You can load five sample cars to see how it works, or register ' +
              'a seller account and post a car yourself.',
        extraHtml:
          '<div class="row">' +
            '<button type="button" class="btn btn-secondary" data-seed-inline>Load sample data</button>' +
            '<a class="btn btn-ghost" href="register.html">Register as a seller</a>' +
          '</div>'
      });
      setSummary('There are no cars for sale at the moment.');
      bindInlineSeed();
      return;
    }

    if (cars.length === 0) {
      resultsEl.classList.remove('car-grid');
      resultsEl.innerHTML = Cards.emptyState({
        title: 'No cars matched your search',
        text: 'None of the ' + total + ' cars currently for sale match ' +
              describeCriteria(criteria) + '. Try entering only a model, only a year, ' +
              'or a shorter model keyword.',
        actionLabel: 'Clear the search criteria',
        actionHref: 'search.html'
      });
      setSummary('No cars matched your criteria. The platform holds ' +
                 pluralCars(total) + ' in total.');
      return;
    }

    resultsEl.classList.add('car-grid');
    resultsEl.innerHTML = Cards.carCards(cars, {
      href: function (car) {
        return 'car.html?id=' + encodeURIComponent(car.id) +
               '&back=' + encodeURIComponent(backHref(criteria));
      }
    });

    if (hasCriteria(criteria)) {
      setSummary('Found ' + pluralCars(cars.length) + ' matching ' +
                 Store.esc(describeCriteria(criteria)) + ', out of ' + total +
                 ' on the platform.');
    } else {
      setSummary('Showing all ' + pluralCars(total) + ' on the platform.');
    }
  }

  function bindInlineSeed() {
    var btn = document.querySelector('[data-seed-inline]');
    if (btn) { btn.addEventListener('click', handleSeed); }
  }

  function runSearch(criteria, options) {
    var opts = options || {};

    var rModel = Validate.run(criteria.model, ['searchModel']);
    var rYear  = Validate.run(criteria.year,  ['searchYear']);
    Validate.paint(modelInput, modelTip, rModel, false);
    Validate.paint(yearInput,  yearTip,  rYear,  false);

    if (!rModel.ok || !rYear.ok) {
      (!rModel.ok ? modelInput : yearInput).focus();
      setSummary('The search criteria are not valid. Please correct them and try again.');
      return;
    }

    var clean = { model: rModel.value, year: rYear.value };
    if (opts.syncUrl !== false) { syncUrl(clean); }

    render(Store.searchCars(clean), clean);
  }

  function handleSubmit(e) {
    e.preventDefault();
    runSearch({ model: modelInput.value, year: yearInput.value });
  }

  function handleClear() {
    modelInput.value = '';
    yearInput.value = '';
    Validate.paint(modelInput, modelTip, { ok: true, value: '', message: '' }, false);
    Validate.paint(yearInput,  yearTip,  { ok: true, value: '', message: '' }, false);
    setStatus('');
    runSearch({ model: '', year: '' });
    modelInput.focus();
  }

  function handleSeed() {
    var result = Store.seedDemoData();
    if (!result.ok) {
      setStatus(result.error, true);
      return;
    }
    var demo = Store.demoAccount || {};
    setStatus('Loaded ' + result.count + ' sample cars. Demo account: ' +
              demo.username + ' / ' + demo.password);
    runSearch({ model: modelInput.value, year: yearInput.value }, { syncUrl: false });
  }

  function handleWipe() {
    if (wipeBtn.getAttribute('data-confirming') === 'true') {
      window.clearTimeout(wipeTimer);
      Store.clearAll();
      window.location.assign('search.html?wiped=1');
      return;
    }

    wipeBtn.setAttribute('data-confirming', 'true');
    wipeBtn.textContent = 'Click again to confirm';
    setStatus('This deletes every seller and car record and signs you out. It cannot be undone.');

    wipeTimer = window.setTimeout(function () {
      wipeBtn.setAttribute('data-confirming', 'false');
      wipeBtn.textContent = 'Clear all data';
      setStatus('');
    }, 4000);
  }

  function init() {
    if (!form || !resultsEl) { return; }

    Validate.attach({ input: modelInput, tip: modelTip, rules: ['searchModel'] });
    Validate.attach({ input: yearInput,  tip: yearTip,  rules: ['searchYear'] });

    form.addEventListener('submit', handleSubmit);
    if (clearBtn) { clearBtn.addEventListener('click', handleClear); }
    if (seedBtn)  { seedBtn.addEventListener('click', handleSeed); }
    if (wipeBtn)  { wipeBtn.addEventListener('click', handleWipe); }

    var initial = readUrl();
    modelInput.value = initial.model;
    yearInput.value = initial.year;
    runSearch(initial, { syncUrl: false });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
