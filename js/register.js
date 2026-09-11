(function () {
  'use strict';

  var FIELDS = [
    { key: 'name',     input: 'name',     tip: 'name-tip',
      label: 'Full name',    rules: ['required', 'name'] },

    { key: 'phone',    input: 'phone',    tip: 'phone-tip',
      label: 'Phone number', rules: ['required', 'phone'] },

    { key: 'address',  input: 'address',  tip: 'address-tip',
      label: 'Address',      rules: ['required', 'address'] },

    { key: 'email',    input: 'email',    tip: 'email-tip',
      label: 'Email',        rules: ['required', 'email'] },

    { key: 'username', input: 'username', tip: 'username-tip',
      label: 'Username',     rules: ['required', 'username'] },

    { key: 'password', input: 'pwd',      tip: 'pwd-tip',
      label: 'Password',     rules: ['required', 'password'] }
  ];

  var form      = document.getElementById('regForm');
  var formAlert = document.getElementById('formAlert');
  var okAlert   = document.getElementById('okAlert');
  var resetBtn  = document.getElementById('resetBtn');

  var checkers = [];

  var submitted = false;

  function el(id) { return document.getElementById(id); }

  function showAlert(node, html) {
    node.innerHTML = html;
    node.hidden = false;
  }
  function hideAlerts() {
    formAlert.hidden = true;
    okAlert.hidden = true;
    formAlert.innerHTML = '';
    okAlert.innerHTML = '';
  }

  function clearField(field) {
    var input = el(field.input);
    var tip = el(field.tip);
    if (input) { input.removeAttribute('aria-invalid'); }
    if (tip) { tip.classList.remove('is-shown'); tip.textContent = ''; }
  }

  function bindFields() {
    FIELDS.forEach(function (field) {
      var input = el(field.input);
      var tip = el(field.tip);
      if (!input) { return; }
      checkers.push({
        field: field,
        input: input,
        check: Validate.attach({ input: input, tip: tip, rules: field.rules })
      });
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (submitted) { return; }

    hideAlerts();

    var values = {};
    var errors = [];
    var firstBad = null;

    checkers.forEach(function (item) {
      var result = Validate.run(item.input.value, item.field.rules);
      Validate.paint(item.input, el(item.field.tip), result, false);

      if (result.ok) {
        values[item.field.key] = result.value;
      } else {
        errors.push({ label: item.field.label, message: result.message });
        if (!firstBad) { firstBad = item.input; }
      }
    });

    if (errors.length > 0) {
      var listHtml = errors.map(function (err) {
        return '<li><strong>' + Store.esc(err.label) + '</strong>: ' +
               Store.esc(err.message) + '</li>';
      }).join('');

      showAlert(formAlert,
        '<strong>' + errors.length + (errors.length === 1
          ? ' field did not pass validation'
          : ' fields did not pass validation') + '</strong>' +
        '<ul class="alert-list">' + listHtml + '</ul>');

      if (firstBad) { firstBad.focus(); }
      return;
    }

    var result = Store.addSeller(values);

    if (!result.ok) {
      var conflictField = result.code === 'username-taken' ? 'username'
                        : result.code === 'email-taken'    ? 'email'
                        : null;

      if (conflictField) {
        var input = el(conflictField);
        var tip = el(conflictField + '-tip');
        if (input && tip) {
          input.setAttribute('aria-invalid', 'true');
          tip.textContent = result.error;
          tip.classList.add('is-shown');
          input.focus();
        }
      }
      showAlert(formAlert, '<strong>Registration failed.</strong> ' + Store.esc(result.error));
      return;
    }

    submitted = true;
    form.querySelectorAll('input, button').forEach(function (n) { n.disabled = true; });

    showAlert(okAlert,
      '<strong>Registration complete.</strong> An account has been created for ' +
      Store.esc(result.seller.name) + ' (username ' +
      Store.esc(result.seller.username) + '). Redirecting to the sign-in page...');

    window.setTimeout(function () {
      window.location.assign('login.html?registered=1');
    }, 1100);
  }

  function handleReset() {
    window.setTimeout(function () {
      hideAlerts();
      submitted = false;
      FIELDS.forEach(clearField);
      form.querySelectorAll('input, button').forEach(function (n) { n.disabled = false; });
      var first = el('name');
      if (first) { first.focus(); }
    }, 0);
  }

  function init() {
    if (!form) { return; }
    bindFields();
    form.addEventListener('submit', handleSubmit);
    if (resetBtn) { resetBtn.addEventListener('click', handleReset); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
