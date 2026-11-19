/* KeceLabs — minimal progressive enhancement. The site works without JavaScript. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // A reload should start at the top of the page, not wherever the visitor was scrolled.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  document.addEventListener('DOMContentLoaded', function () {
    initAnchorLinks();
    setYear();
    initHeader();
    initMobileMenu();
    initReveal();
    initDemo();
    initPrefillLinks();
    initContactForm();
  });

  /* ---------- In-page links ----------
     Scroll to sections without writing "#section" into the address bar,
     so reloading the page doesn't jump back down to the last section clicked. */
  function initAnchorLinks() {
    // Arrived from another page with a hash (e.g. privacy.html → index.html#contact):
    // jump to that section, then tidy the address bar so a reload starts at the top.
    var landing = location.hash && document.getElementById(location.hash.slice(1));
    if (landing) {
      history.replaceState(null, '', location.pathname + location.search);
      // 'instant' overrides the CSS smooth scrolling for this initial jump.
      var jump = function () { landing.scrollIntoView({ behavior: 'instant', block: 'start' }); };
      jump();
      var landedAt = window.scrollY;
      // Re-align once fonts and layout have settled, unless the visitor has already scrolled.
      window.addEventListener('load', function () {
        if (Math.abs(window.scrollY - landedAt) < 2) jump();
      }, { once: true });
    }

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href').slice(1);
      var target = id && document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

      // Move keyboard/screen-reader focus to the section, as a normal anchor jump would.
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

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

  /* ---------- Lead Response System demo ----------
     A scripted simulation that runs entirely in the visitor's browser.
     No network requests, no real calls or messages, no AI, and no data
     collection: the demo has no inputs, and every name and number is fictional. */
  function initDemo() {
    var root = document.querySelector('[data-demo]');
    if (!root) return;

    var stage = root.querySelector('[data-demo-stage]');
    var fallback = root.querySelector('[data-demo-fallback]');
    var stepsEl = root.querySelector('[data-demo-steps]');
    var caption = root.querySelector('[data-demo-caption]');
    var customer = root.querySelector('[data-demo-customer]');
    var owner = root.querySelector('[data-demo-owner]');
    var toggle = root.querySelector('[data-demo-toggle]');
    var replay = root.querySelector('[data-demo-replay]');
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[data-scenario]'));
    var cta = document.querySelector('[data-demo-cta]');

    stage.hidden = false;
    if (fallback) fallback.hidden = true;

    /* Small DOM helpers */
    function el(tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    }
    function add(parent, child, isNew) {
      if (isNew) child.classList.add('is-new');
      parent.appendChild(child);
      return child;
    }
    function frame(container, title, meta) {
      var head = el('div', container === owner ? 'owner-head' : 'device-head');
      head.appendChild(el('span', '', title));
      var right = meta instanceof Node ? meta : el('span', 'mono', meta);
      head.appendChild(right);
      container.appendChild(head);
      return add(container, el('div', container === owner ? 'owner-body' : 'device-body'));
    }
    function status(text, tone) {
      return el('span', 'owner-status' + (tone ? ' is-' + tone : ''), text);
    }
    // maxRows: show only the most recent events (like a real feed) when space is tight.
    function log(body, entries, upTo, newest, maxRows) {
      var list = el('ol', 'log');
      list.setAttribute('aria-label', 'Activity');
      var count = Math.min(upTo, entries.length - 1) + 1;
      var first = maxRows && count > maxRows ? count - maxRows : 0;
      if (first > 0) list.appendChild(el('li', 'log-more', first + ' earlier event' + (first > 1 ? 's' : '')));
      for (var k = first; k <= upTo && k < entries.length; k++) {
        var li = el('li', entries[k][2] ? 'is-auto' : '');
        li.appendChild(el('time', '', entries[k][0]));
        li.appendChild(el('span', '', entries[k][1]));
        add(list, li, k === newest);
      }
      body.appendChild(list);
      return list;
    }
    function notice(label, time, title, quote, next, isNew, nextIsNew) {
      var n = el('div', 'notice');
      var l = el('div', 'notice-label');
      l.appendChild(el('span', '', label));
      l.appendChild(el('span', '', time));
      n.appendChild(l);
      n.appendChild(el('strong', '', title));
      if (quote) n.appendChild(el('q', '', quote));
      if (next) add(n, el('div', 'notice-next', next), nextIsNew);
      if (isNew) n.classList.add('is-new');
      return n;
    }

    var PHONE = '(555) 010-0142'; // 555-01xx numbers are reserved for fiction

    var SCENARIOS = {
      call: {
        steps: [
          { title: 'Incoming call', text: 'A potential customer calls Example Business.', wait: 2600 },
          { title: 'Call missed', text: 'The team is busy with another customer, so no one can pick up.', wait: 1900 },
          { title: 'Text-back sent', text: 'Within seconds, an automatic text replies to the caller.', wait: 2500 },
          { title: 'Customer replies', text: 'The caller explains what they need, by text.', wait: 2900 },
          { title: 'Owner notified', text: 'The owner receives the new lead with the details, ready to follow up.', wait: 0 }
        ],
        log: [
          ['2:14 PM', 'Incoming call from ' + PHONE],
          ['2:14 PM', 'Call missed, no one available'],
          ['2:14 PM', 'Automatic text-back sent', true],
          ['2:15 PM', 'Customer replied by text'],
          ['2:15 PM', 'Owner notified with lead details', true]
        ],
        draw: function (i, newest) {
          // Customer's phone
          if (i <= 1) {
            var body = frame(customer, 'Phone', i === 0 ? 'Calling' : 'Call ended');
            var call = add(body, el('div', 'call' + (i === 0 ? ' is-ringing' : ' is-missed')), newest === 1);
            call.appendChild(el('div', 'call-avatar', 'EB'));
            call.appendChild(el('div', 'call-name', 'Example Business'));
            call.appendChild(el('div', 'call-status', i === 0 ? 'Calling…' : 'No answer'));
          } else {
            var thread = frame(customer, 'Example Business', 'Text message');
            add(thread, el('div', 'bubble-system', 'Missed call · 2:14 PM'));
            var auto = el('div', 'bubble bubble-in');
            auto.appendChild(el('span', 'bubble-meta', 'Automatic reply'));
            auto.appendChild(document.createTextNode('Hi, this is Example Business. Sorry we missed your call! How can we help?'));
            add(thread, auto, newest === 2);
            if (i >= 3) {
              var reply = function () { return el('div', 'bubble bubble-out', 'Hi! Could I get a quote for next week?'); };
              if (newest === 3) {
                var dots = add(thread, el('div', 'typing'), true);
                dots.innerHTML = '<i></i><i></i><i></i>';
                dots.setAttribute('aria-label', 'Customer is typing');
                later(function () { thread.replaceChild(add(document.createDocumentFragment(), reply(), true), dots); }, 1300);
              } else {
                add(thread, reply());
              }
            }
          }
          // Owner's view
          var states = [['Incoming call'], ['Missed call', 'alert'], ['Auto-replied'], ['Customer replied'], ['Ready for follow-up', 'ready']];
          var ob = frame(owner, 'Lead activity', status(states[i][0], states[i][1]));
          if (i >= 4) {
            ob.appendChild(notice('New lead · via missed call', '2:15 PM', PHONE, 'Hi! Could I get a quote for next week?', 'Ready for follow-up', newest === 4));
          }
          log(ob, this.log, i, newest, i >= 4 ? 3 : 0);
        }
      },

      web: {
        steps: [
          { title: 'Inquiry submitted', text: 'A visitor fills out the contact form on the Example Business website.', wait: 3200 },
          { title: 'Acknowledgment sent', text: 'The customer immediately receives a confirmation that their inquiry arrived.', wait: 2400 },
          { title: 'Business notified', text: 'The business receives a lead notification with the inquiry details.', wait: 2400 },
          { title: 'Ready for follow-up', text: 'The inquiry is organized and ready for the team to follow up.', wait: 0 }
        ],
        log: [
          ['2:16 PM', 'Website inquiry received'],
          ['2:16 PM', 'Acknowledgment email sent', true],
          ['2:16 PM', 'Owner notified with inquiry details', true],
          ['2:16 PM', 'Added to follow-up list', true]
        ],
        draw: function (i, newest) {
          var values = [['Name', 'Alex Rivera'], ['Email', 'alex@example.com'], ['Message', 'Do you have availability next week?']];
          var body = frame(customer, 'examplebusiness.com', 'Contact');
          if (i === 0) {
            // A picture of a form, not a real one: nothing can be typed or submitted.
            var form = add(body, el('div', 'mock-form'));
            var outs = values.map(function (v) {
              var f = el('div', 'mock-field');
              f.appendChild(el('span', 'mock-label', v[0]));
              var out = f.appendChild(el('div', 'mock-value', newest === 0 ? '' : v[1]));
              form.appendChild(f);
              return out;
            });
            var btn = form.appendChild(el('div', 'mock-button' + (newest === 0 ? '' : ' is-sent'), newest === 0 ? 'Send inquiry' : 'Sent ✓'));
            if (newest === 0) {
              outs.forEach(function (out, k) { later(function () { out.textContent = values[k][1]; }, 350 + k * 550); });
              later(function () { btn.textContent = 'Sent ✓'; btn.classList.add('is-sent'); }, 2300);
            }
          } else {
            var sent = add(body, el('div', 'mail'));
            sent.appendChild(el('span', 'mail-from', 'You sent · 2:16 PM'));
            sent.appendChild(document.createTextNode('“' + values[2][1] + '”'));
            sent.style.borderLeftColor = '#3a3a36';
            var mail = add(body, el('div', 'mail'), newest === 1);
            mail.appendChild(el('span', 'mail-from', 'Example Business · Auto-reply'));
            mail.appendChild(document.createTextNode('Thanks, Alex! We received your message and will be in touch shortly.'));
          }
          var states = [['New inquiry', 'alert'], ['Acknowledged'], ['Owner notified'], ['Ready for follow-up', 'ready']];
          var waiting = newest === 0; // the inquiry hasn't been sent yet
          var pill = status(waiting ? 'Waiting' : states[i][0], waiting ? '' : states[i][1]);
          var ob = frame(owner, 'Lead activity', pill);
          if (i >= 2) {
            ob.appendChild(notice('New website inquiry', '2:16 PM', 'Alex Rivera', values[2][1], i >= 3 ? 'Next step: call Alex back' : '', newest === 2, newest === 3));
          }
          var entries = this.log;
          var list = log(ob, entries, waiting ? -1 : i, newest, i >= 2 ? 3 : 0);
          if (waiting) {
            later(function () {
              pill.textContent = states[0][0];
              pill.classList.add('is-alert');
              var li = el('li');
              li.appendChild(el('time', '', entries[0][0]));
              li.appendChild(el('span', '', entries[0][1]));
              add(list, li, true);
            }, 2400);
          }
        }
      }
    };

    var current = 'call';
    var idx = 0;
    var playing = false;
    var timers = [];

    function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }
    function clearTimers() { timers.forEach(window.clearTimeout); timers = []; }

    function buildSteps() {
      stepsEl.textContent = '';
      SCENARIOS[current].steps.forEach(function (s, k) {
        var li = el('li');
        var b = el('button', 'demo-step');
        b.type = 'button';
        b.appendChild(el('span', 'demo-step-bar'));
        b.appendChild(el('span', 'demo-step-num', String(k + 1).padStart(2, '0')));
        b.appendChild(el('span', 'demo-step-label', s.title));
        b.setAttribute('aria-label', 'Step ' + (k + 1) + ': ' + s.title);
        b.addEventListener('click', function () { playing = false; render(k, true); });
        li.appendChild(b);
        stepsEl.appendChild(li);
      });
    }

    function render(i, animate) {
      clearTimers();
      var sc = SCENARIOS[current];
      var last = sc.steps.length - 1;
      idx = i;
      customer.textContent = '';
      owner.textContent = '';
      sc.draw(i, animate ? i : -1);

      Array.prototype.forEach.call(stepsEl.querySelectorAll('.demo-step'), function (b, k) {
        b.classList.toggle('is-done', k < i);
        b.classList.toggle('is-current', k === i);
        if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      caption.innerHTML = '';
      caption.appendChild(el('strong', '', sc.steps[i].title));
      caption.appendChild(document.createTextNode('Step ' + (i + 1) + ' of ' + sc.steps.length + '. ' + sc.steps[i].text));

      if (cta) cta.classList.toggle('is-ready', i === last);
      if (playing && i < last) later(function () { render(i + 1, true); }, sc.steps[i].wait);
      if (i === last) playing = false;
      toggle.textContent = playing ? 'Pause' : 'Play';
      toggle.setAttribute('aria-label', playing ? 'Pause demo' : (i === last ? 'Play demo from the start' : 'Play demo'));
    }

    function start() { playing = true; render(0, true); }
    function showFinished() { playing = false; render(SCENARIOS[current].steps.length - 1, false); }

    function select(name, autoplay) {
      current = name;
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', String(t.dataset.scenario === name)); });
      buildSteps();
      if (autoplay) start(); else showFinished();
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { select(t.dataset.scenario, !reduceMotion); });
    });
    replay.addEventListener('click', start);
    toggle.addEventListener('click', function () {
      var last = SCENARIOS[current].steps.length - 1;
      if (playing) { playing = false; render(idx, false); }
      else if (idx >= last) start();
      else { playing = true; clearTimers(); later(function () { render(idx + 1, true); }, 900); toggle.textContent = 'Pause'; toggle.setAttribute('aria-label', 'Pause demo'); }
    });

    // Start paused on the first step; begin automatically when the demo scrolls into view
    // (visitors who prefer reduced motion see the finished workflow and can replay it).
    buildSteps();
    if (reduceMotion || !('IntersectionObserver' in window)) {
      showFinished();
      return;
    }
    render(0, false);
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); start(); }
    }, { rootMargin: '0px 0px -15% 0px' }); // start once the demo's top is in view (also works for tall mobile layouts)
    io.observe(stage);
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
