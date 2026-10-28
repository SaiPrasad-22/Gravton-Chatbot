/* Add <script src="https://YOUR-CHATBOT.vercel.app/embed.js" defer></script> to your website. */
(function () {
  'use strict';
  var script = document.currentScript;
  if (!script || document.getElementById('gravton-assistant-embed')) return;
  var origin = new URL(script.src, window.location.href).origin;
  var frame = document.createElement('iframe');
  frame.id = 'gravton-assistant-embed';
  frame.title = 'Gravton chatbot';
  frame.src = origin + '/?embed=1&desktop=' + (window.innerWidth >= 640 ? '1' : '0');
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  frame.allow = 'clipboard-write';
  Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', border: '0', background: 'transparent', zIndex: '2147483000', colorScheme: 'normal' });
  var isOpen = false;
  function resize() {
    var mobile = window.innerWidth < 640;
    frame.style.width = isOpen ? Math.min(mobile ? 390 : 404, window.innerWidth) + 'px' : (mobile ? '72px' : '244px');
    var room = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    // The open frame follows the visible height of the page (at most 840px): the chat's own sizing is relative to its frame, so the frame must not be fitted to the content.
    frame.style.height = isOpen ? Math.min(840, room) + 'px' : (mobile ? '80px' : '96px');
    if (frame.contentWindow) frame.contentWindow.postMessage({ type: 'gravton-host:layout', desktop: !mobile }, origin);
    // A small closed iframe keeps the host site's buttons and links reachable.
    // The host page can keep its own fixed buttons (for example back to top) clear of the launcher: the iframe sets a class and a variable on
    // <html>, which the host's stylesheet may use. It changes nothing on the host unless the host's CSS refers to it.
    var root = document.documentElement;
    root.classList.add('gv-chat-on');
    root.style.setProperty('--gv-chat-clearance', (mobile ? 92 : 108) + 'px');
  }
  window.addEventListener('message', function (event) {
    if (event.origin !== origin || event.source !== frame.contentWindow || !event.data || event.data.type !== 'gravton-widget:state' || typeof event.data.open !== 'boolean') return;
    isOpen = event.data.open; resize();
  });
  frame.addEventListener('load', resize);
  window.addEventListener('resize', resize);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  resize();
  (document.body || document.documentElement).appendChild(frame);
})();
