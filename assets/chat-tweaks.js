/* In4rtech customisation of the Vitality Soft chat widget.
   The widget renders inside an open shadow root after it loads its config,
   so we watch for it and then: swap the launcher icon, dock it in the corner,
   tidy the header title ("In4rtech Assistant (Semantic)" -> "In4rtech Assistant"),
   show an AI-assistant / privacy notice, and hand off to the contact form
   (replacing the widget's "Call Us" phone button). */
(function () {
  'use strict';

  var ICON = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M11 5.5a7 7 0 0 0-6.1 10.4L4 19.5l3.7-.9A7 7 0 1 0 11 5.5Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>' +
    '<circle cx="18.5" cy="5.5" r="3" fill="currentColor"/>' +
    '<circle cx="8" cy="12.5" r="1" fill="currentColor"/><circle cx="11" cy="12.5" r="1" fill="currentColor"/><circle cx="14" cy="12.5" r="1" fill="currentColor"/>' +
    '</svg>';

  var CSS =
    '.aiwa-launcher{right:20px!important;width:68px;height:68px;border-radius:50%;' +
    'background:#059669;color:#fff;' +
    'box-shadow:0 12px 30px -8px rgba(5,150,105,.55),0 0 0 1px rgba(255,255,255,.12) inset;}' +
    '.aiwa-launcher svg{width:32px;height:32px;}' +
    '.aiwa-launcher:hover{background:#047857;}' +
    '.aiwa-panel{bottom:100px!important;}' +
    '.aiwa-launcher:hover{transform:translateY(-2px);}' +
    '.aiwa-launcher:focus-visible{outline:2px solid #63C9C3;outline-offset:3px;}' +
    '.aiwa-panel{right:20px!important;}' +
    '@media (max-width:480px){.aiwa-launcher{right:16px!important}.aiwa-launcher{width:62px;height:62px}.aiwa-panel{right:8px!important;bottom:8px!important}}' +
    '@media (prefers-reduced-motion:reduce){.aiwa-launcher,.aiwa-panel{transition:none}}' +
    '.aiwa-call-btn{display:none!important;}' +
    '.in4-notice{flex-shrink:0;margin:0;padding:9px 16px;font-size:11.5px;line-height:1.45;color:#3B4A50;' +
    'background:#ECFDF5;border-bottom:1px solid #D1FAE5;}' +
    '.in4-notice strong{color:#065F46;font-weight:600;}' +
    '.in4-notice a{color:#047857;font-weight:600;}' +
    '.in4-handoff{align-self:flex-start;margin-top:-4px;display:inline-flex;align-items:center;gap:6px;' +
    'border:1px solid #059669;background:#fff;color:#047857;border-radius:10px;padding:9px 14px;' +
    'font:600 13px inherit;font-family:inherit;cursor:pointer;}' +
    '.in4-handoff:hover{background:#ECFDF5;}' +
    '.in4-handoff:focus-visible{outline:2px solid #059669;outline-offset:2px;}';

  var NOTICE = '<strong>AI assistant.</strong> Answers are based on our website content only and are not ' +
    'technical or commercial advice. Chats are stored to improve our service; please don\u2019t share personal ' +
    'or confidential information. <a href="privacy.html#chat" target="_top">Privacy Policy</a>';

  var FALLBACK = 'I can only answer general questions about In4rtech\u2019s services, approach and how to work with us. ' +
    'For anything more specific, our team will be happy to help. Please send us an enquiry.';
  var FALLBACK_TEXT = /don.t have enough information|unable to provide that information|something went wrong/i;

  function tidyTitle(el) {
    var t = el.textContent;
    var clean = t.replace(/\u{1F916}\s*/gu, '').replace(/\s*\((Semantic|Keyword)\)\s*$/i, '').trim();
    if (clean !== t) el.textContent = clean;
  }

  function apply(root) {
    var launcher = root.querySelector('.aiwa-launcher');
    var title = root.querySelector('.aiwa-header-title');
    if (!launcher || !title) return false;
    if (!root.querySelector('style[data-in4rtech]')) {
      var s = document.createElement('style');
      s.setAttribute('data-in4rtech', '');
      s.textContent = CSS;
      root.appendChild(s);
    }
    if (!launcher.hasAttribute('data-in4rtech')) {
      launcher.setAttribute('data-in4rtech', '');
      launcher.innerHTML = ICON;
    }
    tidyTitle(title);
    addNotice(root);
    watchMessages(root);
    return true;
  }

  function addNotice(root) {
    var header = root.querySelector('.aiwa-header');
    if (!header || root.querySelector('.in4-notice')) return;
    var p = document.createElement('p');
    p.className = 'in4-notice';
    p.innerHTML = NOTICE;
    header.insertAdjacentElement('afterend', p);
  }

  /* Hand off to the contact form: close the chat, then reuse the page's own anchor handling
     (smooth scroll on the home page) or navigate to the home page's contact section. */
  function goToContact(root) {
    var panel = root.querySelector('.aiwa-panel');
    if (panel) panel.classList.remove('aiwa-open');
    if (document.getElementById('contact')) {
      var a = document.createElement('a');
      a.href = '#contact';
      a.hidden = true;
      document.body.appendChild(a);
      a.click();
      a.remove();
      var section = document.getElementById('contact');
      var first = section.querySelector('input:not([type=hidden]):not([tabindex="-1"])');
      setTimeout(function () {
        // Safety net: jump there if the smooth scroll did not run
        if (Math.abs(section.getBoundingClientRect().top) > 200) section.scrollIntoView();
        if (first) first.focus({ preventScroll: true });
      }, 1400);
    } else {
      window.location.href = 'index.html#contact';
    }
  }

  function handoffButton(root) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'in4-handoff';
    b.textContent = '\u2709 Send an enquiry';
    b.addEventListener('click', function () { goToContact(root); });
    return b;
  }

  /* The chatbot server answers greetings with its own built-in reply, which takes priority
     over knowledge articles, so reword the welcome and greeting bubbles here. */
  var GREETING = 'Hi, this is In4rtech Assistant. How can I help you?';
  var GENERIC_GREETING = /^(hi|hello|hey)!?\s*how can i help you( today)?\??$/i;

  /* The chatbot server also indexes the page text, and for short questions ("services", "insights")
     it sometimes returns the site menu ("ABOUT ABOUT SERVICES SERVICES ...") or a heading fragment
     instead of a knowledge article. Detect those and re-ask as "Tell me about In4rtech <topic>",
     which reliably matches the right article. */
  var MENU_WORDS = /^(about|services?|approach|people|work|insights|contact|menu|close|home|founder|managing|director|&|\u00d7)$/i;

  function isMenuText(text) {
    var words = text.split(/\s+/).filter(Boolean);
    if (words.length < 2) return false;
    var menu = words.filter(function (w) { return MENU_WORDS.test(w); }).length;
    if (menu / words.length >= 0.6) return true;
    // Short heading fragment: no sentence punctuation and an all-caps menu word, e.g. "People Founder & Managing Director CONTACT"
    return words.length <= 12 && !/[.?!]/.test(text) && words.some(function (w) { return w.length > 2 && w === w.toUpperCase() && MENU_WORDS.test(w); });
  }

  function chatApi() {
    var s = document.querySelector('script[src*="chatbot.vitalitysoft.com/widget.js"]');
    if (!s) return null;
    return {
      url: new URL(s.src).origin + (s.getAttribute('data-chat-endpoint') || '/api/chat'),
      websiteId: s.getAttribute('data-website-id')
    };
  }

  function topicOf(question) {
    var t = question.replace(/[?.!]+$/, '').trim()
      .replace(/^(please\s+)?(tell me about|tell me|give me|show me|what about|what are|what is|list( of)?|info on|information on)\s+/i, '')
      .replace(/^(your|the|our|in4rtech('s)?)\s+/i, '');
    return t || question;
  }

  function showFallback(root, el) {
    el.textContent = FALLBACK;
    el.insertAdjacentElement('afterend', handoffButton(root));
  }

  function retryAnswer(root, el) {
    var api = chatApi();
    var prev = el.previousElementSibling;
    while (prev && !prev.classList.contains('aiwa-msg-user')) prev = prev.previousElementSibling;
    if (!api || !prev) return showFallback(root, el);
    el.textContent = '\u2026';
    fetch(api.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteId: api.websiteId, message: 'Tell me about In4rtech ' + topicOf(prev.textContent.trim()) })
    }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      var answer = j && j.answer ? String(j.answer).trim() : '';
      if (!answer || j.humanFallback || FALLBACK_TEXT.test(answer) || isMenuText(answer)) return showFallback(root, el);
      el.textContent = answer;
      if (/contact form/i.test(answer)) el.insertAdjacentElement('afterend', handoffButton(root));
    }).catch(function () { showFallback(root, el); });
  }

  function rewordBubbles(root, list) {
    var bubbles = list.querySelectorAll('.aiwa-msg-bot:not([data-in4]), .aiwa-msg-error:not([data-in4])');
    for (var i = 0; i < bubbles.length; i++) {
      var el = bubbles[i], text = el.textContent.trim();
      el.setAttribute('data-in4', '');
      if (GENERIC_GREETING.test(text)) { el.textContent = GREETING; continue; }
      if (isMenuText(text)) { retryAnswer(root, el); continue; }
      var fallback = FALLBACK_TEXT.test(text);
      if (fallback) { el.textContent = FALLBACK; el.className = 'aiwa-msg aiwa-msg-bot'; el.setAttribute('data-in4', ''); }
      // Offer the contact form after fallbacks and after any answer that points to it
      if (fallback || /contact form/i.test(text)) el.insertAdjacentElement('afterend', handoffButton(root));
    }
    // The widget's phone button is hidden by CSS; remove it too so it can't be reached by keyboard
    var calls = list.querySelectorAll('.aiwa-call-btn');
    for (var j = 0; j < calls.length; j++) calls[j].remove();
  }

  function watchMessages(root) {
    var list = root.querySelector('.aiwa-messages');
    if (!list || list.hasAttribute('data-in4rtech')) return;
    list.setAttribute('data-in4rtech', '');
    rewordBubbles(root, list);
    new MutationObserver(function () { rewordBubbles(root, list); }).observe(list, { childList: true });
  }

  function watch(host) {
    var root = host.shadowRoot;
    if (!root) return;
    if (apply(root)) return;
    var mo = new MutationObserver(function () { if (apply(root)) mo.disconnect(); });
    mo.observe(root, { childList: true, subtree: true });
  }

  function start() {
    var host = document.querySelector('[id^="aiwa-host-"]');
    if (host) return watch(host);
    var mo = new MutationObserver(function () {
      var h = document.querySelector('[id^="aiwa-host-"]');
      if (h) { mo.disconnect(); watch(h); }
    });
    mo.observe(document.body, { childList: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
