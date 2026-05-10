import { useEffect, useState } from "react"
import { api } from "../lib/api"
import BusSeatPicker from "./BusSeatPicker"

export default function SeatMap({ busId, tripId }) {
  const [seats, setSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function loadSeats() {
      try {
        setLoading(true)
        setError("")
        const rows = await api.getSeatsByBus(busId, tripId)
        if (!cancelled) {
          setSeats(rows)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Không tải được dữ liệu ghế")
          setLoading(false)
        }
      }
    }

    if (busId && tripId) loadSeats()

    return () => {
      cancelled = true
    }
  }, [busId, tripId])

  async function handleConfirmBooking(seatIds, paymentMeta = {}) {
    await api.createBooking({
      trip_id: Number(tripId),
      seats: seatIds,
      contact_name: paymentMeta.contact_name || "",
      contact_phone: paymentMeta.contact_phone || ""
    })

    const rows = await api.getSeatsByBus(busId, tripId)
    setSeats(rows)
  }

  if (loading) return <p className="text-sm text-slate-500">Đang tải sơ đồ ghế...</p>
  if (error) return <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>

  return (
    <BusSeatPicker
      busType={seats[0]?.busType || ""}
      seats={seats}
      onConfirmBooking={handleConfirmBooking}
    />
  )
}
