(function () {
  'use strict';

  var MAX_EDGE = 800;
  var JPEG_QUALITY = 0.7;
  var JPEG_PREFIX = 'data:image/jpeg;base64,';

  var FIELDS = [
    { key: 'model',    input: 'model',    tip: 'model-tip',
      label: 'Model',       rules: ['required', 'model'] },
    { key: 'year',     input: 'year',     tip: 'year-tip',
      label: 'Year',        rules: ['required', 'year'] },
    { key: 'colour',   input: 'colour',   tip: 'colour-tip',
      label: 'Colour',      rules: ['required', 'colour'] },
    { key: 'price',    input: 'price',    tip: 'price-tip',
      label: 'Price',       rules: ['required', 'price'] },
    { key: 'location', input: 'location', tip: 'location-tip',
      label: 'Location',    rules: ['required', 'location'] },
    { key: 'notes',    input: 'notes',    tip: 'notes-tip',
      label: 'Description', rules: ['notes'] }
  ];

  var gate      = document.querySelector('[data-gate]');
  var formWrap  = document.querySelector('[data-form-wrap]');
  var form      = document.getElementById('carForm');
  var alertBox  = document.getElementById('formAlert');
  var submitBtn = document.getElementById('submitBtn');
  var resetBtn  = document.getElementById('resetBtn');

  var imageInput   = document.getElementById('image');
  var imageTip     = document.getElementById('image-tip');
  var previewBox   = document.querySelector('[data-preview]');
  var previewImg   = document.querySelector('[data-preview-img]');
  var previewInfo  = document.querySelector('[data-preview-info]');
  var previewRemove = document.querySelector('[data-preview-remove]');
  var sampleImgBtn = document.getElementById('useSampleImg');

  var pendingImage = null;
  var busy = false;

  function el(id) { return document.getElementById(id); }

  function showAlert(html) {
    alertBox.innerHTML = html;
    alertBox.hidden = false;
  }
  function hideAlert() {
    alertBox.hidden = true;
    alertBox.innerHTML = '';
  }

  function setImageError(message) {
    if (!imageTip) { return; }
    imageTip.textContent = message || '';
    imageTip.classList.toggle('is-shown', Boolean(message));
    if (imageInput) {
      if (message) { imageInput.setAttribute('aria-invalid', 'true'); }
      else { imageInput.removeAttribute('aria-invalid'); }
    }
  }

  function humanSize(bytes) {
    if (bytes < 1024) { return bytes + ' B'; }
    if (bytes < 1024 * 1024) { return (bytes / 1024).toFixed(1) + ' KB'; }
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  }

  function applyGate() {
    var ok = Store.isLoggedIn();
    if (gate) { gate.hidden = ok; }
    if (formWrap) { formWrap.hidden = !ok; }
    return ok;
  }

  function compressImage(file) {
    return new Promise(function (resolve, reject) {

      var reader = new FileReader();

      reader.onerror = function () {
        reject(new Error('Could not read the image file. It may have been moved, or the browser may not have permission to read it.'));
      };

      reader.onload = function () {
        var img = new Image();

        img.onerror = function () {
          reject(new Error('Could not decode the image. The file may be corrupt or in an unsupported format.'));
        };

        img.onload = function () {
          var w = img.naturalWidth;
          var h = img.naturalHeight;

          if (!w || !h) {
            reject(new Error('Could not read the image dimensions.'));
            return;
          }

          var scale = Math.min(1, MAX_EDGE / Math.max(w, h));
          var tw = Math.max(1, Math.round(w * scale));
          var th = Math.max(1, Math.round(h * scale));

          var canvas = document.createElement('canvas');
          canvas.width = tw;
          canvas.height = th;

          var ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('This browser does not support canvas, so the image cannot be compressed.'));
            return;
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, tw, th);
          ctx.drawImage(img, 0, 0, tw, th);

          var dataUrl;
          try {
            dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          } catch (err) {
            reject(new Error('Could not export the image: ' + (err.message || 'unknown error')));
            return;
          }

          var approxBytes = Math.round((dataUrl.length - JPEG_PREFIX.length) * 3 / 4);

          resolve({
            dataUrl: dataUrl,
            bytes: approxBytes,
            width: tw,
            height: th,
            originalBytes: file.size,
            originalWidth: w,
            originalHeight: h
          });
        };

        img.src = reader.result;
      };

      reader.readAsDataURL(file);
    });
  }

  function renderPreview(info) {
    if (!previewBox || !previewImg || !previewInfo) { return; }
    previewImg.src = info.dataUrl;

    if (info.isSample) {
      previewInfo.innerHTML =
        '<strong>Sample placeholder</strong> 400\u00d7300 \u00b7 about ' + humanSize(info.bytes) + '<br>' +
        'Generated from the colour you entered above. No photograph was uploaded.';
    } else {
      previewInfo.innerHTML =
        '<strong>' + Store.esc(info.originalWidth) + '\u00d7' + Store.esc(info.originalHeight) +
        '</strong> \u2192 <strong>' + info.width + '\u00d7' + info.height + '</strong><br>' +
        'Original ' + humanSize(info.originalBytes) + ' \u2192 about ' + humanSize(info.bytes) + ' after compression';
    }

    previewBox.hidden = false;
  }

  function clearPreview() {
    pendingImage = null;
    if (previewBox) { previewBox.hidden = true; previewBox.classList.remove('is-busy'); }
    if (previewImg) { previewImg.removeAttribute('src'); }
    if (imageInput) { imageInput.value = ''; }
    setImageError('');
  }

  function handleFileChange() {
    var file = imageInput.files && imageInput.files[0];

    if (!file) { clearPreview(); return; }

    var check = Validate.checkFile(file);
    if (!check.ok) {
      clearPreview();
      setImageError(check.message);
      return;
    }

    if (previewBox) { previewBox.classList.add('is-busy'); }
    if (submitBtn) { submitBtn.disabled = true; }

    compressImage(file).then(function (info) {
      pendingImage = info;
      setImageError('');
      renderPreview(info);
    }).catch(function (err) {
      pendingImage = null;
      if (previewBox) { previewBox.hidden = true; }
      setImageError(err.message || 'The image could not be processed.');
    }).then(function () {
      if (previewBox) { previewBox.classList.remove('is-busy'); }
      if (submitBtn) { submitBtn.disabled = false; }
    });
  }

  var COLOUR_HEX = {
    'white':  '#f2f4f7',
    'silver': '#c4cad2',
    'black':  '#23282e',
    'blue':   '#2f5f9e',
    'red':    '#b3282d',
    'green':  '#2f6b45',
    'grey':   '#7c848d',
    'gray':   '#7c848d',
    'yellow': '#d9a520',
    'brown':  '#6b4a2f'
  };

  function bodyColourFor(text) {
    var v = String(text || '').trim().toLowerCase();
    for (var key in COLOUR_HEX) {
      if (Object.prototype.hasOwnProperty.call(COLOUR_HEX, key) &&
          v.indexOf(key) !== -1) {
        return COLOUR_HEX[key];
      }
    }
    return '#9aa4ae';
  }

  function applySampleImage() {
    var colourInput = el('colour');
    var dataUrl = Store.placeholderImage(
      bodyColourFor(colourInput ? colourInput.value : '')
    );

    pendingImage = {
      dataUrl:         dataUrl,
      width:           400,
      height:          300,
      originalWidth:   400,
      originalHeight:  300,
      bytes:           dataUrl.length,
      originalBytes:   dataUrl.length,
      isSample:        true
    };

    setImageError('');
    renderPreview(pendingImage);
  }

  function syncSampleWithColour() {
    if (pendingImage && pendingImage.isSample) { applySampleImage(); }
  }

  function bindCounter() {
    var notes = el('notes');
    var counter = document.querySelector('[data-count]');
    if (!notes || !counter) { return; }
    notes.addEventListener('input', function () {
      counter.textContent = String(notes.value.length);
    });
  }

  function applyYearRange() {
    var max = Validate.CURRENT_YEAR + 1;
    var slot = document.querySelector('[data-max-year]');
    if (slot) { slot.textContent = String(max); }
    var yearInput = el('year');
    if (yearInput) {
      yearInput.setAttribute('placeholder', String(Validate.CURRENT_YEAR));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (busy) { return; }

    if (!Store.isLoggedIn()) { applyGate(); return; }

    hideAlert();

    var values = {};
    var errors = [];
    var firstBad = null;

    FIELDS.forEach(function (field) {
      var input = el(field.input);
      if (!input) { return; }
      var result = Validate.run(input.value, field.rules);
      Validate.paint(input, el(field.tip), result, false);
      if (result.ok) {
        values[field.key] = result.value;
      } else {
        errors.push({ label: field.label, message: result.message });
        if (!firstBad) { firstBad = input; }
      }
    });

    if (!pendingImage) {
      errors.push({
        label: 'Car image',
        message: 'Please choose an image of the car. It will be compressed automatically before it is saved.'
      });
      setImageError('Please choose an image of the car.');
      if (!firstBad) { firstBad = imageInput; }
    }

    if (errors.length > 0) {
      var listHtml = errors.map(function (err) {
        return '<li><strong>' + Store.esc(err.label) + '</strong>: ' +
               Store.esc(err.message) + '</li>';
      }).join('');
      showAlert('<strong>' + errors.length + (errors.length === 1
                  ? ' field needs to be corrected'
                  : ' fields need to be corrected') + '</strong>' +
                '<ul class="alert-list">' + listHtml + '</ul>');
      if (firstBad) { firstBad.focus(); }
      return;
    }

    busy = true;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Posting...'; }

    var result = Store.addCar({
      colour:   values.colour,
      model:    values.model,
      year:     values.year,
      location: values.location,
      price:    values.price,
      notes:    values.notes,
      image:    pendingImage.dataUrl
    });

    if (!result.ok) {
      busy = false;
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Post car'; }
      showAlert('<strong>Posting failed.</strong> ' + Store.esc(result.error));
      return;
    }

    showAlert('<strong>Posted successfully.</strong> Opening the detail page for this car...');
    window.location.assign('car.html?id=' + encodeURIComponent(result.car.id) + '&posted=1');
  }

  function handleReset() {
    window.setTimeout(function () {
      hideAlert();
      busy = false;
      FIELDS.forEach(function (field) {
        var input = el(field.input);
        if (input) { input.removeAttribute('aria-invalid'); }
        var tip = el(field.tip);
        if (tip) { tip.classList.remove('is-shown'); tip.textContent = ''; }
      });
      clearPreview();
      var counter = document.querySelector('[data-count]');
      if (counter) { counter.textContent = '0'; }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Post car'; }
      var first = el('model');
      if (first) { first.focus(); }
    }, 0);
  }

  function init() {
    if (!applyGate()) { return; }
    if (!form) { return; }

    applyYearRange();

    FIELDS.forEach(function (field) {
      var input = el(field.input);
      if (!input) { return; }
      Validate.attach({ input: input, tip: el(field.tip), rules: field.rules });
    });

    if (imageInput) { imageInput.addEventListener('change', handleFileChange); }
    if (sampleImgBtn) { sampleImgBtn.addEventListener('click', applySampleImage); }

    var colourInput = el('colour');
    if (colourInput) { colourInput.addEventListener('input', syncSampleWithColour); }

    if (previewRemove) {
      previewRemove.addEventListener('click', function () {
        clearPreview();
        if (imageInput) { imageInput.focus(); }
      });
    }

    bindCounter();
    form.addEventListener('submit', handleSubmit);
    if (resetBtn) { resetBtn.addEventListener('click', handleReset); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
