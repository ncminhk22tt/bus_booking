(async () => {
  const url = 'http://localhost:5000/api/trips/search?from_city=1&to_city=2&date=2026-05-11';
  const res = await fetch(url);
  const text = await res.text();
  console.log('status', res.status);
  console.log(text);
})();
