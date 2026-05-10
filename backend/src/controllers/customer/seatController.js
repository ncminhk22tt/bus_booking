const db = require("../../config/db")
const { getTripSeats } = require("../../models/customer/tripSeatModel")
const { buildSeatMap } = require("../../utils/seatMapBuilder")

async function getSeats(req, res) {
  try {
    const { id } = req.params

    const seats = await getTripSeats(id)

    res.json(seats)
  } catch (error) {
    console.error("Get seats error:", error)

    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

async function getSeatMap(req, res) {
  try {
    const { id } = req.params

    /* =========================================
      BUS META
    ========================================= */

    const [metaRows] = await db.query(
      `
      SELECT 
        bt.name AS bus_type_name,
        bt.layout,
        bt.row_count,
        bt.col_count,
        bt.floors,
        bt.total_seats
      FROM trips t
      JOIN buses b 
        ON t.bus_id = b.id
      JOIN bus_types bt 
        ON b.bus_type_id = bt.id
      WHERE t.id = ?
      LIMIT 1
      `,
      [id]
    )

    if (metaRows.length === 0) {
      return res.status(404).json({
        message: "Chuyến không tồn tại"
      })
    }

    const meta = metaRows[0]

    /* =========================================
      SEATS
    ========================================= */

    const [seatRows] = await db.query(
      `
      SELECT 
        ts.id AS trip_seat_id,
        ts.status,

        s.id AS seat_id,
        s.seat_number,
        s.floor,
        s.row_index,
        s.col_index,
        s.seat_type,

        s.seat_class,
        s.price_multiplier,
        s.is_hidden

      FROM trip_seats ts

      JOIN seats s 
        ON ts.seat_id = s.id

      WHERE ts.trip_id = ?

      ORDER BY
        s.floor,
        s.row_index,
        s.col_index
      `,
      [id]
    )

    /* =========================================
      FILTER HIDDEN
    ========================================= */

    const visibleSeats = seatRows.filter(
      (seat) => !seat.is_hidden
    )

    /* =========================================
      BUILD MAP
    ========================================= */

    const seatMap = buildSeatMap(
      visibleSeats,
      meta
    )

    /* =========================================
      RESPONSE
    ========================================= */

    res.json({
      trip_id: Number(id),

      meta: {
        ...meta,

        floors: Number(
          meta.floors || 1
        ),

        row_count: Number(
          meta.row_count || 0
        ),

        col_count: Number(
          meta.col_count || 0
        ),

        total_seats: Number(
          meta.total_seats || 0
        )
      },

      summary: {
        total: visibleSeats.length,

        available:
          visibleSeats.filter(
            (s) =>
              s.status === "available"
          ).length,

        booked:
          visibleSeats.filter(
            (s) =>
              s.status === "booked"
          ).length,

        locked:
          visibleSeats.filter(
            (s) =>
              s.status === "locked"
          ).length
      },

      floors: seatMap
    })
  } catch (error) {
    console.error(
      "Get seat map error:",
      error
    )

    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

module.exports = {
  getSeats,
  getSeatMap
}
