const mysql = require('mysql2/promise');
(async () => {
  const db = await mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'bus_booking',
    port: 3306
  });

  const [cities] = await db.query('SELECT id,name FROM cities ORDER BY id');
  console.log('cities', cities);

  const [trips13] = await db.query("SELECT id,departure_time,arrival_time,route_id,price FROM trips WHERE DATE(departure_time)='2026-05-13' ORDER BY departure_time");
  console.log('trips13', trips13);

  const [trips14] = await db.query("SELECT id,departure_time,arrival_time,route_id,price FROM trips WHERE DATE(departure_time)='2026-05-14' ORDER BY departure_time");
  console.log('trips14', trips14);

  await db.end();
})();
