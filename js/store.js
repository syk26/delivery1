var Store = (function () {
  'use strict';

  var KEYS = {
    sellers: 'ocs.sellers',
    cars:    'ocs.cars',
    session: 'ocs.session'
  };

  var storageAvailable = (function () {
    try {
      var probe = '__ocs_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return true;
    } catch (e) {
      return false;
    }
  })();

  var memoryFallback = {};

  function read(key, fallback) {
    var raw;
    try {
      raw = storageAvailable ? window.localStorage.getItem(key)
                             : (memoryFallback[key] || null);
    } catch (e) {
      return fallback;
    }
    if (raw === null || raw === undefined) { return fallback; }
    try {
      var parsed = JSON.parse(raw);
      return parsed === null ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    var raw;
    try {
      raw = JSON.stringify(value);
    } catch (e) {
      return { ok: false, error: 'Could not serialise the data. Please try again.' };
    }

    try {
      if (storageAvailable) {
        window.localStorage.setItem(key, raw);
      } else {
        memoryFallback[key] = raw;
      }
      return { ok: true, error: '' };
    } catch (e) {
      if (e && (e.name === 'QuotaExceededError' ||
                e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
                e.code === 22)) {
        return {
          ok: false,
          error: 'Browser local storage is full (about 5 MB). Use "Clear all data" on the search page and try again, or upload fewer images.'
        };
      }
      return {
        ok: false,
        error: 'Could not save: ' + (e && e.message ? e.message : 'unknown error')
      };
    }
  }

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) +
           '_' + Math.random().toString(36).slice(2, 8);
  }

  function byNewest(a, b) {
    return String(b.createdAt).localeCompare(String(a.createdAt));
  }

  function asArray(v) {
    return Array.isArray(v) ? v : [];
  }

  var api = {};

  api.KEYS = KEYS;
  api.uid = uid;
  api.isStorageAvailable = function () { return storageAvailable; };

  api.esc = function (value) {
    if (value === null || value === undefined) { return ''; }
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  api.safeImageSrc = function (src, fallback) {
    return (typeof src === 'string' && src.indexOf('data:image/') === 0)
      ? src
      : (fallback || '');
  };

  api.getSellers = function () {
    return asArray(read(KEYS.sellers, []));
  };

  api.findByUsername = function (username) {
    var target = String(username || '').trim().toLowerCase();
    var list = api.getSellers();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].username).toLowerCase() === target) { return list[i]; }
    }
    return null;
  };

  api.findByEmail = function (email) {
    var target = String(email || '').trim().toLowerCase();
    var list = api.getSellers();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].email).toLowerCase() === target) { return list[i]; }
    }
    return null;
  };

  api.getSellerById = function (id) {
    var list = api.getSellers();
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { return list[i]; }
    }
    return null;
  };

  api.addSeller = function (record) {
    if (!record || !record.username || !record.password) {
      return { ok: false, code: 'incomplete', error: 'The registration data is incomplete.', seller: null };
    }
    if (api.findByUsername(record.username)) {
      return { ok: false, code: 'username-taken', error: 'That username is already taken. Please choose another one.', seller: null };
    }
    if (api.findByEmail(record.email)) {
      return { ok: false, code: 'email-taken', error: 'That email address is already registered. Please use another one, or sign in.', seller: null };
    }

    var seller = {
      id:        uid('sel'),
      name:      String(record.name).trim(),
      address:   String(record.address).trim(),
      phone:     String(record.phone).trim(),
      email:     String(record.email).trim(),
      username:  String(record.username).trim(),
      password:  String(record.password),
      createdAt: new Date().toISOString()
    };

    var list = api.getSellers();
    list.push(seller);

    var result = write(KEYS.sellers, list);
    if (!result.ok) { return { ok: false, code: 'storage', error: result.error, seller: null }; }

    return { ok: true, code: '', error: '', seller: seller };
  };

  api.getSession = function () {
    var s = read(KEYS.session, null);
    if (!s || !s.sellerId) { return null; }
    return api.getSellerById(s.sellerId) ? s : null;
  };

  api.isLoggedIn = function () { return api.getSession() !== null; };

  api.currentSeller = function () {
    var s = api.getSession();
    return s ? api.getSellerById(s.sellerId) : null;
  };

  api.login = function (username, password) {
    var seller = api.findByUsername(username);
    if (!seller || seller.password !== String(password)) {
      return { ok: false, error: 'Invalid username or password.' };
    }
    var session = { sellerId: seller.id, username: seller.username,
                    loginAt: new Date().toISOString() };
    var result = write(KEYS.session, session);
    if (!result.ok) { return { ok: false, error: result.error }; }
    return { ok: true, error: '', seller: seller };
  };

  api.logout = function () {
    try {
      if (storageAvailable) { window.localStorage.removeItem(KEYS.session); }
      else { delete memoryFallback[KEYS.session]; }
    } catch (e) {
      return;
    }
  };

  api.getCars = function () {
    return asArray(read(KEYS.cars, [])).slice().sort(byNewest);
  };

  api.countCars = function () { return api.getCars().length; };

  api.getCarById = function (id) {
    var list = asArray(read(KEYS.cars, []));
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) { return list[i]; }
    }
    return null;
  };

  api.getCarsBySeller = function (sellerId) {
    return api.getCars().filter(function (c) { return c.sellerId === sellerId; });
  };

  api.addCar = function (data) {
    var seller = api.currentSeller();
    if (!seller) {
      return { ok: false, error: 'Please sign in before posting a car.', car: null };
    }

    var car = {
      id:         uid('car'),
      sellerId:   seller.id,
      sellerName: seller.name,
      colour:     String(data.colour).trim(),
      model:      String(data.model).trim(),
      year:       Number(data.year),
      location:   String(data.location).trim(),
      price:      Number(data.price),
      image:      api.safeImageSrc(data.image, ''),
      notes:      String(data.notes || '').trim(),
      createdAt:  new Date().toISOString()
    };

    var list = asArray(read(KEYS.cars, []));
    list.push(car);

    var result = write(KEYS.cars, list);
    if (!result.ok) { return { ok: false, error: result.error, car: null }; }

    return { ok: true, error: '', car: car };
  };

  api.searchCars = function (criteria) {
    var c = criteria || {};
    var model = String(c.model || '').trim().toLowerCase();
    var yearRaw = String(c.year || '').trim();
    var year = /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null;

    return api.getCars().filter(function (car) {
      var matchModel = !model ||
        String(car.model).toLowerCase().indexOf(model) !== -1;
      var matchYear = year === null || Number(car.year) === year;
      return matchModel && matchYear;
    });
  };

  api.formatPrice = function (value) {
    var n = Number(value);
    if (!isFinite(n)) { return '\u2014'; }
    return '\u00a5' + n.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  api.formatDate = function (iso) {
    var d = new Date(iso);
    if (isNaN(d.getTime())) { return '\u2014'; }
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
           ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  };

  function placeholderImage(bodyColour) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
        '<rect width="400" height="300" fill="#e9edf2"/>' +
        '<rect y="212" width="400" height="88" fill="#d3dae2"/>' +
        '<g transform="translate(60 78)">' +
          '<path d="M28 96 L52 44 Q58 32 74 32 H172 Q188 32 196 44 L232 96 Z" fill="' + bodyColour + '"/>' +
          '<rect x="12" y="90" width="256" height="46" rx="16" fill="' + bodyColour + '"/>' +
          '<rect x="60" y="48" width="52" height="34" rx="5" fill="#cfe3f2"/>' +
          '<rect x="124" y="48" width="58" height="34" rx="5" fill="#cfe3f2"/>' +
          '<circle cx="70" cy="138" r="25" fill="#20262e"/>' +
          '<circle cx="70" cy="138" r="11" fill="#98a2ad"/>' +
          '<circle cx="210" cy="138" r="25" fill="#20262e"/>' +
          '<circle cx="210" cy="138" r="11" fill="#98a2ad"/>' +
        '</g>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  api.placeholderImage = placeholderImage;

  var DEMO_SELLER = {
    id: 'sel_demo', name: 'Demo Seller', username: 'demoseller',
    password: 'demo123', email: 'demo@autolink.com',
    phone: '13800138000', address: '100 Demo Road Beijing',
    createdAt: '2026-03-20T09:00:00.000Z'
  };

  var DEMO_CARS = [
    { colour: 'White',  model: 'Toyota Camry',    year: 2021, location: 'Beijing',  price: 128000, body: '#f2f4f7',
      notes: 'One previous owner, full dealership service history, no accidents and no flood damage.' },
    { colour: 'Silver', model: 'Honda Civic',     year: 2019, location: 'Shanghai', price: 89000,  body: '#c4cad2',
      notes: 'Privately owned daily driver, 62,000 km on the clock, four brand new tyres.' },
    { colour: 'Blue',   model: 'BMW 3 Series',    year: 2020, location: 'Shenzhen', price: 215000, body: '#2f5f9e',
      notes: '325Li M Sport package, panoramic roof, heated front seats.' },
    { colour: 'Black',  model: 'BYD Han EV',      year: 2023, location: 'Hangzhou', price: 176000, body: '#23282e',
      notes: 'Long range all electric variant, home charging point included, still under warranty.' },
    { colour: 'Red',    model: 'Volkswagen Golf', year: 2018, location: 'Chengdu',  price: 62000,  body: '#b3282d',
      notes: '280TSI automatic comfort trim, aftermarket suspension reverted to stock.' }
  ];

  api.seedDemoData = function () {
    var sellers = api.getSellers().filter(function (s) { return s.id !== DEMO_SELLER.id; });
    sellers.push(DEMO_SELLER);
    var r1 = write(KEYS.sellers, sellers);
    if (!r1.ok) { return { ok: false, error: r1.error, count: 0 }; }

    var cars = asArray(read(KEYS.cars, [])).filter(function (c) {
      return c.sellerId !== DEMO_SELLER.id;
    });

    DEMO_CARS.forEach(function (spec, index) {
      cars.push({
        id:         'car_demo_' + index,
        sellerId:   DEMO_SELLER.id,
        sellerName: DEMO_SELLER.name,
        colour:     spec.colour,
        model:      spec.model,
        year:       spec.year,
        location:   spec.location,
        price:      spec.price,
        image:      placeholderImage(spec.body),
        notes:      spec.notes,
        createdAt:  new Date(2026, 2, 21 + index, 10, 0, 0).toISOString()
      });
    });

    var r2 = write(KEYS.cars, cars);
    if (!r2.ok) { return { ok: false, error: r2.error, count: 0 }; }

    return { ok: true, error: '', count: DEMO_CARS.length };
  };

  api.clearAll = function () {
    [KEYS.sellers, KEYS.cars, KEYS.session].forEach(function (k) {
      try {
        if (storageAvailable) { window.localStorage.removeItem(k); }
        else { delete memoryFallback[k]; }
      } catch (e) {
        return;
      }
    });
  };

  api.demoAccount = { username: DEMO_SELLER.username, password: DEMO_SELLER.password };

  return api;
})();
