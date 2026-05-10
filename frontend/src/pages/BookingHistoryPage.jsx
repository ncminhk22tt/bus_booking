import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  Bus,
  Clock3,
  MapPin,
  Ticket,
  Wallet,
  CalendarDays,
  Ban,
  Eye,
  Star
} from "lucide-react"

import { API_BASE_URL, api } from "../lib/api"
import { formatCurrency, formatDateTime } from "../lib/formatters"

const STATUS_LABELS = {
  pending: "Chờ xử lý",
  confirmed: "Đã thanh toán",
  cancelled: "Đã hủy",
  expired: "Hết hạn"
}

const STATUS_STYLES = {
  pending:
    "bg-yellow-100 text-yellow-700 border-yellow-200",

  confirmed:
    "bg-green-100 text-green-700 border-green-200",

  cancelled:
    "bg-red-100 text-red-700 border-red-200",

  expired:
    "bg-slate-100 text-slate-700 border-slate-200"
}

function getDurationText(
  departureTime,
  arrivalTime,
  estimatedTime
) {
  if (
    estimatedTime !== null &&
    estimatedTime !== undefined &&
    estimatedTime !== ""
  ) {
    return `${estimatedTime} giờ`
  }

  if (!departureTime || !arrivalTime) return "--"

  const start = new Date(departureTime).getTime()
  const end = new Date(arrivalTime).getTime()

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    end <= start
  ) {
    return "--"
  }

  const totalMinutes = Math.floor(
    (end - start) / (1000 * 60)
  )

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (minutes === 0) return `${hours} giờ`

  return `${hours} giờ ${minutes} phút`
}

export function BookingHistoryPage() {
  const [status, setStatus] = useState("")
  const [bookings, setBookings] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [actionId, setActionId] = useState(null)

  async function loadBookings(currentStatus = status) {
    setLoading(true)
    setError("")

    try {
      const rawData = await api.getMyBookings(
        currentStatus || undefined
      )

      const needDetailTripIds = [
        ...new Set(
          rawData
            .filter(
              (item) =>
                item.trip_id &&
                (!item.departure_time ||
                  !item.departure_city ||
                  !item.arrival_city ||
                  !item.bus_type_name ||
                  !item.bus_company_name ||
                  !item.license_plate)
            )
            .map((item) => item.trip_id)
        )
      ]

      const tripDetailMap = new Map()

      await Promise.all(
        needDetailTripIds.map(async (tripId) => {
          try {
            const detail =
              await api.getTripDetail(tripId)

            tripDetailMap.set(
              Number(tripId),
              detail || null
            )
          } catch {
            tripDetailMap.set(Number(tripId), null)
          }
        })
      )

      const data = rawData.map((item) => {
        const detail = tripDetailMap.get(
          Number(item.trip_id)
        )

        if (!detail) return item

        return {
          ...item,
          departure_time:
            item.departure_time ||
            detail.departure_time ||
            null,

          arrival_time:
            item.arrival_time ||
            detail.arrival_time ||
            null,

          departure_city:
            item.departure_city ||
            detail.from_city ||
            null,

          arrival_city:
            item.arrival_city ||
            detail.to_city ||
            null,

          bus_name:
            item.bus_name || detail.bus_name || null,

          bus_type_name:
            item.bus_type_name ||
            detail.bus_type_name ||
            null,

          bus_company_name:
            item.bus_company_name ||
            detail.bus_company ||
            null,

          license_plate:
            item.license_plate ||
            detail.license_plate ||
            null
        }
      })

      setBookings(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBookings()
  }, [status])

  async function runAction(action, bookingId) {
    try {
      setActionId(bookingId)

      if (action === "cancel") {
        await api.cancelBooking(bookingId)
      }

      await loadBookings()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Lịch sử đặt vé
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Theo dõi tất cả chuyến xe của bạn
            </p>
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2563eb]"
          >
            <option value="">
              Tất cả trạng thái
            </option>

            <option value="confirmed">
              Đã thanh toán
            </option>

            <option value="cancelled">
              Đã hủy
            </option>
          </select>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Đang tải lịch sử đặt vé...
        </div>
      )}

      {/* ERROR */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* EMPTY */}
      {!loading &&
        !error &&
        bookings.length === 0 && (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
              <Ticket
                size={36}
                className="text-slate-400"
              />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Chưa có vé nào
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Bạn chưa thực hiện đặt vé xe nào.
            </p>
          </div>
        )}

      {/* BOOKINGS */}
      <div className="space-y-4">
        {bookings.map((booking) => {
          const canCancel =
            booking.status !== "cancelled"

          const imageSrc = booking.bus_image_url
            ? `${API_BASE_URL}${booking.bus_image_url}`
            : ""

          const seatText =
            booking.tickets
              .map(
                (ticket) =>
                  ticket.seat_number ||
                  `#${ticket.seat_id}`
              )
              .join(", ") || "--"

          return (
            <article
              key={booking.booking_id}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-col lg:flex-row">
                {/* IMAGE */}
                <div className="h-[240px] w-full overflow-hidden bg-slate-100 lg:h-auto lg:w-[320px]">
                  {imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={
                        booking.bus_name || "Ảnh xe"
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full min-h-[240px] items-center justify-center">
                      <Bus
                        size={52}
                        className="text-slate-400"
                      />
                    </div>
                  )}
                </div>

                {/* CONTENT */}
                <div className="flex flex-1 flex-col justify-between p-6">
                  {/* TOP */}
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    {/* LEFT */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-3xl font-extrabold text-slate-900">
                          {booking.bus_company_name ||
                            "Nhà xe"}
                        </h2>

                        <div className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                          <Star
                            size={12}
                            fill="currentColor"
                          />
                          4.8
                        </div>
                      </div>

                      <p className="mt-1 text-lg font-semibold text-slate-700">
                        {booking.bus_type_name ||
                          booking.bus_name ||
                          "--"}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-6">
                        <div>
                          <p className="text-2xl font-extrabold text-slate-900">
                            {booking.departure_time
                              ? new Date(
                                  booking.departure_time
                                ).toLocaleTimeString(
                                  "vi-VN",
                                  {
                                    hour: "2-digit",
                                    minute:
                                      "2-digit"
                                  }
                                )
                              : "--"}
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                            <MapPin size={14} />
                            {booking.departure_city ||
                              "--"}
                          </p>
                        </div>

                        <div className="flex flex-col items-center">
                          <Clock3
                            size={18}
                            className="text-slate-400"
                          />

                          <span className="mt-1 text-xs font-medium text-slate-500">
                            {getDurationText(
                              booking.departure_time,
                              booking.arrival_time,
                              booking.estimated_time
                            )}
                          </span>
                        </div>

                        <div>
                          <p className="text-2xl font-extrabold text-slate-900">
                            {booking.arrival_time
                              ? new Date(
                                  booking.arrival_time
                                ).toLocaleTimeString(
                                  "vi-VN",
                                  {
                                    hour: "2-digit",
                                    minute:
                                      "2-digit"
                                  }
                                )
                              : "--"}
                          </p>

                          <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                            <MapPin size={14} />
                            {booking.arrival_city ||
                              "--"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2">
                        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
                          <Ticket
                            size={18}
                            className="text-[#2563eb]"
                          />

                          <div>
                            <p className="text-xs text-slate-500">
                              Ghế đã đặt
                            </p>

                            <p className="font-semibold text-slate-800">
                              {seatText}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
                          <Bus
                            size={18}
                            className="text-[#2563eb]"
                          />

                          <div>
                            <p className="text-xs text-slate-500">
                              Biển số xe
                            </p>

                            <p className="font-semibold text-slate-800">
                              {booking.license_plate ||
                                "--"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="min-w-[240px] rounded-3xl border border-slate-200 bg-[#f8fbff] p-5">
                      <div
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                          STATUS_STYLES[
                            booking.status
                          ]
                        }`}
                      >
                        {STATUS_LABELS[
                          booking.status
                        ] || booking.status}
                      </div>

                      <div className="mt-5">
                        <p className="text-sm text-slate-500">
                          Tổng tiền
                        </p>

                        <p className="mt-1 text-3xl font-extrabold text-[#2563eb]">
                          {formatCurrency(
                            booking.total_price
                          )}
                        </p>
                      </div>

                      <div className="mt-5 flex items-start gap-2 text-sm text-slate-500">
                        <CalendarDays size={16} />

                        <span>
                          Đặt lúc{" "}
                          {formatDateTime(
                            booking.created_at
                          )}
                        </span>
                      </div>

                      <div className="mt-6 space-y-2">
                        <Link
                          to={`/trip/${booking.trip_id}`}
                          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
                        >
                          <Eye size={16} />
                          Xem chuyến
                        </Link>

                        {canCancel && (
                          <button
                            type="button"
                            disabled={
                              actionId ===
                              booking.booking_id
                            }
                            onClick={() =>
                              runAction(
                                "cancel",
                                booking.booking_id
                              )
                            }
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                          >
                            <Ban size={16} />

                            {actionId ===
                            booking.booking_id
                              ? "Đang xử lý..."
                              : "Hủy vé"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
