// Runs in <head> before paint so the saved theme never flashes. Dark is the default.
// Also sets the browser bar colour (theme-color) to match the header.
(function () {
  var t = 'dark';
  try { t = localStorage.getItem('ci-theme') || 'dark'; } catch (e) {}
  t = t === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
  var m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', t === 'light' ? '#ffffff' : '#15171a');
})();
