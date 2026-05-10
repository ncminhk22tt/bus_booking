const db = require("../../config/db")
const bookingModel = require("../../models/customer/bookingModel")

async function ensureTripOpen(connection, tripId) {
  const [tripRows] = await connection.query(
    `
    SELECT price, status
    FROM trips
    WHERE id = ?
    FOR UPDATE
    `,
    [tripId]
  )

  if (tripRows.length === 0) {
    return { error: { status: 404, message: "Chuyến không tồn tại" } }
  }

  if (tripRows[0].status !== "open") {
    return { error: { status: 409, message: "Chuyến không khả dụng" } }
  }

  return { price: Number(tripRows[0].price) }
}

function computeTicketPrice(basePrice, isVip) {
  if (isVip) return Math.round(Number(basePrice || 0) * 1.5)
  return Number(basePrice || 0)
}

async function bookTicket(req, res) {
  try {
    const customerId = req.customer.id
    const { trip_id, seats, contact_name, contact_phone } = req.body

    if (!trip_id || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({
        message: "Thiếu thông tin đặt vé"
      })
    }

    const uniqueSeats = [...new Set(seats.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0))]
    const contactName = String(contact_name || "").trim()
    const contactPhone = String(contact_phone || "").trim()

    if (uniqueSeats.length === 0) {
      return res.status(400).json({
        message: "Danh sách ghế không hợp lệ"
      })
    }

    if (contactName && contactName.length < 2) {
      return res.status(400).json({
        message: "Họ tên người đi chưa hợp lệ"
      })
    }

    if (contactPhone && !/^\d{9,11}$/.test(contactPhone)) {
      return res.status(400).json({
        message: "Số điện thoại người đi phải từ 9-11 chữ số"
      })
    }

    const connection = await db.getConnection()
    try {
      await connection.beginTransaction()

      const tripCheck = await ensureTripOpen(connection, trip_id)
      if (tripCheck.error) {
        await connection.rollback()
        return res.status(tripCheck.error.status).json({
          message: tripCheck.error.message
        })
      }

      const seatPlaceholders = uniqueSeats.map(() => "?").join(",")
      const [seatRows] = await connection.query(
        `
        SELECT seat_id, status, is_vip
        FROM trip_seats
        WHERE trip_id = ?
          AND seat_id IN (${seatPlaceholders})
        FOR UPDATE
        `,
        [trip_id, ...uniqueSeats]
      )

      if (seatRows.length !== uniqueSeats.length) {
        await connection.rollback()
        return res.status(404).json({
          message: "Một hoặc nhiều ghế không tồn tại trong chuyến"
        })
      }

      const blocked = seatRows.filter((row) => row.status !== "available")
      if (blocked.length > 0) {
        await connection.rollback()
        return res.status(409).json({
          message: "Ghế đã được đặt hoặc đang bị khóa"
        })
      }

      const [lockResult] = await connection.query(
        `
        UPDATE trip_seats
        SET status = 'booked'
        WHERE seat_id IN (${seatPlaceholders})
          AND trip_id = ?
          AND status = 'available'
        `,
        [...uniqueSeats, trip_id]
      )

      if (lockResult.affectedRows !== uniqueSeats.length) {
        await connection.rollback()
        return res.status(409).json({
          message: "Ghế đã được đặt"
        })
      }

      // Tránh lỗi unique (trip_id, seat_id) khi ghế từng có ticket đã hủy.
      // Chỉ xóa ticket trạng thái cancelled cho chính các ghế đang đặt lại.
      await connection.query(
        `
        DELETE FROM tickets
        WHERE trip_id = ?
          AND seat_id IN (${seatPlaceholders})
          AND status = 'cancelled'
        `,
        [trip_id, ...uniqueSeats]
      )

      const ticketItems = seatRows.map((row) => ({
        seatId: row.seat_id,
        price: computeTicketPrice(tripCheck.price, Boolean(row.is_vip)),
        status: "confirmed"
      }))
      const totalPrice = ticketItems.reduce((sum, item) => sum + Number(item.price || 0), 0)

      const bookingId = await bookingModel.createBookingWithTickets(connection, {
        customerId,
        contactName: contactName || null,
        contactPhone: contactPhone || null,
        tripId: trip_id,
        totalPrice,
        ticketItems,
        bookingStatus: "confirmed",
        ticketStatus: "confirmed"
      })

      await connection.commit()

      res.json({
        message: "Đặt vé thành công",
        booking_id: bookingId
      })
    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Book ticket error:", error)
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Ghế đã được đặt hoặc có xung đột dữ liệu ghế"
      })
    }
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

async function getMyBookings(req, res) {
  try {
    const customerId = req.customer.id
    const { status } = req.query
    const bookings = await bookingModel.getBookingsWithTickets(customerId, status)
    res.json(bookings)
  } catch (error) {
    console.error("Get bookings error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

async function getBookingDetail(req, res) {
  try {
    const customerId = req.customer.id
    const bookingId = Number(req.params.id)

    const booking = await bookingModel.getBookingDetail(customerId, bookingId)
    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy booking"
      })
    }

    res.json(booking)
  } catch (error) {
    console.error("Get booking detail error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

async function cancelBooking(req, res) {
  const bookingId = Number(req.params.id)
  const customerId = req.customer.id

  const connection = await db.getConnection()
  try {
    await connection.beginTransaction()

    const booking = await bookingModel.getBookingById(customerId, bookingId)

    if (!booking) {
      await connection.rollback()
      return res.status(404).json({
        message: "Không tìm thấy booking"
      })
    }

    if (booking.status === "cancelled") {
      await connection.rollback()
      return res.status(409).json({
        message: "Booking đã bị hủy"
      })
    }

    const [ticketRows] = await connection.query(
      "SELECT seat_id FROM tickets WHERE booking_id = ?",
      [bookingId]
    )

    const seatIds = ticketRows.map(r => r.seat_id)

    await connection.query(
      "UPDATE tickets SET status = 'cancelled' WHERE booking_id = ?",
      [bookingId]
    )

    if (seatIds.length > 0) {
      const placeholders = seatIds.map(() => "?").join(",")
      await connection.query(
        `
        UPDATE trip_seats
        SET status = 'available'
        WHERE trip_id = ? AND seat_id IN (${placeholders})
        `,
        [booking.trip_id, ...seatIds]
      )
    }

    await connection.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
      [bookingId]
    )

    await connection.commit()

    res.json({
      message: "Hủy vé thành công"
    })
  } catch (error) {
    await connection.rollback()
    console.error("Cancel booking error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  } finally {
    connection.release()
  }
}

async function payBooking(req, res) {
  const bookingId = Number(req.params.id)
  const customerId = req.customer.id

  try {
    const booking = await bookingModel.getBookingById(customerId, bookingId)
    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy booking"
      })
    }

    res.json({
      message: "Đã thanh toán"
    })
  } catch (error) {
    console.error("Pay booking error:", error)
    res.status(500).json({
      message: "Lỗi server"
    })
  }
}

module.exports = {
  bookTicket,
  getMyBookings,
  getBookingDetail,
  cancelBooking,
  payBooking
}
