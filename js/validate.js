var Validate = (function () {
  'use strict';

  var CURRENT_YEAR = new Date().getFullYear();

  var MAX_IMAGE_BYTES = 5 * 1024 * 1024;

  var rules = {

    required: {
      test: function (v) { return v.length > 0; },
      message: 'This field is required.'
    },

    name: {
      test: function (v) { return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(v); },
      message: 'Name may contain only letters and single spaces, and must not start or end with a space (for example: Zhang San).'
    },

    address: {
      test: function (v) { return /^[A-Za-z0-9 ]+$/.test(v); },
      message: 'Address may contain only letters, digits and spaces (for example: 88 Xueyuan Road Beijing).'
    },

    phone: {
      test: function (v) { return /^1[3-9]\d{9}$/.test(v); },
      message: 'Enter a valid mainland China mobile number: 11 digits, starting with 1 and with a second digit from 3 to 9 (for example: 13800138000).'
    },

    email: {
      test: function (v) { return /^[^@\s]+@[^@\s]+(?:\.[^@.\s]+)*\.(com|cn)$/i.test(v); },
      message: 'Email must contain exactly one @ and must end with .com or .cn (for example: seller@mail.autolink.com).'
    },

    username: {
      test: function (v) { return /^[A-Za-z0-9]{6,}$/.test(v); },
      message: 'Username must be at least 6 characters and may contain only letters and digits. Underscores, spaces and symbols are not allowed.'
    },

    password: {
      test: function (v) { return /^[A-Za-z0-9]{6,}$/.test(v); },
      message: 'Password must be at least 6 characters and may contain only letters and digits.'
    },

    colour: {
      test: function (v) { return /^[A-Za-z][A-Za-z \-]{1,29}$/.test(v); },
      message: 'Colour must be 2 to 30 characters and may contain only letters, spaces and hyphens (for example: White or Light Blue).'
    },

    model: {
      test: function (v) { return /^[A-Za-z0-9][A-Za-z0-9 .\-]{1,39}$/.test(v); },
      message: 'Model must be 2 to 40 characters and may contain only letters, digits, spaces, dots and hyphens (for example: Toyota Camry).'
    },

    year: {
      test: function (v) {
        if (!/^\d{4}$/.test(v)) { return false; }
        var n = Number(v);
        return n >= 1950 && n <= CURRENT_YEAR + 1;
      },
      message: 'Year must be four digits between 1950 and ' + (CURRENT_YEAR + 1) + '.'
    },

    location: {
      test: function (v) { return /^[A-Za-z0-9][A-Za-z0-9 ,.\-]{1,39}$/.test(v); },
      message: 'Location must be 2 to 40 characters and may contain only letters, digits, spaces, commas, dots and hyphens (for example: Chaoyang District, Beijing).'
    },

    price: {
      test: function (v) {
        if (!/^\d+(\.\d{1,2})?$/.test(v)) { return false; }
        var n = Number(v);
        return n > 0 && n <= 99999999;
      },
      message: 'Price must be a number greater than 0, with at most two decimal places, and no more than 99999999. Enter digits only, without a currency symbol or thousands separators.'
    },

    notes: {
      test: function (v) { return v.length === 0 || (v.length <= 500 && !/[<>]/.test(v)); },
      message: 'Notes are optional and limited to 500 characters. The characters < and > are not allowed.'
    },

    searchModel: {
      test: function (v) { return /^[A-Za-z0-9 .\-]{0,40}$/.test(v); },
      message: 'The model keyword is limited to 40 characters and may not contain quotes, angle brackets or other special symbols.'
    },

    searchYear: {
      test: function (v) { return v === '' || /^\d{4}$/.test(v); },
      message: 'Enter a four digit year (for example: 2021), or leave this blank to match any year.'
    },

    optional: {
      test: function () { return true; },
      message: ''
    }
  };

  var api = {};

  api.rules = rules;
  api.MAX_IMAGE_BYTES = MAX_IMAGE_BYTES;
  api.CURRENT_YEAR = CURRENT_YEAR;

  api.run = function (value, names) {
    var v = (value === null || value === undefined) ? '' : String(value).trim();
    var list = names || [];

    for (var i = 0; i < list.length; i++) {
      var rule = rules[list[i]];
      if (!rule) { continue; }
      if (!rule.test(v)) {
        return { ok: false, value: v, message: rule.message };
      }
    }
    return { ok: true, value: v, message: '' };
  };

  api.paint = function (input, tip, result, pristine) {
    if (!input) { return; }

    if (pristine && result.value === '') {
      input.removeAttribute('aria-invalid');
      if (tip) { tip.classList.remove('is-shown'); tip.textContent = ''; }
      return;
    }

    input.setAttribute('aria-invalid', result.ok ? 'false' : 'true');
    if (tip) {
      tip.textContent = result.ok ? '' : result.message;
      tip.classList.toggle('is-shown', !result.ok);
    }
  };

  api.attach = function (cfg) {
    var input = cfg.input;
    var tip = cfg.tip;
    var names = cfg.rules || ['required'];
    var touched = false;

    function check(force) {
      var result = api.run(input.value, names);
      if (!touched && !force) {
        api.paint(input, tip, result, true);
      } else {
        api.paint(input, tip, result, false);
      }
      return result;
    }

    input.addEventListener('blur', function () {
      touched = true;
      check(true);
    });

    input.addEventListener('input', function () {
      if (touched || input.getAttribute('aria-invalid') === 'true') {
        touched = true;
        check(true);
      }
    });

    return check;
  };

  api.checkFile = function (file) {
    if (!file) {
      return { ok: false, message: 'Please choose an image of the car.' };
    }
    if (!/^image\//.test(file.type)) {
      return {
        ok: false,
        message: 'Only image files may be uploaded (jpg, png, webp or gif). The selected type was ' +
                 (file.type || 'unknown') + '.'
      };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return {
        ok: false,
        message: 'The image must not exceed 5 MB. The selected file is ' +
                 (file.size / 1024 / 1024).toFixed(2) + ' MB. Please choose a smaller image.'
      };
    }
    if (file.size === 0) {
      return { ok: false, message: 'That image file is empty (0 bytes). Please choose another one.' };
    }
    return { ok: true, message: '' };
  };

  return api;
})();
