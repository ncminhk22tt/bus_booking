require('dotenv').config();
const mysql = require('mysql2/promise');

const sql = `USE bus_booking;
CREATE INDEX idx_seats_bus_floor_row_col ON seats (bus_id, floor, row_index, col_index);`;

mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
}).then(conn =>
  conn.query(sql)
    .then(() => {
      console.log('SEAT_MAP_UPDATES_APPLIED_OK');
      conn.end();
    })
    .catch(e => {
      console.error('ERROR:', e.message);
      conn.end();
    })
).catch(e => console.error('CONNECTION_ERROR:', e.message));
