const mysql = require('mysql2/promise');
(async () => {
  const db = await mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'bus_booking',
    port: 3306
  });
  try {
    const [result] = await db.query("INSERT INTO trips (bus_id, route_id, departure_time, arrival_time, price) VALUES (1,1,'2026-05-14 03:00:00','2026-05-14 16:00:00',200000.00)");
    const tripId = result.insertId;
    console.log('inserted', tripId);
    const [rowsSQL] = await db.query("SELECT id,departure_time,arrival_time,price,DATE(departure_time) as dt FROM trips WHERE id=?", [tripId]);
    console.log('sql', rowsSQL);
    const [rows13] = await db.query("SELECT id FROM trips WHERE DATE(departure_time)='2026-05-13'");
    const [rows14] = await db.query("SELECT id FROM trips WHERE DATE(departure_time)='2026-05-14'");
    console.log('rows13', rows13.map(r=>r.id));
    console.log('rows14', rows14.map(r=>r.id));
    for (const date of ['2026-05-13', '2026-05-14']) {
      const res = await fetch(`http://localhost:5000/api/trips/search?from_city=1&to_city=2&date=${date}`);
      const data = await res.json();
      console.log('api', date, 'status', res.status, 'count', data.length);
      console.log(data.map(t => ({id: t.id, departure_time: t.departure_time, from_city:t.from_city, to_city:t.to_city})));
    }
    await db.query('DELETE FROM trips WHERE id=?', [tripId]);
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
})();
