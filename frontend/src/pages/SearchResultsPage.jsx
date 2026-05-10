import { useEffect, useMemo, useState } from "react"
import { 
  CalendarDays, 
  ChevronDown, 
  MapPin, 
  Search, 
  Star,
  FilterX
} from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { API_BASE_URL, api } from "../lib/api"
import { calcDuration, formatCurrency, formatDateTime, formatTime } from "../lib/formatters"

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const today = new Date().toISOString().slice(0, 10)

function joinValues(values) {
  return values.length ? values.join(",") : undefined
}

function parseDateOnly(value) {
  if (!value) return "--"
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value))
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function formatVndPlain(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`
}

export function SearchResultsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [cities, setCities] = useState([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [trips, setTrips] = useState([])
  const [filters, setFilters] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [companyKeyword, setCompanyKeyword] = useState("")
  const [busTypeKeyword, setBusTypeKeyword] = useState("")
  const [selected, setSelected] = useState({
    bus_company_ids: [],
    bus_type_ids: [],
    seat_types: [],
    pickup_point_ids: [],
    dropoff_point_ids: [],
    min_price: "",
    max_price: "",
    departure_hour_from: "",
    departure_hour_to: "",
    min_rating: ""
  })

  const [searchForm, setSearchForm] = useState({
    from_city: "",
    to_city: "",
    date: tomorrow
  })

  const baseQuery = useMemo(
    () => ({
      from_city: searchParams.get("from_city") || "",
      to_city: searchParams.get("to_city") || "",
      date: searchParams.get("date") || ""
    }),
    [searchParams]
  )

  const filteredCompanies = useMemo(() => {
    const rows = filters?.bus_companies || []
    const keyword = normalizeText(companyKeyword)
    if (!keyword) return rows
    return rows.filter((row) => normalizeText(row.name).includes(keyword))
  }, [filters, companyKeyword])

  const filteredBusTypes = useMemo(() => {
    const rows = filters?.bus_types || []
    const keyword = normalizeText(busTypeKeyword)
    if (!keyword) return rows
    return rows.filter((row) => normalizeText(row.name).includes(keyword))
  }, [filters, busTypeKeyword])

  const priceMinBound = Number(filters?.price_range?.min ?? 0)
  const priceMaxBound = Number(filters?.price_range?.max ?? 2000000)
  const currentMinPrice = selected.min_price === "" ? priceMinBound : Number(selected.min_price)
  const currentMaxPrice = selected.max_price === "" ? priceMaxBound : Number(selected.max_price)
  const currentHourFrom = selected.departure_hour_from === "" ? 0 : Number(selected.departure_hour_from)
  const currentHourTo = selected.departure_hour_to === "" ? 24 : Number(selected.departure_hour_to)

  useEffect(() => {
    setSearchForm({
      from_city: baseQuery.from_city,
      to_city: baseQuery.to_city,
      date: baseQuery.date || tomorrow
    })
  }, [baseQuery])

  useEffect(() => {
    let cancelled = false

    async function loadCities() {
      try {
        setCitiesLoading(true)
        const rows = await api.getCities()
        if (!cancelled) setCities(rows)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setCitiesLoading(false)
      }
    }

    loadCities()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadFilters() {
      if (!baseQuery.from_city || !baseQuery.to_city || !baseQuery.date) return
      const data = await api.getSearchFilters(baseQuery)
      const minPrice = Number(data.price_range?.min ?? 0)
      const maxPrice = Number(data.price_range?.max ?? 0)
      if (!cancelled) {
        setFilters(data)
        setSelected({
          bus_company_ids: [],
          bus_type_ids: [],
          seat_types: [],
          pickup_point_ids: [],
          dropoff_point_ids: [],
          departure_hour_from: "",
          departure_hour_to: "",
          min_rating: "",
          min_price: maxPrice > 0 ? String(minPrice) : "",
          max_price: maxPrice > 0 ? String(maxPrice) : ""
        })
      }
    }

    loadFilters().catch((err) => {
      if (!cancelled) setError(err.message)
    })

    return () => {
      cancelled = true
    }
  }, [baseQuery])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")

    async function loadTrips() {
      const payload = {
        ...baseQuery,
        bus_company_ids: joinValues(selected.bus_company_ids),
        bus_type_ids: joinValues(selected.bus_type_ids),
        seat_types: joinValues(selected.seat_types),
        pickup_point_names: joinValues(selected.pickup_point_ids),
        dropoff_point_names: joinValues(selected.dropoff_point_ids),
        min_price: selected.min_price || undefined,
        max_price: selected.max_price || undefined,
        departure_hour_from: selected.departure_hour_from || undefined,
        departure_hour_to: selected.departure_hour_to || undefined,
        min_rating: selected.min_rating || undefined
      }

      const data = await api.searchTrips(payload)
      if (!cancelled) {
        setTrips(data)
        setLoading(false)
      }
    }

    if (!baseQuery.from_city || !baseQuery.to_city || !baseQuery.date) {
      setLoading(false)
      setError("Thiếu tham số tìm kiếm")
      return undefined
    }

    loadTrips().catch((err) => {
      if (!cancelled) {
        setLoading(false)
        setError(err.message)
      }
    })

    return () => {
      cancelled = true
    }
  }, [baseQuery, selected])

  function toggleArrayFilter(name, value) {
    setSelected((prev) => {
      const current = prev[name]
      const exists = current.includes(value)
      return {
        ...prev,
        [name]: exists ? current.filter((item) => item !== value) : [...current, value]
      }
    })
  }

  function updateSearchField(event) {
    const { name, value } = event.target
    setSearchForm((prev) => ({ ...prev, [name]: value }))
  }

  function submitSearch(event) {
    event.preventDefault()
    const params = new URLSearchParams(searchForm)
    navigate(`/search?${params.toString()}`)
  }

  function clearFilters() {
    setSelected({
      bus_company_ids: [],
      bus_type_ids: [],
      seat_types: [],
      pickup_point_ids: [],
      dropoff_point_ids: [],
      min_price: String(filters?.price_range?.min ?? ""),
      max_price: String(filters?.price_range?.max ?? ""),
      departure_hour_from: "",
      departure_hour_to: "",
      min_rating: ""
    })
    setCompanyKeyword("")
    setBusTypeKeyword("")
  }

  function setPriceFrom(value) {
    const v = Number(value)
    setSelected((prev) => {
      const to = prev.max_price === "" ? priceMaxBound : Number(prev.max_price)
      return { ...prev, min_price: String(Math.min(v, to)) }
    })
  }

  function setPriceTo(value) {
    const v = Number(value)
    setSelected((prev) => {
      const from = prev.min_price === "" ? priceMinBound : Number(prev.min_price)
      return { ...prev, max_price: String(Math.max(v, from)) }
    })
  }

  function setHourFrom(value) {
    const v = Number(value)
    setSelected((prev) => {
      const to = prev.departure_hour_to === "" ? 24 : Number(prev.departure_hour_to)
      return { ...prev, departure_hour_from: String(Math.min(v, to)) }
    })
  }

  function setHourTo(value) {
    const v = Number(value)
    setSelected((prev) => {
      const from = prev.departure_hour_from === "" ? 0 : Number(prev.departure_hour_from)
      return { ...prev, departure_hour_to: String(Math.max(v, from)) }
    })
  }

  // --- Utility CSS classes for consistent UI ---
  const scrollbarClasses = "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 hover:[&::-webkit-scrollbar-thumb]:bg-slate-300"
  const summaryClasses = "group flex cursor-pointer list-none items-center justify-between py-3 text-base font-bold text-slate-800 transition-colors hover:text-brand-600 [&::-webkit-details-marker]:hidden"
  const inputClasses = "h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500"
  
  return (
    <div className="grid h-full min-h-0 grid-cols-[300px_minmax(0,1fr)] gap-6 overflow-hidden bg-slate-50/50 p-4">
      
      {/* --- CỘT BỘ LỌC BÊN TRÁI --- */}
      <aside className={`h-full min-h-0 overflow-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${scrollbarClasses}`}>
        <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur-sm">
          <h2 className="text-xl font-extrabold text-slate-900">Bộ lọc</h2>
          <button 
            type="button" 
            onClick={clearFilters} 
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-50"
          >
            <FilterX className="h-4 w-4" /> Xóa lọc
          </button>
        </div>

        <div className="mt-2 divide-y divide-slate-100">
          
          {/* Lọc Giờ Đi */}
          <details open className="group py-2">
            <summary className={summaryClasses}>
              Giờ khởi hành 
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pb-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">Từ</span>
                  <input
                    type="number" min={0} max={24}
                    value={currentHourFrom}
                    onChange={(e) => setHourFrom(e.target.value)}
                    className={`${inputClasses} pl-8 text-center font-semibold`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">h</span>
                </div>
                <div className="h-[2px] w-4 bg-slate-300 rounded-full"></div>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">Đến</span>
                  <input
                    type="number" min={0} max={24}
                    value={currentHourTo}
                    onChange={(e) => setHourTo(e.target.value)}
                    className={`${inputClasses} pl-8 text-center font-semibold`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">h</span>
                </div>
              </div>
            </div>
          </details>

          {/* Lọc Giá Vé */}
          <details open className="group py-2">
            <summary className={summaryClasses}>
              Mức giá
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pb-3 pt-1">
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Min</span>
                  <input
                    type="number"
                    value={currentMinPrice}
                    onChange={(e) => setPriceFrom(e.target.value)}
                    className={`${inputClasses} pl-10 text-right`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-900 font-medium">đ</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">Max</span>
                  <input
                    type="number"
                    value={currentMaxPrice}
                    onChange={(e) => setPriceTo(e.target.value)}
                    className={`${inputClasses} pl-10 text-right`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-900 font-medium">đ</span>
                </div>
              </div>
            </div>
          </details>

          {/* Lọc Nhà Xe */}
          <details open className="group py-2">
            <summary className={summaryClasses}>
              Nhà xe
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pb-2">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={companyKeyword}
                  onChange={(e) => setCompanyKeyword(e.target.value)}
                  placeholder="Tìm theo tên nhà xe..."
                  className={`${inputClasses} pl-9`}
                />
              </div>
              <div className={`max-h-56 space-y-1 overflow-auto pr-2 ${scrollbarClasses}`}>
                {filteredCompanies.length === 0 ? (
                  <p className="py-2 text-center text-sm text-slate-500">Không tìm thấy nhà xe</p>
                ) : (
                  filteredCompanies.map((company) => {
                    const value = String(company.id)
                    return (
                      <label key={company.id} className="group/item flex cursor-pointer items-start justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50">
                        <span className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selected.bus_company_ids.includes(value)}
                            onChange={() => toggleArrayFilter("bus_company_ids", value)}
                            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-slate-300 text-brand-600 transition-colors focus:ring-brand-600 focus:ring-offset-0"
                          />
                          <span className="text-sm text-slate-700 group-hover/item:text-slate-900">{company.name}</span>
                        </span>
                        <div className="flex flex-col items-end gap-1">
                           {company.rating > 0 && (
                            <span className="flex items-center text-[11px] font-semibold text-slate-600">
                              {Number(company.rating).toFixed(1)} <Star className="ml-0.5 h-3 w-3 fill-yellow-400 text-yellow-400" />
                            </span>
                          )}
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                            {company.trip_count || 0} chuyến
                          </span>
                        </div>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          </details>

          {/* Lọc Điểm Đón */}
          <details className="group py-2">
            <summary className={summaryClasses}>
              Điểm đón
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className={`max-h-48 space-y-1 overflow-auto pb-2 pr-2 ${scrollbarClasses}`}>
              {(filters?.pickup_points || []).map((point) => {
                const value = String(point.name)
                return (
                  <label key={`pickup-${point.name}`} className="group/item flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selected.pickup_point_ids.includes(value)}
                        onChange={() => toggleArrayFilter("pickup_point_ids", value)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                      />
                      <span className="text-sm text-slate-700 group-hover/item:text-slate-900">{point.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">({point.trip_count || 0})</span>
                  </label>
                )
              })}
            </div>
          </details>

          {/* Lọc Điểm Trả */}
          <details className="group py-2">
            <summary className={summaryClasses}>
              Điểm trả
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className={`max-h-48 space-y-1 overflow-auto pb-2 pr-2 ${scrollbarClasses}`}>
              {(filters?.dropoff_points || []).map((point) => {
                const value = String(point.name)
                return (
                  <label key={`dropoff-${point.name}`} className="group/item flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selected.dropoff_point_ids.includes(value)}
                        onChange={() => toggleArrayFilter("dropoff_point_ids", value)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                      />
                      <span className="text-sm text-slate-700 group-hover/item:text-slate-900">{point.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">({point.trip_count || 0})</span>
                  </label>
                )
              })}
            </div>
          </details>

          {/* Lọc Loại Xe */}
          <details open className="group py-2">
            <summary className={summaryClasses}>
              Loại xe
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pb-2">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={busTypeKeyword}
                  onChange={(e) => setBusTypeKeyword(e.target.value)}
                  placeholder="Tìm loại xe..."
                  className={`${inputClasses} pl-9`}
                />
              </div>
              <div className={`max-h-48 space-y-1 overflow-auto pr-2 ${scrollbarClasses}`}>
                {filteredBusTypes.map((type) => {
                  const value = String(type.id)
                  return (
                    <label key={type.id} className="group/item flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selected.bus_type_ids.includes(value)}
                        onChange={() => toggleArrayFilter("bus_type_ids", value)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                      />
                      <span className="text-sm text-slate-700 group-hover/item:text-slate-900">{type.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </details>

          {/* Lọc Hàng Ghế */}
          <details className="group py-2">
            <summary className={summaryClasses}>
              Vị trí / Loại ghế
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="space-y-1 pb-2">
              {(filters?.seat_types || []).map((seatType) => (
                <label key={seatType} className="group/item flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selected.seat_types.includes(seatType)}
                    onChange={() => toggleArrayFilter("seat_types", seatType)}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600"
                  />
                  <span className="text-sm text-slate-700 group-hover/item:text-slate-900">{seatType}</span>
                </label>
              ))}
            </div>
          </details>

          {/* Lọc Đánh Giá */}
          <details className="group py-2">
            <summary className={summaryClasses}>
              Đánh giá tối thiểu
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="pb-3 pt-1">
               <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelected((prev) => ({ ...prev, min_rating: String(star) }))}
                    className={`flex flex-col items-center justify-center rounded-xl border py-2 transition-all ${
                      selected.min_rating === String(star)
                        ? "border-brand-600 bg-brand-50 text-brand-600 ring-1 ring-brand-600"
                        : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <Star className={`h-5 w-5 ${selected.min_rating === String(star) || Number(selected.min_rating) >= star ? "fill-yellow-400 text-yellow-400" : "fill-transparent"}`} />
                    <span className="mt-1 text-xs font-semibold">{star}+</span>
                  </button>
                ))}
              </div>
            </div>
          </details>

        </div>
      </aside>

      {/* --- CỘT KẾT QUẢ TÌM KIẾM BÊN PHẢI --- */}
      <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-6">
         {/* Form Search Trên Cùng */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <form onSubmit={submitSearch} className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="space-y-1.5 text-left">
              <span className="text-sm font-bold text-slate-700">Điểm đi</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <select
                  name="from_city"
                  value={searchForm.from_city}
                  onChange={updateSearchField}
                  required
                  disabled={citiesLoading}
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 font-medium outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500"
                >
                  <option value="" disabled>{citiesLoading ? "Đang tải..." : "Chọn điểm đi"}</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="space-y-1.5 text-left">
              <span className="text-sm font-bold text-slate-700">Điểm đến</span>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <select
                  name="to_city"
                  value={searchForm.to_city}
                  onChange={updateSearchField}
                  required
                  disabled={citiesLoading}
                  className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 font-medium outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500"
                >
                  <option value="" disabled>{citiesLoading ? "Đang tải..." : "Chọn điểm đến"}</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
              </div>
            </label>

            <label className="space-y-1.5 text-left">
              <span className="text-sm font-bold text-slate-700">Ngày khởi hành</span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  name="date"
                  value={searchForm.date}
                  min={today}
                  onChange={updateSearchField}
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 font-medium outline-none transition-colors focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </label>

            <div className="flex items-end">
              <button type="submit" className="h-12 w-full rounded-xl bg-brand-600 px-8 font-bold text-white shadow-md shadow-brand-500/20 transition-all hover:bg-brand-700 hover:shadow-lg active:scale-[0.98]">
                Tìm chuyến
              </button>
            </div>
          </form>
        </section>

        {/* Danh Sách Chuyến Đi */}
        <div className={`min-h-0 overflow-auto pb-4 pr-2 ${scrollbarClasses}`}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
               <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600 mb-4"></div>
               <p className="text-sm font-medium">Đang tìm các chuyến xe tốt nhất...</p>
            </div>
          )}
          {error && !loading && (
             <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm font-medium text-red-600">
                {error}
             </div>
          )}
          {!loading && !error && trips.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
              <span className="text-4xl mb-4">🚌</span>
              <h3 className="text-lg font-bold text-slate-800">Không tìm thấy chuyến xe</h3>
              <p className="mt-1 text-sm text-slate-500">Thử thay đổi bộ lọc hoặc ngày đi để xem thêm kết quả.</p>
              <button onClick={clearFilters} className="mt-4 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}

          <div className="space-y-4">
            {trips.map((trip) => {
              const imageSrc = trip.bus_image_url ? `${API_BASE_URL}${trip.bus_image_url}` : ""
              return (
                <article key={trip.id} className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_200px]">
                    <div className="h-36 overflow-hidden rounded-xl bg-slate-100">
                      {imageSrc ? (
                        <img src={imageSrc} alt={`Xe ${trip.bus_name || trip.license_plate}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center text-slate-400">
                           <span className="text-2xl mb-1">🚐</span>
                           <span className="text-xs font-medium">Chưa có ảnh</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-slate-900">{trip.bus_company_name}</h2>
                        <span className="flex items-center rounded bg-brand-50 px-1.5 py-0.5 text-[11px] font-bold text-brand-700">
                          <Star className="mr-1 h-3 w-3 fill-brand-600" /> {Number(trip.rating || 0).toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-600">{trip.bus_type_name}</p>
                      
                      <div className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                        <div className="flex flex-col items-center justify-between py-1">
                           <div className="h-2 w-2 rounded-full bg-brand-600 ring-4 ring-brand-100"></div>
                           <div className="h-full w-[2px] border-l-2 border-dashed border-slate-300 my-1"></div>
                           <div className="h-2 w-2 rounded-full border-2 border-brand-600 bg-white"></div>
                        </div>
                        <div className="flex flex-col justify-between py-0.5">
                           <div>
                             <span className="text-lg font-bold text-slate-900">{formatTime(trip.departure_time)}</span>
                             <span className="ml-2 text-sm text-slate-600">• {trip.from_city}</span>
                           </div>
                           <div className="text-xs font-medium text-slate-400">{calcDuration(trip.departure_time, trip.arrival_time)}</div>
                           <div>
                             <span className="text-lg font-bold text-slate-900">{formatTime(trip.arrival_time)}</span>
                             <span className="ml-2 text-sm text-slate-600">• {trip.to_city}</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between border-t border-slate-100 pt-4 md:border-l md:border-t-0 md:pl-4 md:pt-0">
                      <div className="text-right">
                        <p className="text-2xl font-extrabold text-brand-600">{formatCurrency(trip.price)}</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                           Còn {trip.available_seats} chỗ
                        </p>
                      </div>
                      
                      <Link
                        to={`/trip/${trip.id}`}
                        className="mt-4 block w-full rounded-xl bg-yellow-400 px-4 py-3 text-center text-sm font-bold text-slate-900 transition-colors hover:bg-yellow-500 active:scale-[0.98]"
                      >
                        Chọn chuyến
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
