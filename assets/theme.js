// Runs in <head> before paint so the saved theme never flashes. Dark is the default.
(function () {
  var t = 'dark';
  try { t = localStorage.getItem('ci-theme') || 'dark'; } catch (e) {}
  document.documentElement.setAttribute('data-theme', t === 'light' ? 'light' : 'dark');
})();
