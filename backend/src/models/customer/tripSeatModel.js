const db = require("../../config/db")

async function getTripSeats(tripId) {

  const [rows] = await db.query(
    `
    SELECT 
      trip_seats.id,
      seats.seat_number,
      seats.floor,
      seats.row_index,
      seats.col_index,
      trip_seats.status

    FROM trip_seats

    JOIN seats 
    ON trip_seats.seat_id = seats.id

    WHERE trip_seats.trip_id = ?

    ORDER BY seats.floor, seats.row_index, seats.col_index
    `,
    [tripId]
  )

  return rows
}

module.exports = {
  getTripSeats
}