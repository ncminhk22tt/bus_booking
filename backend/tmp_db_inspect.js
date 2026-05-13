const mysql = require('mysql2/promise');
(async () => {
  const db = await mysql.createPool({host:'localhost',user:'root',password:'123456',database:'bus_booking',port:3306});
  try {
    const [types] = await db.query('SELECT id,name,description,floors,row_count,col_count,total_seats,seat_type,layout,seat_map_template FROM bus_types');
    console.log('TYPES', JSON.stringify(types, null, 2));
    const [rows] = await db.query('SHOW CREATE TABLE seats');
    console.log('SEATS TABLE', rows[0]['Create Table']);
  } catch (err) {
    console.error(err);
  } finally {
    await db.end();
  }
})();
