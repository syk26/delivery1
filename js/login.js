(function () {
  'use strict';

  var slot      = document.querySelector('[data-login-slot]');
  var form      = document.getElementById('loginForm');
  var alertBox  = document.getElementById('loginAlert');
  var userInput = document.getElementById('username');
  var pwdInput  = document.getElementById('pwd');
  var userTip   = document.getElementById('username-tip');
  var pwdTip    = document.getElementById('pwd-tip');
  var revealBtn = document.getElementById('revealBtn');
  var fillBtn   = document.getElementById('fillDemoBtn');

  var busy = false;

  function renderAlreadyLoggedIn(seller) {
    slot.innerHTML =
      '<div class="already-in">' +
        '<h2>You are already signed in</h2>' +
        '<p>Current account: <strong>' + Store.esc(seller.name) + '</strong>' +
           ' (' + Store.esc(seller.username) + ')</p>' +
        '<div class="row">' +
          '<a class="btn btn-primary" href="seller.html">Go to the seller centre</a>' +
          '<a class="btn btn-ghost" href="addcar.html">Post a car</a>' +
          '<a class="btn btn-ghost" href="#" data-logout>Sign out</a>' +
        '</div>' +
      '</div>';
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (busy) { return; }

    alertBox.hidden = true;
    alertBox.innerHTML = '';

    var rUser = Validate.run(userInput.value, ['required', 'username']);
    var rPwd  = Validate.run(pwdInput.value,  ['required', 'password']);
    Validate.paint(userInput, userTip, rUser, false);
    Validate.paint(pwdInput,  pwdTip,  rPwd,  false);

    if (!rUser.ok || !rPwd.ok) {
      (!rUser.ok ? userInput : pwdInput).focus();
      return;
    }

    busy = true;
    var result = Store.login(rUser.value, rPwd.value);

    if (!result.ok) {
      busy = false;
      alertBox.innerHTML = '<strong>Sign-in failed.</strong> ' + Store.esc(result.error);
      alertBox.hidden = false;
      pwdInput.value = '';
      pwdInput.focus();
      return;
    }

    form.querySelectorAll('input, button').forEach(function (n) { n.disabled = true; });
    window.location.assign('seller.html?welcome=1');
  }

  function bindReveal() {
    if (!revealBtn) { return; }
    revealBtn.addEventListener('click', function () {
      var showing = pwdInput.type === 'text';
      pwdInput.type = showing ? 'password' : 'text';
      revealBtn.textContent = showing ? 'Show password' : 'Hide password';
      revealBtn.setAttribute('aria-pressed', showing ? 'false' : 'true');
      pwdInput.focus();
    });
  }

  function bindDemo() {
    var demo = Store.demoAccount || {};

    var userCode = document.querySelector('[data-demo-user]');
    var pwdCode  = document.querySelector('[data-demo-pwd]');
    if (userCode) { userCode.textContent = demo.username || ''; }
    if (pwdCode)  { pwdCode.textContent  = demo.password || ''; }

    if (!fillBtn) { return; }
    fillBtn.addEventListener('click', function () {
      userInput.value = demo.username || '';
      pwdInput.value  = demo.password || '';
      Validate.paint(userInput, userTip, { ok: true, value: userInput.value, message: '' }, false);
      Validate.paint(pwdInput,  pwdTip,  { ok: true, value: pwdInput.value,  message: '' }, false);
      alertBox.hidden = true;
      userInput.focus();
    });
  }

  function init() {
    if (!slot) { return; }

    var current = Store.currentSeller();
    if (current) {
      renderAlreadyLoggedIn(current);
      return;
    }

    if (!form) { return; }

    Validate.attach({ input: userInput, tip: userTip, rules: ['required', 'username'] });
    Validate.attach({ input: pwdInput,  tip: pwdTip,  rules: ['required', 'password'] });

    form.addEventListener('submit', handleSubmit);
    bindReveal();
    bindDemo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
