/* In4rtech cookie consent
 * - Nothing non-essential loads until the visitor chooses "Accept".
 * - "Reject non-essential" is as prominent as "Accept all".
 * - The choice is stored in localStorage (strictly necessary) and can be changed any time
 *   via any element with [data-cookie-settings] (e.g. the footer "Cookie settings" link).
 *
 * To enable analytics, set CONFIG.gaId to your Google Analytics 4 measurement ID (e.g. "G-XXXXXXXXXX").
 * While it is empty, no analytics script is ever loaded, even after "Accept".
 */
(function () {
  var CONFIG = { gaId: '' };
  var KEY = 'in4rtech-consent-v1';

  function read() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save(analytics) { try { localStorage.setItem(KEY, JSON.stringify({ analytics: !!analytics, updated: new Date().toISOString() })); } catch (e) {} }

  function loadAnalytics() {
    if (!CONFIG.gaId || window.__in4rtechGa) return;
    window.__in4rtechGa = true;
    var s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CONFIG.gaId);
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', CONFIG.gaId, { anonymize_ip: true });
  }
  function clearAnalyticsCookies() {
    var host = location.hostname, root = host.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (/^(_ga|_gid|_gat)/.test(name)) {
        document.cookie = name + '=; Max-Age=0; path=/';
        document.cookie = name + '=; Max-Age=0; path=/; domain=.' + root;
      }
    });
  }
  function apply(choice) { if (choice && choice.analytics) loadAnalytics(); else clearAnalyticsCookies(); }

  var banner, prefs, analyticsBox, manageBtn, lastFocus;
  function build() {
    banner = document.createElement('div');
    banner.className = 'cc';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'false');
    banner.setAttribute('aria-labelledby', 'cc-title');
    banner.setAttribute('aria-describedby', 'cc-desc');
    banner.innerHTML =
      '<div class="cc-in">' +
        '<p class="cc-title" id="cc-title">Your privacy choices</p>' +
        '<p class="cc-desc" id="cc-desc">We use strictly necessary storage to remember your choice. With your permission, we would also like to use analytics cookies to understand how the site is used. Nothing non-essential is set unless you accept, and you can change your mind at any time using “Cookie settings”. <a href="privacy.html#cookies">Read our Privacy Policy</a>.</p>' +
        '<div class="cc-prefs" hidden>' +
          '<label class="cc-row"><input type="checkbox" checked disabled> <span><b>Strictly necessary</b> Remembers your privacy choice. Always on.</span></label>' +
          '<label class="cc-row"><input type="checkbox" id="cc-analytics"> <span><b>Analytics</b> Helps us understand how visitors use the site, so we can improve it.</span></label>' +
        '</div>' +
        '<div class="cc-actions">' +
          '<button type="button" class="cc-btn" data-cc="reject">Reject non-essential</button>' +
          '<button type="button" class="cc-btn cc-ghost" data-cc="manage">Manage choices</button>' +
          '<button type="button" class="cc-btn" data-cc="accept">Accept all</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(banner);
    prefs = banner.querySelector('.cc-prefs');
    analyticsBox = banner.querySelector('#cc-analytics');
    manageBtn = banner.querySelector('[data-cc="manage"]');
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]'); if (!b) return;
      var act = b.getAttribute('data-cc');
      if (act === 'accept') decide(true);
      else if (act === 'reject') decide(false);
      else if (act === 'manage') {
        if (prefs.hidden) { prefs.hidden = false; manageBtn.textContent = 'Save choices'; analyticsBox.focus(); }
        else decide(analyticsBox.checked);
      }
    });
    banner.addEventListener('keydown', function (e) { if (e.key === 'Escape' && read()) hide(); });
  }
  function show(openPrefs) {
    if (!banner) build();
    var c = read();
    analyticsBox.checked = !!(c && c.analytics);
    prefs.hidden = !openPrefs; manageBtn.textContent = openPrefs ? 'Save choices' : 'Manage choices';
    lastFocus = document.activeElement;
    banner.classList.add('is-open');
    setTimeout(function () { (openPrefs ? analyticsBox : banner.querySelector('[data-cc="reject"]')).focus(); }, 50);
  }
  function hide() {
    banner.classList.remove('is-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function decide(analytics) { save(analytics); apply({ analytics: analytics }); hide(); }

  function init() {
    var c = read();
    apply(c);
    if (!c) show(false);
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cookie-settings]'); if (!t) return;
      e.preventDefault(); show(true);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
