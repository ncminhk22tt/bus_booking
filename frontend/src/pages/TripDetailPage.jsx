import { useEffect, useState } from "react"
import { Link, useLocation, useParams } from "react-router-dom"
import { MapPin, Clock3, Bus, Ticket, Star, CalendarDays } from "lucide-react"
import SeatMap from "../components/SeatMap"
import { useAuth } from "../context/AuthContext"
import { api } from "../lib/api"
import {
  calcDuration,
  formatCurrency,
  formatDateTime,
  formatTime,
} from "../lib/formatters"

export function TripDetailPage() {
  const { isAuthenticated } = useAuth()
  const { id } = useParams()
  const location = useLocation()

  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadDetail() {
      try {
        setLoading(true)
        setError("")

        const tripData = await api.getTripDetail(id)

        if (!cancelled) {
          setTrip(tripData)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không tải được chi tiết chuyến")
          setLoading(false)
        }
      }
    }

    loadDetail()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-500">
          Đang tải chi tiết chuyến...
        </p>
      </div>
    )
  }

  if (error || !trip) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error || "Không tìm thấy chuyến"}
      </div>
    )
  }

  const nextUrl = `${location.pathname}${location.search}`

  return (
    <div className="space-y-5">
      {/* CARD CHÍNH */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}
        <div className="border-b border-slate-100 bg-[#f8fbff] px-6 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            {/* LEFT */}
            <div className="flex gap-4">
              {/* ẢNH XE */}
              <div className="flex h-28 w-36 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Bus size={40} />
              </div>

              {/* INFO */}
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900">
                    {trip.bus_company}
                  </h1>

                  <div className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                    <Star size={12} fill="currentColor" />
                    4.8
                  </div>
                </div>

                <p className="text-sm text-slate-500">
                  {trip.bus_name} • {trip.bus_type_name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Biển số: {trip.license_plate}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-5">
                  <div>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {formatTime(trip.departure_time)}
                    </p>

                    <p className="flex items-center gap-1 text-sm text-slate-500">
                      <MapPin size={14} />
                      {trip.from_city}
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    <Clock3 className="text-slate-400" size={18} />

                    <span className="text-xs font-medium text-slate-500">
                      {calcDuration(
                        trip.departure_time,
                        trip.arrival_time
                      )}
                    </span>
                  </div>

                  <div>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {formatTime(trip.arrival_time)}
                    </p>

                    <p className="flex items-center gap-1 text-sm text-slate-500">
                      <MapPin size={14} />
                      {trip.to_city}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col items-end justify-center border-t border-slate-200 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <p className="text-3xl font-extrabold text-[#1d4ed8]">
                {formatCurrency(trip.price)}
              </p>

              <p className="mt-1 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                Còn ghế trống
              </p>

              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <CalendarDays size={15} />
                {formatDateTime(trip.departure_time)}
              </div>
            </div>
          </div>
        </div>

        {/* PICKUP / DROPOFF */}
        <div className="space-y-4 px-6 py-5">
          {Array.isArray(trip.pickup_points) &&
            trip.pickup_points.length > 0 && (
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-2 text-sm font-bold text-slate-700">
                  Điểm đón
                </p>

                <div className="flex flex-wrap gap-2">
                  {trip.pickup_points.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {Array.isArray(trip.dropoff_points) &&
            trip.dropoff_points.length > 0 && (
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="mb-2 text-sm font-bold text-slate-700">
                  Điểm trả
                </p>

                <div className="flex flex-wrap gap-2">
                  {trip.dropoff_points.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600"
                    >
                      {item.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {!isAuthenticated && (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              Bạn chưa đăng nhập.{" "}
              <Link
                className="font-bold text-blue-700 underline"
                to={`/login?next=${encodeURIComponent(nextUrl)}`}
              >
                Đăng nhập ngay
              </Link>{" "}
              để đặt vé.
            </div>
          )}
        </div>
      </div>

      {/* CHỌN GHẾ */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Ticket className="text-[#1d4ed8]" size={22} />

          <h2 className="text-xl font-extrabold text-slate-900">
            Chọn ghế
          </h2>
        </div>

        <SeatMap busId={trip.bus_id} tripId={id} />
      </div>
    </div>
  )
}
