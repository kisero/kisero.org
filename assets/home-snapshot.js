/* Homepage data is written by the boat's uploads and read from a shared cache. */
(() => {
  'use strict';
  const key = 'kisero-home-v1';
  const listeners = new Set();
  const api = 'https://6zdivjvubh.execute-api.eu-north-1.amazonaws.com/v1/home';
  const persisted = () => {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  };
  let current = window.KiseroHomeSeed || null;
  let pending = false;

  function merge(snapshot) {
    if (snapshot?.schemaVersion !== 1 || !Array.isArray(snapshot.trips)) return;
    const previous = current || {};
    const latest = (old, next, clock) =>
      next && (!old || clock(next) >= clock(old)) ? next : old;
    current = {
      ...previous, ...snapshot,
      device: latest(previous.device, snapshot.device, row => Date.parse(row.receivedAt)),
      cabin: latest(previous.cabin, snapshot.cabin, row => Date.parse(row.observedAt)),
      position: latest(previous.position, snapshot.position, row => row.observedAt),
    };
    try { localStorage.setItem(key, JSON.stringify(current)); } catch {}
    listeners.forEach(render => render(current));
  }

  async function refresh() {
    if (pending || document.hidden) return;
    pending = true;
    try {
      const response = await fetch(api, {signal: AbortSignal.timeout(8000)});
      if (response.ok) merge(await response.json());
    } catch {
      // Keep the last good data visible during an interrupted request.
    } finally {
      pending = false;
    }
  }
  function whenVisible(element, render) {
    if (!element || !('IntersectionObserver' in window)) {
      render();
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      render();
    }, {rootMargin: '240px'});
    observer.observe(element);
  }
  merge(persisted());
  window.KiseroHome = {
    whenVisible,
    subscribe(render) {
      listeners.add(render);
      if (current) render(current);
    },
  };
  refresh();
  setInterval(refresh, 15000);
  document.addEventListener('visibilitychange', refresh);
})();
