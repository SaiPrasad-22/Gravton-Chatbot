export function notifyEmbedState(open: boolean) {
 if (window.parent === window || new URLSearchParams(window.location.search).get('embed') !== '1') return;
 // Only visibility is shared. Never send chat text, enquiry details or credentials.
 let target = '*';
 try { if (document.referrer) target = new URL(document.referrer).origin; } catch { /* visibility only */ }
 window.parent.postMessage({ type: 'gravton-widget:state', open }, target);
}
export function listenForEmbedLayout() {
 if (window.parent === window || new URLSearchParams(window.location.search).get('embed') !== '1') return () => {};
 let parentOrigin: string | undefined;
 try { parentOrigin = new URL(document.referrer).origin; } catch { /* no external commands accepted without a known parent */ }
 const apply = (desktop: boolean) => document.documentElement.toggleAttribute('data-gv-embed-desktop', desktop);
 apply(new URLSearchParams(window.location.search).get('desktop') === '1');
 function message(event: MessageEvent) {
  if (!parentOrigin || event.source !== window.parent || event.origin !== parentOrigin || event.data?.type !== 'gravton-host:layout' || typeof event.data.desktop !== 'boolean') return;
  apply(event.data.desktop);
 }
 window.addEventListener('message', message);
 return () => { window.removeEventListener('message', message); document.documentElement.removeAttribute('data-gv-embed-desktop'); };
}
