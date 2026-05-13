import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Car, ImagePlus, MapPin, Route, Settings } from "lucide-react"
import { adminApi } from "../../lib/adminApi"
import { API_BASE_URL, api } from "../../lib/api"
import { formatCurrency, formatDateTime } from "../../lib/formatters"
import SeatLayoutPreview from "../../components/admin/SeatLayoutPreview"
import { useAdminAuth } from "../../context/AdminAuthContext"

const sections = [
  { key: "buses", label: "Tạo xe", icon: Car, desc: "Thêm xe mới theo loại xe" },
  { key: "bus-list", label: "Danh sách xe", icon: Car, desc: "Xem, sửa, ngừng hoạt động xe" },
  { key: "routes", label: "Quản lý tuyến", icon: Route, desc: "Tạo tuyến và cập nhật tuyến" },
  { key: "trips", label: "Quản lý chuyến", icon: MapPin, desc: "Tạo chuyến mới và theo dõi" },
  { key: "bookings", label: "Quản lý booking", icon: CalendarDays, desc: "Tra cứu booking theo tuyến/chuyến" },
  { key: "trip-seats", label: "Quản lý ghế", icon: CalendarDays, desc: "Khóa ghế và đánh dấu VIP theo chuyến" },
  { key: "profile", label: "Đổi thông tin", icon: Settings, desc: "Đổi số điện thoại và mật khẩu" }
]


function SectionCard({ title, children, className = "", bodyClassName = "" }) {
  return (
    <section className={`flex flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-card ${className}`}>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <div className={`mt-3 ${bodyClassName}`}>{children}</div>
    </section>
  )
}

export function AdminDashboardPage() {
  const { token } = useAdminAuth()
  const [activeSection, setActiveSection] = useState("buses")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const [cities, setCities] = useState([])
  const [busTypes, setBusTypes] = useState([])
  const [buses, setBuses] = useState([])
  const [routes, setRoutes] = useState([])
  const [trips, setTrips] = useState([])

  const [bookingRouteId, setBookingRouteId] = useState("")
  const [bookingTripId, setBookingTripId] = useState("")
  const [tripBookings, setTripBookings] = useState([])
  const [bookingView, setBookingView] = useState("active")
  const [seatRouteId, setSeatRouteId] = useState("")
  const [seatTripId, setSeatTripId] = useState("")
  const [tripSeats, setTripSeats] = useState([])
  const [seatFloor, setSeatFloor] = useState(1)
  const [selectedSeatIds, setSelectedSeatIds] = useState([])
  const [seatBatchAction, setSeatBatchAction] = useState("vip_on")
  const [applyingSeatBatch, setApplyingSeatBatch] = useState(false)

  const [busForm, setBusForm] = useState({
    bus_type_id: "",
    name: "",
    license_plate: "",
    image_data: "",
    image_name: ""
  })
  const [routeForm, setRouteForm] = useState({
    departure_city_id: "",
    arrival_city_id: "",
    distance_km: "",
    estimated_time: "",
    pickup_points_text: "",
    dropoff_points_text: ""
  })
  const [tripRoutePoints, setTripRoutePoints] = useState({ pickup_points: [], dropoff_points: [] })
  const [tripPointPairs, setTripPointPairs] = useState([])
  const [tripForm, setTripForm] = useState({
    route_id: "",
    point_pair_key: "",
    bus_id: "",
    departure_time: "",
    arrival_time: "",
    price: ""
  })
  const [profileForm, setProfileForm] = useState({ phone: "", password: "", company_name: "", address: "" })
  const [editingBus, setEditingBus] = useState(null)
  const [editingRouteId, setEditingRouteId] = useState(null)
  const [editingTripId, setEditingTripId] = useState(null)
  const [pendingDeleteBus, setPendingDeleteBus] = useState(null)
  const [pendingDeleteRoute, setPendingDeleteRoute] = useState(null)
  const [pendingDeleteTrip, setPendingDeleteTrip] = useState(null)
  const minDateTimeLocal = useMemo(() => {
    const now = new Date()
    now.setSeconds(0, 0)
    const tzOffset = now.getTimezoneOffset() * 60000
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16)
  }, [])

  useEffect(() => {
    setError("")
    setMessage("")
    setCities([])
    setBusTypes([])
    setBuses([])
    setRoutes([])
    setTrips([])
    setTripBookings([])
    setTripSeats([])
    loadBootstrapData()
  }, [token])

  useEffect(() => {
    loadTripRoutePoints(tripForm.route_id)
  }, [tripForm.route_id, routes])

  useEffect(() => {
    if (!tripForm.route_id) return

    setTripForm((prev) => {
      const firstPair = String(tripPointPairs[0]?.key || "")
      if (!firstPair) return prev
      const pairExists = tripPointPairs.some((item) => item.key === prev.point_pair_key)
      const nextKey = pairExists ? prev.point_pair_key : firstPair
      if (nextKey === prev.point_pair_key) return prev
      return { ...prev, point_pair_key: nextKey }
    })
  }, [tripPointPairs, tripForm.route_id])

  async function loadBootstrapData() {
    try {
      setError("")
      const [cityRows, typeRows, busRows, routeRows, tripRows] = await Promise.all([
        api.getCities(),
        adminApi.getBusTypes(),
        adminApi.getBuses(),
        adminApi.getRoutes(),
        adminApi.getTrips()
      ])
      setCities(cityRows)
      setBusTypes(typeRows)
      setBuses(busRows)
      setRoutes(routeRows)
      setTrips(tripRows)
    } catch (err) {
      setError(err.message)
    }
  }

  const cityMap = useMemo(() => {
    const map = new Map()
    for (const city of cities) map.set(String(city.id), city.name)
    return map
  }, [cities])

  const uniqueTripRoutes = useMemo(() => {
    const seen = new Set()
    const output = []
    for (const route of routes) {
      const key = `${route.departure_city_id}-${route.arrival_city_id}`
      if (seen.has(key)) continue
      seen.add(key)
      output.push(route)
    }
    return output
  }, [routes])

  const selectedTripPointPair = useMemo(
    () => tripPointPairs.find((item) => item.key === tripForm.point_pair_key) || null,
    [tripPointPairs, tripForm.point_pair_key]
  )

  const tripPointsReady = Boolean(selectedTripPointPair)

  const busImageMap = useMemo(() => {
    const map = new Map()
    for (const bus of buses) {
      map.set(Number(bus.id), bus.image_url || "")
    }
    return map
  }, [buses])

  const bookingTrips = useMemo(() => {
    if (!bookingRouteId) return []
    return trips.filter((trip) => String(trip.route_id) === String(bookingRouteId))
  }, [trips, bookingRouteId])

  const seatTrips = useMemo(() => {
    if (!seatRouteId) return []
    return trips.filter((trip) => String(trip.route_id) === String(seatRouteId))
  }, [trips, seatRouteId])

  const routeBusPlatesMap = useMemo(() => {
    const map = new Map()
    for (const trip of trips) {
      const routeId = String(trip.route_id)
      if (!map.has(routeId)) map.set(routeId, new Set())
      if (trip.license_plate) map.get(routeId).add(trip.license_plate)
    }
    return map
  }, [trips])

  const activeTripBookings = useMemo(
    () => tripBookings.filter((item) => String(item.booking_status || "").toLowerCase() !== "cancelled"),
    [tripBookings]
  )

  const cancelledTripBookings = useMemo(
    () => tripBookings.filter((item) => String(item.booking_status || "").toLowerCase() === "cancelled"),
    [tripBookings]
  )

  const selectedBusType = useMemo(() => {
    return busTypes.find((item) => String(item.id) === String(busForm.bus_type_id)) || null
  }, [busTypes, busForm.bus_type_id])

  function buildImageSrc(imageUrl) {
    if (!imageUrl) return ""
    if (/^https?:\/\//i.test(imageUrl)) return imageUrl
    return `${API_BASE_URL}${imageUrl}`
  }

  function parsePointsText(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map((line) => String(line).trim())
      .filter(Boolean)
      .map((name) => ({ name }))
  }

  async function refreshSectionData(sectionKey) {
    try {
      if (sectionKey === "buses" || sectionKey === "bus-list") setBuses(await adminApi.getBuses())
      if (sectionKey === "routes") {
        const rows = await adminApi.getRoutes()
        setRoutes(rows)
      }
      if (sectionKey === "trips") setTrips(await adminApi.getTrips())
    } catch (err) {
      setError(err.message)
    }
  }

  async function loadTripRoutePoints(routeId) {
    if (!routeId) {
      setTripRoutePoints({ pickup_points: [], dropoff_points: [] })
      setTripPointPairs([])
      return
    }

    try {
      const selectedRoute = routes.find((item) => String(item.id) === String(routeId))
      const sameRoutes = selectedRoute
        ? routes.filter(
            (item) =>
              String(item.departure_city_id) === String(selectedRoute.departure_city_id) &&
              String(item.arrival_city_id) === String(selectedRoute.arrival_city_id)
          )
        : [{ id: routeId }]

      const grouped = await Promise.all(
        sameRoutes.map(async (route) => {
          const data = await adminApi.getRoutePoints(route.id)
          return {
            routeId: route.id,
            pickup_points: Array.isArray(data?.pickup_points) ? data.pickup_points : [],
            dropoff_points: Array.isArray(data?.dropoff_points) ? data.dropoff_points : []
          }
        })
      )

      const pickupMap = new Map()
      const dropoffMap = new Map()
      const pairs = []

      grouped.forEach((group) => {
        group.pickup_points.forEach((item) => pickupMap.set(String(item.id), item))
        group.dropoff_points.forEach((item) => dropoffMap.set(String(item.id), item))

        const len = Math.min(group.pickup_points.length, group.dropoff_points.length)
        for (let index = 0; index < len; index += 1) {
          const pickup = group.pickup_points[index]
          const dropoff = group.dropoff_points[index]
          pairs.push({
            key: `${group.routeId}-${pickup.id}-${dropoff.id}`,
            label: `${pickup.name} → ${dropoff.name}`,
            pickup,
            dropoff
          })
        }
      })

      setTripRoutePoints({
        pickup_points: Array.from(pickupMap.values()),
        dropoff_points: Array.from(dropoffMap.values())
      })
      setTripPointPairs(pairs)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleBusImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn đúng tệp ảnh")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setBusForm((prev) => ({
        ...prev,
        image_data: String(reader.result || ""),
        image_name: file.name
      }))
    }
    reader.readAsDataURL(file)
  }

  async function createBus(event) {
    event.preventDefault()
    try {
      setError("")
      setMessage("")

      if (!busForm.bus_type_id || !busForm.license_plate.trim()) {
        setError("Vui lòng chọn loại xe và nhập biển số")
        return
      }

      const duplicate = buses.some(
        (bus) => String(bus.license_plate || "").toLowerCase() === busForm.license_plate.trim().toLowerCase()
      )
      if (duplicate) {
        setError("Biển số xe đã tồn tại trong danh sách hiện tại")
        return
      }

      const payload = {
        bus_type_id: Number(busForm.bus_type_id),
        name: busForm.name.trim(),
        license_plate: busForm.license_plate.trim(),
        image_base64: busForm.image_data || undefined,
        image_name: busForm.image_name || undefined
      }

      await adminApi.createBus(payload)

      setMessage("Tạo xe thành công")
      setBusForm({ bus_type_id: "", name: "", license_plate: "", image_data: "", image_name: "" })
      await refreshSectionData("buses")
    } catch (err) {
      if (String(err.message || "").includes("Lỗi server")) {
        setError("Thêm xe thất bại. Hãy kiểm tra lại loại xe, biển số hoặc quyền tài khoản admin.")
      } else {
        setError(err.message)
      }
    }
  }

  async function createRoute(event) {
    event.preventDefault()
    try {
      setError("")
      setMessage("")
      const payload = {
        departure_city_id: Number(routeForm.departure_city_id),
        arrival_city_id: Number(routeForm.arrival_city_id),
        distance_km: Number(routeForm.distance_km),
        estimated_time: Number(routeForm.estimated_time),
        pickup_points: parsePointsText(routeForm.pickup_points_text),
        dropoff_points: parsePointsText(routeForm.dropoff_points_text)
      }

      if (editingRouteId) {
        await adminApi.updateRoute(editingRouteId, payload)
        setMessage("Cập nhật tuyến thành công")
      } else {
        await adminApi.createRoute(payload)
        setMessage("Tạo tuyến thành công")
      }

      setEditingRouteId(null)
      setRouteForm({
        departure_city_id: "",
        arrival_city_id: "",
        distance_km: "",
        estimated_time: "",
        pickup_points_text: "",
        dropoff_points_text: ""
      })
      await refreshSectionData("routes")
    } catch (err) {
      setError(err.message)
    }
  }

  async function createTrip(event) {
    event.preventDefault()
    try {
      setError("")
      setMessage("")
      if (!tripForm.route_id) {
        setError("Vui lòng chọn tuyến")
        return
      }
      if (!selectedTripPointPair) {
        setError("Vui lòng chọn điểm đón → điểm trả theo tuyến")
        return
      }
      const payload = {
        route_id: Number(tripForm.route_id),
        bus_id: Number(tripForm.bus_id),
        departure_time: tripForm.departure_time,
        arrival_time: tripForm.arrival_time,
        price: Number(tripForm.price),
        pickup_points: [{
          name: selectedTripPointPair.pickup.name,
          address: selectedTripPointPair.pickup.address || null,
          time_offset_min: Number(selectedTripPointPair.pickup.time_offset_min || 0)
        }],
        dropoff_points: [{
          name: selectedTripPointPair.dropoff.name,
          address: selectedTripPointPair.dropoff.address || null,
          time_offset_min: Number(selectedTripPointPair.dropoff.time_offset_min || 0)
        }]
      }

      if (editingTripId) {
        await adminApi.updateTrip(editingTripId, payload)
        setMessage("Cập nhật chuyến thành công")
      } else {
        await adminApi.createTrip(payload)
        setMessage("Tạo chuyến thành công")
      }

      setEditingTripId(null)
      setTripForm({
        route_id: "",
        point_pair_key: "",
        bus_id: "",
        departure_time: "",
        arrival_time: "",
        price: ""
      })
      await refreshSectionData("trips")
    } catch (err) {
      setError(err.message)
    }
  }

  async function removeBus(id) {
    try {
      setError("")
      setMessage("")
      await adminApi.deleteBus(id)
      setMessage("Đã ngừng hoạt động xe")
      setEditingBus(null)
      setPendingDeleteBus(null)
      await refreshSectionData("bus-list")
    } catch (err) {
      setError(err.message)
    }
  }

  function openEditBus(bus) {
    setEditingBus({
      id: bus.id,
      name: bus.name || "",
      license_plate: bus.license_plate || "",
      bus_type_id: String(bus.bus_type_id || ""),
      image_data: "",
      image_name: "",
      image_preview: buildImageSrc(bus.image_url || "")
    })
  }

  function closeEditBus() {
    setEditingBus(null)
  }

  function askDeleteBus(bus) {
    setPendingDeleteBus(bus)
  }

  async function submitEditBus(event) {
    event.preventDefault()
    if (!editingBus) return

    try {
      setError("")
      setMessage("")

      if (!editingBus.license_plate.trim() || !editingBus.bus_type_id) {
        setError("Vui lòng nhập biển số và chọn loại xe")
        return
      }

      await adminApi.updateBus(editingBus.id, {
        name: editingBus.name.trim(),
        license_plate: editingBus.license_plate.trim(),
        bus_type_id: Number(editingBus.bus_type_id),
        image_base64: editingBus.image_data || undefined,
        image_name: editingBus.image_name || undefined
      })

      setMessage("Cập nhật xe thành công")
      setEditingBus(null)
      await refreshSectionData("bus-list")
    } catch (err) {
      setError(err.message)
    }
  }

  function handleEditBusImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn đúng tệp ảnh")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setEditingBus((prev) => ({
        ...prev,
        image_data: String(reader.result || ""),
        image_name: file.name,
        image_preview: String(reader.result || "")
      }))
    }
    reader.readAsDataURL(file)
  }

  async function removeRoute(id) {
    try {
      setError("")
      setMessage("")
      await adminApi.deleteRoute(id)
      setMessage("Đã ngừng hoạt động tuyến")
      setPendingDeleteRoute(null)
      setEditingRouteId((prev) => (prev === id ? null : prev))
      setRouteForm({
        departure_city_id: "",
        arrival_city_id: "",
        distance_km: "",
        estimated_time: "",
        pickup_points_text: "",
        dropoff_points_text: ""
      })
      await refreshSectionData("routes")
    } catch (err) {
      setError(err.message)
    }
  }

  function askDeleteRoute(route) {
    setPendingDeleteRoute(route)
  }

  function openEditRoute(route) {
    setEditingRouteId(route.id)
    setRouteForm({
      departure_city_id: String(route.departure_city_id || ""),
      arrival_city_id: String(route.arrival_city_id || ""),
      distance_km: String(route.distance_km || ""),
      estimated_time: String(route.estimated_time || ""),
      pickup_points_text: "",
      dropoff_points_text: ""
    })
  }

  function openEditTrip(trip) {
    setEditingTripId(trip.id)
    setTripForm({
      route_id: String(trip.route_id || ""),
      point_pair_key: "",
      bus_id: String(trip.bus_id || ""),
      departure_time: String(trip.departure_time || "").slice(0, 16),
      arrival_time: String(trip.arrival_time || "").slice(0, 16),
      price: String(trip.price || "")
    })
  }

  async function removeTrip(id) {
    try {
      setError("")
      setMessage("")
      await adminApi.deleteTrip(id)
      setMessage("Đã hủy chuyến")
      setPendingDeleteTrip(null)
      setEditingTripId((prev) => (prev === id ? null : prev))
      setTripForm({
        route_id: "",
        point_pair_key: "",
        bus_id: "",
        departure_time: "",
        arrival_time: "",
        price: ""
      })
      await refreshSectionData("trips")
    } catch (err) {
      setError(err.message)
    }
  }

  function askDeleteTrip(trip) {
    setPendingDeleteTrip(trip)
  }

  async function inspectTrip() {
    if (!bookingTripId) return
    try {
      setError("")
      const bookings = await adminApi.getTripBookings(bookingTripId)
      setTripBookings(bookings)
    } catch (err) {
      setError(err.message)
    }
  }

  async function refreshTripBookingsSilently(tripId) {
    if (!tripId) return
    try {
      const bookings = await adminApi.getTripBookings(tripId)
      setTripBookings(bookings)
    } catch {
      // Bỏ qua lỗi polling để tránh spam thông báo khi admin đang thao tác
    }
  }

  async function inspectTripSeats() {
    if (!seatTripId) return
    try {
      setError("")
      const seats = await adminApi.getTripSeats(seatTripId)
      setTripSeats(seats)
      setSeatFloor(1)
      setSelectedSeatIds([])
      setSeatBatchAction("vip_on")
    } catch (err) {
      setError(err.message)
    }
  }

  function toggleSeatSelection(seat) {
    if (seat.status === "booked") return

    setSelectedSeatIds((prev) => {
      const existed = prev.includes(seat.seat_id)
      if (existed) return prev.filter((id) => id !== seat.seat_id)
      return [...prev, seat.seat_id]
    })
  }

  async function applySeatBatchChanges() {
    if (!seatTripId || selectedSeatIds.length === 0) {
      setError("Vui lòng tích chọn ít nhất 1 ghế")
      return
    }

    const selectedSeats = tripSeats.filter((seat) => selectedSeatIds.includes(seat.seat_id))
    if (selectedSeats.length === 0) {
      setError("Không tìm thấy ghế đã chọn")
      return
    }

    setApplyingSeatBatch(true)
    try {
      setError("")
      setMessage("")

      const requests = selectedSeats.map((seat) => {
        const currentLocked = seat.status === "locked"
        const currentVip = Boolean(seat.is_vip)
        let payload = { is_vip: currentVip, locked: currentLocked }

        if (seatBatchAction === "vip_on") payload = { is_vip: true, locked: currentLocked }
        if (seatBatchAction === "vip_off") payload = { is_vip: false, locked: currentLocked }
        if (seatBatchAction === "lock_on") payload = { is_vip: currentVip, locked: true }
        if (seatBatchAction === "lock_off") payload = { is_vip: currentVip, locked: false }

        return adminApi.updateTripSeatSettings(seatTripId, seat.seat_id, payload)
      })

      await Promise.all(requests)
      const seats = await adminApi.getTripSeats(seatTripId)
      setTripSeats(seats)
      setMessage(`Đã áp dụng cho ${selectedSeats.length} ghế`)
      setSelectedSeatIds([])
    } catch (err) {
      setError(err.message)
    } finally {
      setApplyingSeatBatch(false)
    }
  }

  useEffect(() => {
    if (activeSection !== "bookings" || !bookingTripId) return undefined

    refreshTripBookingsSilently(bookingTripId)
    const timer = setInterval(() => {
      refreshTripBookingsSilently(bookingTripId)
    }, 8000)

    return () => clearInterval(timer)
  }, [activeSection, bookingTripId])

  async function updateProfile(event) {
    event.preventDefault()
    try {
      setError("")
      setMessage("")
      await adminApi.updateProfile({
        phone: profileForm.phone || undefined,
        password: profileForm.password || undefined,
        company_name: profileForm.company_name || undefined,
        address: profileForm.address || undefined
      })
      setMessage("Cập nhật thông tin admin thành công")
      setProfileForm((prev) => ({ ...prev, password: "" }))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-3 xl:sticky xl:top-0 xl:h-full xl:overflow-y-auto">
        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-card">
          <h1 className="font-display text-3xl font-bold text-slate-900">Quản lý Admin</h1>
          <p className="mt-1 text-sm text-slate-600">Tông xanh dương - trắng, tối ưu thao tác quản trị.</p>
        </div>

        {sections.map((item) => {
          const Icon = item.icon
          const active = activeSection === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveSection(item.key)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                active
                  ? "border-brand-200 bg-brand-50 shadow-card"
                  : "border-blue-100 bg-white hover:border-brand-100 hover:bg-blue-50/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`rounded-xl p-2 ${active ? "bg-brand-500 text-white" : "bg-blue-100 text-brand-700"}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-600">{item.desc}</p>
                </div>
              </div>
            </button>
          )
        })}
      </aside>

      <main className="min-h-0">
        {activeSection === "buses" && (
          <div className="grid h-full min-h-0 grid-rows-[auto] gap-4">
            <SectionCard title="Tạo xe mới">
              <form onSubmit={createBus} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,42%)]">
                <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-semibold text-slate-700">Loại xe</span>
                      <select
                        value={busForm.bus_type_id}
                        onChange={(e) => setBusForm((p) => ({ ...p, bus_type_id: e.target.value }))}
                        required
                        className="h-11 w-full rounded-xl border border-slate-200 px-3"
                      >
                        <option value="">Chọn loại xe</option>
                        {busTypes.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.layout})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm">
                      <span className="mb-1 block font-semibold text-slate-700">Tên xe</span>
                      <input
                        value={busForm.name}
                        onChange={(e) => setBusForm((p) => ({ ...p, name: e.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 px-3"
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="mb-1 block font-semibold text-slate-700">Biển số</span>
                      <input
                        value={busForm.license_plate}
                        onChange={(e) => setBusForm((p) => ({ ...p, license_plate: e.target.value }))}
                        required
                        className="h-11 w-full rounded-xl border border-slate-200 px-3"
                      />
                    </label>

                    <label className="block text-sm">
                      <span className="mb-1 block font-semibold text-slate-700">Ảnh xe</span>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBusImageChange}
                          className="h-9 w-full text-sm file:mr-3 file:h-8 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:font-medium file:text-slate-700"
                        />
                        {busForm.image_name && <p className="mt-2 text-xs text-slate-600">Đã chọn: {busForm.image_name}</p>}
                        {busForm.image_data && (
                          <img src={busForm.image_data} alt="Xem trước ảnh xe" className="mt-2 h-28 w-full rounded-lg object-cover" />
                        )}
                      </div>
                    </label>
                  </div>

                  <button type="submit" className="mt-4 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
                    Tạo xe
                  </button>
                </div>

                <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-3">
                  {selectedBusType ? (
                    <SeatLayoutPreview busType={selectedBusType} title="Sơ đồ ghế sẽ được tạo tự động theo loại xe này" />
                  ) : (
                    <div className="flex h-full min-h-[260px] items-center justify-center rounded-xl border border-dashed border-cyan-200 bg-white text-sm text-slate-500">
                      Chọn loại xe để xem sơ đồ tự động
                    </div>
                  )}
                </div>
              </form>
            </SectionCard>
          </div>
        )}

        {activeSection === "bus-list" && (
          <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
            {editingBus && (
              <SectionCard title={`Sửa xe #${editingBus.id}`}>
                <form onSubmit={submitEditBus} className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Tên xe</span>
                    <input
                      value={editingBus.name}
                      onChange={(e) => setEditingBus((prev) => ({ ...prev, name: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Biển số</span>
                    <input
                      value={editingBus.license_plate}
                      onChange={(e) => setEditingBus((prev) => ({ ...prev, license_plate: e.target.value }))}
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 px-3"
                    />
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="mb-1 block font-semibold text-slate-700">Loại xe</span>
                    <select
                      value={editingBus.bus_type_id}
                      onChange={(e) => setEditingBus((prev) => ({ ...prev, bus_type_id: e.target.value }))}
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 px-3"
                    >
                      <option value="">Chọn loại xe</option>
                      {busTypes.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.layout})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm sm:col-span-2">
                    <span className="mb-1 block font-semibold text-slate-700">Ảnh xe</span>
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditBusImageChange}
                        className="h-9 w-full text-sm file:mr-3 file:h-8 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:font-medium file:text-slate-700"
                      />
                      {editingBus.image_name && (
                        <p className="mt-2 text-xs text-slate-600">Đã chọn: {editingBus.image_name}</p>
                      )}
                      {editingBus.image_preview && (
                        <img
                          src={editingBus.image_preview}
                          alt="Xem trước ảnh xe"
                          className="mt-2 h-32 w-full max-w-xs rounded-lg object-cover"
                        />
                      )}
                    </div>
                  </label>
                  <div className="sm:col-span-2 flex gap-2">
                    <button type="submit" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
                      Lưu thay đổi
                    </button>
                    <button
                      type="button"
                      onClick={closeEditBus}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </SectionCard>
            )}

              <SectionCard title="Danh sách xe" className="min-h-0" bodyClassName="flex-1 min-h-0">
                <div className="h-full min-h-0 space-y-3 overflow-auto pr-1 pb-1">
                  {buses.map((bus) => {
                    const imageSrc = bus.image_url ? `${API_BASE_URL}${bus.image_url}` : ""
                    return (
                      <div key={bus.id} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                        <div className="h-28 w-40 shrink-0 overflow-hidden rounded-lg bg-blue-50">
                          {imageSrc ? (
                            <img src={imageSrc} alt={`Ảnh xe ${bus.name || bus.license_plate}`} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-blue-300">
                              <ImagePlus className="h-8 w-8" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900">#{bus.id} - {bus.name || "(Chưa đặt tên)"}</p>
                          <p className="text-sm text-slate-600">Biển số: {bus.license_plate}</p>
                          <p className="text-sm text-slate-600">Loại xe: {bus.bus_type_name}</p>
                          <p className="text-sm text-slate-600">Sơ đồ: {bus.layout || "--"} | Tầng: {bus.floors || "--"} | Hàng: {bus.row_count || "--"}</p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditBus(bus)}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => askDeleteBus(bus)}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </SectionCard>
          </div>
        )}

        {activeSection === "routes" && (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <SectionCard title="Tạo tuyến mới">
              <form onSubmit={createRoute} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Điểm đi</span>
                    <select
                      value={routeForm.departure_city_id}
                      onChange={(e) => setRouteForm((p) => ({ ...p, departure_city_id: e.target.value }))}
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 px-3"
                    >
                      <option value="">Chọn tỉnh/thành</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Điểm đến</span>
                    <select
                      value={routeForm.arrival_city_id}
                      onChange={(e) => setRouteForm((p) => ({ ...p, arrival_city_id: e.target.value }))}
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 px-3"
                    >
                      <option value="">Chọn tỉnh/thành</option>
                      {cities.map((city) => (
                        <option key={city.id} value={city.id}>{city.name}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Khoảng cách (km)</span>
                    <input
                      type="number"
                      value={routeForm.distance_km}
                      onChange={(e) => setRouteForm((p) => ({ ...p, distance_km: e.target.value }))}
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 px-3"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Thời gian dự kiến (giờ)</span>
                    <input
                      type="number"
                      value={routeForm.estimated_time}
                      onChange={(e) => setRouteForm((p) => ({ ...p, estimated_time: e.target.value }))}
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 px-3"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Điểm đón của tuyến</span>
                    <input
                      value={routeForm.pickup_points_text}
                      onChange={(e) => setRouteForm((p) => ({ ...p, pickup_points_text: e.target.value }))}
                      placeholder="Ví dụ: Bến xe Ninh Bình"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Điểm trả của tuyến</span>
                    <input
                      value={routeForm.dropoff_points_text}
                      onChange={(e) => setRouteForm((p) => ({ ...p, dropoff_points_text: e.target.value }))}
                      placeholder="Ví dụ: Bến xe Thanh Hóa"
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
                    />
                  </label>
                </div>
                <button type="submit" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
                  {editingRouteId ? "Lưu cập nhật tuyến" : "Tạo tuyến"}
                </button>
                {editingRouteId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRouteId(null)
                      setRouteForm({
                        departure_city_id: "",
                        arrival_city_id: "",
                        distance_km: "",
                        estimated_time: "",
                        pickup_points_text: "",
                        dropoff_points_text: ""
                      })
                    }}
                    className="ml-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Hủy sửa
                  </button>
                )}
              </form>
            </SectionCard>

            <SectionCard title="Danh sách tuyến" className="min-h-0 flex-1" bodyClassName="flex-1 min-h-0">
              <div className="h-full min-h-0 space-y-2 overflow-auto pr-1 pb-1">
                {routes.map((route) => (
                  <div key={route.id} className="rounded-xl border border-slate-200 p-3">
                    <p className="font-semibold text-slate-900">#{route.id} - {route.departure_city} → {route.arrival_city}</p>
                    <p className="text-sm text-slate-600">{route.distance_km} km | {route.estimated_time} giờ</p>
                    <p className="text-sm text-slate-600">Điểm đón: {route.route_pickup_points_text || "--"}</p>
                    <p className="text-sm text-slate-600">Điểm trả: {route.route_dropoff_points_text || "--"}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditRoute(route)}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => askDeleteRoute(route)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {activeSection === "trips" && (
          <div className="flex h-full min-h-0 flex-col gap-4">
            <SectionCard title="Tạo chuyến mới">
              <form onSubmit={createTrip} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Tuyến</span>
                    <select
                      value={tripForm.route_id}
                      onChange={(e) =>
                        setTripForm((p) => ({
                          ...p,
                          route_id: e.target.value,
                          point_pair_key: ""
                        }))
                      }
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 px-3"
                    >
                      <option value="">Chọn tuyến</option>
                      {uniqueTripRoutes.map((route) => (
                        <option key={route.id} value={route.id}>
                          #{route.id} - {route.departure_city || cityMap.get(String(route.departure_city_id))} → {route.arrival_city || cityMap.get(String(route.arrival_city_id))}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Điểm đến đi</span>
                    <select
                      value={tripForm.point_pair_key}
                      onChange={(e) => setTripForm((p) => ({ ...p, point_pair_key: e.target.value }))}
                      required
                      disabled={!tripForm.route_id}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 disabled:bg-slate-100"
                    >
                      <option value="">{tripForm.route_id ? "Chọn điểm đón → điểm trả" : "Chọn tuyến trước"}</option>
                      {tripPointPairs.map((pair) => (
                        <option key={pair.key} value={pair.key}>
                          {pair.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Xe</span>
                    <select
                      value={tripForm.bus_id}
                      onChange={(e) => setTripForm((p) => ({ ...p, bus_id: e.target.value }))}
                      required
                      disabled={!tripPointsReady}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 disabled:bg-slate-100"
                    >
                      <option value="">Chọn xe</option>
                      {buses.map((bus) => (
                        <option key={bus.id} value={bus.id}>#{bus.id} - {bus.name || "(Chưa đặt tên)"} - {bus.license_plate}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Giờ đi</span>
                    <input
                      type="datetime-local"
                      value={tripForm.departure_time}
                      min={minDateTimeLocal}
                      onChange={(e) => setTripForm((p) => ({ ...p, departure_time: e.target.value }))}
                      required
                      disabled={!tripPointsReady}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 disabled:bg-slate-100"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Giờ đến</span>
                    <input
                      type="datetime-local"
                      value={tripForm.arrival_time}
                      min={minDateTimeLocal}
                      onChange={(e) => setTripForm((p) => ({ ...p, arrival_time: e.target.value }))}
                      required
                      disabled={!tripPointsReady}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 disabled:bg-slate-100"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-semibold text-slate-700">Giá vé</span>
                    <input
                      type="number"
                      value={tripForm.price}
                      onChange={(e) => setTripForm((p) => ({ ...p, price: e.target.value }))}
                      required
                      disabled={!tripPointsReady}
                      className="h-11 w-full rounded-xl border border-slate-200 px-3 disabled:bg-slate-100"
                    />
                  </label>
                </div>

                <button type="submit" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
                  {editingTripId ? "Lưu cập nhật chuyến" : "Tạo chuyến"}
                </button>
                {editingTripId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTripId(null)
                      setTripForm({
                        route_id: "",
                        point_pair_key: "",
                        bus_id: "",
                        departure_time: "",
                        arrival_time: "",
                        price: ""
                      })
                    }}
                    className="ml-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    Hủy sửa
                  </button>
                )}
              </form>
            </SectionCard>

            <SectionCard title="Danh sách chuyến" className="min-h-0 flex-1" bodyClassName="flex-1 min-h-0">
              <div className="h-full min-h-0 space-y-2 overflow-auto pr-1 pb-1">
                {trips.map((trip) => (
                  <div key={trip.id} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                    <div className="h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-blue-50">
                      {buildImageSrc(trip.image_url || busImageMap.get(Number(trip.bus_id))) ? (
                        <img
                          src={buildImageSrc(trip.image_url || busImageMap.get(Number(trip.bus_id)))}
                          alt={`Ảnh xe ${trip.bus_name || trip.license_plate}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-blue-300">
                          <ImagePlus className="h-8 w-8" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">#{trip.id} - {trip.departure_city} → {trip.arrival_city}</p>
                      <p className="text-sm text-slate-600">Xe: {trip.bus_name} ({trip.license_plate})</p>
                      <p className="text-sm text-slate-600">Giờ đi: {formatDateTime(trip.departure_time)}</p>
                      <p className="text-sm text-slate-600">Điểm đón: {trip.pickup_points_text || "--"}</p>
                      <p className="text-sm text-slate-600">Điểm trả: {trip.dropoff_points_text || "--"}</p>
                      <p className="text-sm text-slate-600">Giá: {formatCurrency(trip.price)}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditTrip(trip)}
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => askDeleteTrip(trip)}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {activeSection === "bookings" && (
          <SectionCard title="Danh sách đặt vé" className="h-full min-h-0" bodyClassName="flex-1 min-h-0">
            <div className="grid h-full min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Chọn tuyến</span>
                  <select
                    value={bookingRouteId}
                    onChange={(e) => {
                      setBookingRouteId(e.target.value)
                      setBookingTripId("")
                      setTripBookings([])
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3"
                  >
                    <option value="">Chọn tuyến</option>
                    {routes.map((route) => (
                      (() => {
                        const plates = Array.from(routeBusPlatesMap.get(String(route.id)) || [])
                        const plateText = plates.length > 0
                          ? ` | Biển số: ${plates.slice(0, 2).join(", ")}${plates.length > 2 ? ` (+${plates.length - 2})` : ""}`
                          : ""
                        return (
                          <option key={route.id} value={route.id}>
                            #{route.id} - {route.departure_city} → {route.arrival_city}{plateText}
                          </option>
                        )
                      })()
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Chọn chuyến</span>
                  <select
                    value={bookingTripId}
                  onChange={(e) => setBookingTripId(e.target.value)}
                    disabled={!bookingRouteId}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 disabled:bg-slate-100"
                  >
                    <option value="">{bookingRouteId ? "Chọn chuyến" : "Chọn tuyến trước"}</option>
                    {bookingTrips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        #{trip.id} - {formatDateTime(trip.departure_time)} - {trip.license_plate || "Chưa có biển số"}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="self-end sm:col-span-2">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={inspectTrip}
                      disabled={!bookingTripId}
                      className="w-full rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      Xem
                    </button>
                    <button
                      type="button"
                      onClick={() => refreshTripBookingsSilently(bookingTripId)}
                      disabled={!bookingTripId}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      Làm mới
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-cyan-50 px-3 py-2 text-sm text-slate-700">
                Tổng cộng {tripBookings.length} đơn | Đang đặt: {activeTripBookings.length} | Đã hủy: {cancelledTripBookings.length}
              </div>

              <div className="min-h-0 space-y-3 overflow-auto">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBookingView("active")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      bookingView === "active"
                        ? "bg-emerald-500 text-white"
                        : "border border-emerald-200 bg-white text-emerald-700"
                    }`}
                  >
                    Đang đặt ({activeTripBookings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingView("cancelled")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      bookingView === "cancelled"
                        ? "bg-red-500 text-white"
                        : "border border-red-200 bg-white text-red-700"
                    }`}
                  >
                    Đã hủy ({cancelledTripBookings.length})
                  </button>
                </div>

                {bookingView === "active" ? (
                  <div className="overflow-auto rounded-xl border border-emerald-200">
                    <div className="bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">Danh sách đang đặt</div>
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-left text-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Khách hàng</th>
                          <th className="px-4 py-3 font-semibold">Số điện thoại</th>
                          <th className="px-4 py-3 font-semibold">Ngày</th>
                          <th className="px-4 py-3 font-semibold">Ghế</th>
                          <th className="px-4 py-3 font-semibold">Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTripBookings.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                              Chưa có đơn đang đặt
                            </td>
                          </tr>
                        )}
                        {activeTripBookings.map((booking) => (
                          <tr key={`active-${booking.booking_id}`} className="border-t border-slate-200">
                            <td className="px-4 py-3 font-semibold text-slate-900">{booking.customer_name || "--"}</td>
                            <td className="px-4 py-3 text-slate-700">{booking.customer_phone || "--"}</td>
                            <td className="px-4 py-3 text-slate-700">{formatDateTime(booking.departure_time)}</td>
                            <td className="px-4 py-3 text-slate-700">{booking.seat_numbers || `${booking.seat_count || 0} ghế`}</td>
                            <td className="px-4 py-3 text-slate-700">{formatCurrency(booking.total_price || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-auto rounded-xl border border-red-200">
                    <div className="bg-red-50 px-4 py-2 text-sm font-bold text-red-700">Danh sách đã hủy</div>
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-left text-slate-700">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Khách hàng</th>
                          <th className="px-4 py-3 font-semibold">Số điện thoại</th>
                          <th className="px-4 py-3 font-semibold">Ngày</th>
                          <th className="px-4 py-3 font-semibold">Ghế</th>
                          <th className="px-4 py-3 font-semibold">Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cancelledTripBookings.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                              Chưa có đơn đã hủy
                            </td>
                          </tr>
                        )}
                        {cancelledTripBookings.map((booking) => (
                          <tr key={`cancelled-${booking.booking_id}`} className="border-t border-slate-200">
                            <td className="px-4 py-3 font-semibold text-slate-900">{booking.customer_name || "--"}</td>
                            <td className="px-4 py-3 text-slate-700">{booking.customer_phone || "--"}</td>
                            <td className="px-4 py-3 text-slate-700">{formatDateTime(booking.departure_time)}</td>
                            <td className="px-4 py-3 text-slate-700">{booking.seat_numbers || `${booking.seat_count || 0} ghế`}</td>
                            <td className="px-4 py-3 text-slate-700">{formatCurrency(booking.total_price || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </SectionCard>
        )}

        {activeSection === "trip-seats" && (
          <SectionCard title="Quản lý ghế theo chuyến" className="h-full min-h-0" bodyClassName="flex-1 min-h-0">
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Chọn tuyến</span>
                  <select
                    value={seatRouteId}
                    onChange={(e) => {
                      setSeatRouteId(e.target.value)
                      setSeatTripId("")
                      setTripSeats([])
                      setSelectedSeatIds([])
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3"
                  >
                    <option value="">Chọn tuyến</option>
                    {routes.map((route) => (
                      <option key={route.id} value={route.id}>
                        #{route.id} - {route.departure_city} → {route.arrival_city}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Chọn chuyến</span>
                  <select
                    value={seatTripId}
                    onChange={(e) => {
                      setSeatTripId(e.target.value)
                      setTripSeats([])
                      setSelectedSeatIds([])
                    }}
                    disabled={!seatRouteId}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3 disabled:bg-slate-100"
                  >
                    <option value="">{seatRouteId ? "Chọn chuyến" : "Chọn tuyến trước"}</option>
                    {seatTrips.map((trip) => (
                      <option key={trip.id} value={trip.id}>
                        #{trip.id} - {formatDateTime(trip.departure_time)} - {trip.license_plate || "Chưa có biển số"}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="self-end sm:col-span-2">
                  <button
                    type="button"
                    onClick={inspectTripSeats}
                    disabled={!seatTripId}
                    className="w-full rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    Xem sơ đồ ghế
                  </button>
                </div>
              </div>

              <div className="min-h-0 rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-800">Sơ đồ ghế mặc định theo chuyến</h4>
                  <div className="flex items-center gap-2">
                    {[...new Set(tripSeats.map((s) => Number(s.floor)).filter(Boolean))].sort((a, b) => a - b).map((floor) => (
                      <button
                        key={`admin-seat-floor-${floor}`}
                        type="button"
                        onClick={() => setSeatFloor(floor)}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          Number(seatFloor) === Number(floor) ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        Tầng {floor}
                      </button>
                    ))}
                  </div>
                </div>

                {tripSeats.length === 0 ? (
                  <p className="text-sm text-slate-500">Chọn tuyến/chuyến rồi bấm Xem sơ đồ ghế.</p>
                ) : (
                  <div className="max-h-72 space-y-3 overflow-auto pr-1">
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <select
                        value={seatBatchAction}
                        onChange={(e) => setSeatBatchAction(e.target.value)}
                        className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm"
                      >
                        <option value="vip_on">Đặt VIP</option>
                        <option value="vip_off">Bỏ VIP</option>
                        <option value="lock_on">Khóa ghế</option>
                        <option value="lock_off">Mở khóa ghế</option>
                      </select>
                      <button
                        type="button"
                        onClick={applySeatBatchChanges}
                        disabled={applyingSeatBatch || selectedSeatIds.length === 0}
                        className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {applyingSeatBatch ? "Đang áp dụng..." : "Xác nhận áp dụng"}
                      </button>
                      <span className="text-xs text-slate-500">
                        Đã chọn: <b>{selectedSeatIds.length}</b> ghế
                      </span>
                    </div>

                    {Array.from(
                      tripSeats
                        .filter((seat) => Number(seat.floor) === Number(seatFloor))
                        .reduce((map, seat) => {
                          const rowKey = Number(seat.row_index)
                          if (!map.has(rowKey)) map.set(rowKey, [])
                          map.get(rowKey).push(seat)
                          return map
                        }, new Map())
                        .entries()
                    )
                      .sort((a, b) => a[0] - b[0])
                      .map(([row, seatsInRow]) => (
                        <div key={`admin-seat-row-${row}`} className="flex items-center gap-2">
                          <span className="w-6 text-right text-xs font-semibold text-slate-400">{row}</span>
                          <div
                            className="grid gap-2"
                            style={{
                              gridTemplateColumns: `repeat(${Math.max(
                                1,
                                ...seatsInRow.map((s) => Number(s.col_index) || 1)
                              )}, minmax(42px, 48px))`
                            }}
                          >
                            {seatsInRow
                              .sort((a, b) => Number(a.col_index) - Number(b.col_index))
                              .flatMap((seat, index, arr) => {
                                const prevCol = index === 0 ? 0 : Number(arr[index - 1].col_index || 0)
                                const curCol = Number(seat.col_index || 1)
                                const filler = []
                                for (let c = prevCol + 1; c < curCol; c++) {
                                  filler.push(
                                    <div
                                      key={`admin-trip-seat-empty-${row}-${c}`}
                                      className="h-12 w-11 rounded-lg bg-transparent"
                                    />
                                  )
                                }

                                const isBooked = seat.status === "booked"
                                const isLocked = seat.status === "locked"
                                const isVip = Boolean(seat.is_vip)
                                const isPicked = selectedSeatIds.includes(seat.seat_id)
                                const baseSeatClass = isBooked
                                  ? "border-emerald-500 bg-emerald-500 text-white"
                                  : isVip
                                    ? "border-orange-500 bg-orange-100 text-orange-700"
                                    : isLocked
                                      ? "border-slate-300 bg-slate-200 text-slate-700"
                                      : "border-slate-300 bg-white text-slate-700"

                                const pickedClass = isPicked ? "ring-2 ring-brand-400 ring-offset-1" : ""
                                const seatClass = `${baseSeatClass} ${pickedClass}`.trim()

                                const seatNode = (
                                  <button
                                    key={`admin-trip-seat-${seat.trip_seat_id}`}
                                    type="button"
                                    onClick={() => toggleSeatSelection(seat)}
                                    disabled={isBooked}
                                    className={`h-12 w-11 rounded-lg border text-[11px] font-semibold transition ${seatClass} disabled:cursor-not-allowed`}
                                    title={`${seat.seat_number} - ${isBooked ? "Đã đặt" : isLocked ? "Đã khóa" : "Trống"}${isVip ? " - Ghế VIP" : ""}`}
                                  >
                                    {seat.seat_number}
                                  </button>
                                )

                                return [...filler, seatNode]
                              })}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-slate-500">
                  Ghế VIP sẽ tự động tính giá tăng 50% khi khách đặt.
                </p>
              </div>
            </div>
          </SectionCard>
        )}

        {activeSection === "profile" && (
          <SectionCard title="Đổi thông tin tài khoản admin">
            <form onSubmit={updateProfile} className="grid gap-3 md:grid-cols-2">
              <label className="block text-sm md:col-span-1">
                <span className="mb-1 block font-semibold text-slate-700">Số điện thoại mới</span>
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="Nhập số điện thoại"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3"
                />
              </label>

              <label className="block text-sm md:col-span-1">
                <span className="mb-1 block font-semibold text-slate-700">Mật khẩu mới</span>
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => setProfileForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Để trống nếu không đổi"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3"
                />
              </label>

              <label className="block text-sm md:col-span-1">
                <span className="mb-1 block font-semibold text-slate-700">Tên nhà xe (tùy chọn)</span>
                <input
                  value={profileForm.company_name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, company_name: e.target.value }))}
                  placeholder="Giữ nguyên nếu để trống"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3"
                />
              </label>

              <label className="block text-sm md:col-span-1">
                <span className="mb-1 block font-semibold text-slate-700">Địa chỉ nhà xe (tùy chọn)</span>
                <input
                  value={profileForm.address}
                  onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Giữ nguyên nếu để trống"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3"
                />
              </label>

              <div className="md:col-span-2">
                <button type="submit" className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
                  Cập nhật thông tin
                </button>
              </div>
            </form>
          </SectionCard>
        )}
      </main>

      {(message || error) && (
        <div className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
          {message && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 shadow-lg">
              <p className="flex-1">{message}</p>
              <button
                type="button"
                onClick={() => setMessage("")}
                className="rounded-md px-2 py-0.5 text-green-700 hover:bg-green-100"
                aria-label="Đóng thông báo thành công"
              >
                ×
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 shadow-lg">
              <p className="flex-1">{error}</p>
              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-md px-2 py-0.5 text-red-600 hover:bg-red-100"
                aria-label="Đóng thông báo lỗi"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {pendingDeleteBus && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa xe</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn có chắc muốn ngừng hoạt động xe <b>{pendingDeleteBus.name || "(Chưa đặt tên)"}</b> -{" "}
              <b>{pendingDeleteBus.license_plate}</b> không?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteBus(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => removeBus(pendingDeleteBus.id)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteRoute && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa tuyến</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn có chắc muốn ngừng hoạt động tuyến <b>#{pendingDeleteRoute.id}</b> (
              <b>{pendingDeleteRoute.departure_city}</b> → <b>{pendingDeleteRoute.arrival_city}</b>) không?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteRoute(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => removeRoute(pendingDeleteRoute.id)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteTrip && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa chuyến</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bạn có chắc muốn hủy chuyến <b>#{pendingDeleteTrip.id}</b> (
              <b>{pendingDeleteTrip.departure_city}</b> → <b>{pendingDeleteTrip.arrival_city}</b>) không?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteTrip(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => removeTrip(pendingDeleteTrip.id)}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

