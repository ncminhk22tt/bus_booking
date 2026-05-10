const db = require("../config/db")

async function generateTripSeats(tripId, busId) {

  await db.query(`
  
    INSERT INTO trip_seats (trip_id, seat_id, status)

    SELECT
      ?, 
      id,
      'available'

    FROM seats
    WHERE bus_id = ?

  `, [tripId, busId])

}

module.exports = {
  generateTripSeats
}