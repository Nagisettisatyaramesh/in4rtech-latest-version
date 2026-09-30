/* In4rtech styling for the Vitality Soft chat widget.
   The widget renders inside an open shadow root after it loads its config,
   so we watch for it and then: swap the launcher icon, dock it in the corner,
   and tidy the header title ("🤖 In4rtech Assistant (Semantic)" -> "In4rtech Assistant"). */
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
    '@media (prefers-reduced-motion:reduce){.aiwa-launcher,.aiwa-panel{transition:none}}';

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
    return true;
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
