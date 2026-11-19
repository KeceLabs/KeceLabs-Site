/* KeceLabs — minimal progressive enhancement. The site works without JavaScript. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {
    setYear();
    initHeader();
    initMobileMenu();
    initReveal();
    initFlowMetrics();
    initPrefillLinks();
    initContactForm();
  });

  /* ---------- Footer year ---------- */
  function setYear() {
    var year = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = year; });
  }

  /* ---------- Header border on scroll ---------- */
  function initHeader() {
    var header = document.querySelector('[data-header]');
    if (!header) return;
    var bar = header.querySelector('[data-progress]');
    var ticking = false;
    var update = function () {
      ticking = false;
      header.classList.toggle('is-scrolled', window.scrollY > 8);
      if (bar) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';
      }
    };
    update();
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    // Highlight the nav link for the section in view.
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav-list a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) {
      var sec = document.querySelector(a.getAttribute('href'));
      if (sec) map[sec.id] = a;
    });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          link.classList.add('is-active');
          link.setAttribute('aria-current', 'location');
        } else if (link.classList.contains('is-active')) {
          link.classList.remove('is-active');
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu = document.querySelector('[data-mobile-menu]');
    if (!toggle || !menu) return;
    var label = toggle.querySelector('[data-menu-label]');

    function setOpen(open, returnFocus) {
      toggle.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Close menu' : 'Open menu';
      menu.hidden = !open;
      document.body.classList.toggle('menu-open', open);
      if (open) {
        var first = menu.querySelector('a');
        if (first) first.focus();
      } else if (returnFocus) {
        toggle.focus();
      }
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true', true);
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false, false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setOpen(false, true);
    });

    // Keep keyboard focus inside the open menu (menu + toggle).
    document.addEventListener('focusin', function (e) {
      if (toggle.getAttribute('aria-expanded') !== 'true') return;
      if (!menu.contains(e.target) && e.target !== toggle) {
        var first = menu.querySelector('a');
        if (first) first.focus();
      }
    });

    // Close if the viewport grows to desktop layout.
    var mq = window.matchMedia('(min-width: 56rem)');
    var onChange = function () { if (mq.matches) setOpen(false, false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Workflow pulse distance ---------- */
  function initFlowMetrics() {
    var flow = document.querySelector('.flow');
    if (!flow) return;
    var set = function () {
      flow.style.setProperty('--flow-w', flow.offsetWidth + 'px');
      flow.style.setProperty('--flow-h', flow.offsetHeight + 'px');
    };
    set();
    window.addEventListener('resize', set, { passive: true });
  }

  /* ---------- CTA links that pre-fill the form ---------- */
  function initPrefillLinks() {
    document.querySelectorAll('a[data-need], a[data-message]').forEach(function (link) {
      link.addEventListener('click', function () {
        var need = document.getElementById('f-need');
        var msg = document.getElementById('f-message');
        if (need && link.dataset.need) need.value = link.dataset.need;
        if (msg && link.dataset.message && !msg.value.trim()) msg.value = link.dataset.message;
      });
    });
  }

  /* ---------- Contact form (Netlify Forms via AJAX, with native POST fallback) ---------- */
  function initContactForm() {
    var form = document.querySelector('[data-contact-form]');
    if (!form) return;

    var shell = document.querySelector('[data-form-shell]');
    var success = shell.querySelector('[data-form-success]');
    var errorBox = form.querySelector('[data-form-error]');
    var submit = form.querySelector('[data-submit]');
    var submitLabel = form.querySelector('[data-submit-label]');
    var phone = form.querySelector('#f-phone');
    var sms = form.querySelector('#f-sms');

    // JS takes over validation so we can show inline, accessible messages.
    form.setAttribute('novalidate', '');

    var messages = {
      'f-name': { valueMissing: 'Please enter your name.' },
      'f-email': { valueMissing: 'Please enter your email address.', typeMismatch: 'Please enter a valid email address, like name@business.com.' },
      'f-phone': { valueMissing: 'Please add a phone number so we can text you, or uncheck the SMS box.', patternMismatch: 'Please enter a valid phone number.' },
      'f-need': { valueMissing: 'Please choose what you need.' },
      'f-message': { valueMissing: 'Please add a short message.', tooShort: 'Please add a little more detail (at least 10 characters).' }
    };

    function errorEl(field) { return form.querySelector('[data-error-for="' + field.id + '"]'); }

    function validateField(field) {
      // Phone becomes required only when SMS consent is given.
      if (field === phone) phone.required = !!(sms && sms.checked);
      var el = errorEl(field);
      var v = field.validity;
      var text = '';
      if (!v.valid) {
        var m = messages[field.id] || {};
        if (v.valueMissing) text = m.valueMissing || 'This field is required.';
        else if (v.typeMismatch) text = m.typeMismatch || 'Please check this field.';
        else if (v.patternMismatch) text = m.patternMismatch || 'Please check this field.';
        else if (v.tooShort) text = m.tooShort || 'Please add a little more detail.';
        else text = field.validationMessage;
      }
      if (el) el.textContent = text;
      if (text) field.setAttribute('aria-invalid', 'true');
      else field.removeAttribute('aria-invalid');
      return !text;
    }

    var fields = Array.prototype.slice.call(form.querySelectorAll('input:not([type="hidden"]):not([name="bot-field"]):not([type="checkbox"]), select, textarea'));

    fields.forEach(function (field) {
      field.addEventListener('blur', function () { if (field.value || field.hasAttribute('aria-invalid')) validateField(field); });
      field.addEventListener('input', function () { if (field.hasAttribute('aria-invalid')) validateField(field); });
      field.addEventListener('change', function () { if (field.hasAttribute('aria-invalid')) validateField(field); });
    });

    if (sms && phone) {
      sms.addEventListener('change', function () {
        if (sms.checked || phone.hasAttribute('aria-invalid')) validateField(phone);
      });
    }

    function setLoading(loading) {
      submit.disabled = loading;
      submitLabel.textContent = loading ? 'Sending…' : 'Send message';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errorBox.hidden = true;

      var firstInvalid = null;
      fields.forEach(function (field) {
        if (!validateField(field) && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }

      setLoading(true);
      var body = new URLSearchParams(new FormData(form)).toString();

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed with status ' + res.status);
          form.hidden = true;
          success.hidden = false;
          success.focus({ preventScroll: true });
          shell.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        })
        .catch(function () {
          errorBox.hidden = false;
          errorBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        })
        .then(function () { setLoading(false); });
    });
  }
})();
