import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowRightLeft,
  Bus,
  CalendarDays,
  ChevronDown,
  Clock3,
  Headphones,
  MapPin,
  Search,
  ShieldCheck
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import { api } from "../lib/api"

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10)
const today = new Date().toISOString().slice(0, 10)

export function HomePage() {
  const navigate = useNavigate()

  const [cities, setCities] = useState([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [citiesError, setCitiesError] = useState("")
  const [openCityMenu, setOpenCityMenu] = useState(null)

  const [cityKeyword, setCityKeyword] = useState({
    from: "",
    to: ""
  })

  const cityMenuRef = useRef(null)

  const [form, setForm] = useState({
    from_city: "",
    to_city: "",
    date: tomorrow
  })

  useEffect(() => {
    let cancelled = false

    async function loadCities() {
      try {
        setCitiesLoading(true)
        setCitiesError("")

        const data = await api.getCities()

        if (!cancelled) {
          setCities(data)
        }
      } catch (error) {
        if (!cancelled) {
          setCitiesError(error.message)
        }
      } finally {
        if (!cancelled) {
          setCitiesLoading(false)
        }
      }
    }

    loadCities()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        cityMenuRef.current &&
        !cityMenuRef.current.contains(event.target)
      ) {
        setOpenCityMenu(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)

    return () =>
      document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const canSubmit = useMemo(() => {
    if (!form.from_city || !form.to_city || !form.date) return false
    if (form.from_city === form.to_city) return false

    return true
  }, [form])

  function updateField(event) {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  function onSubmit(event) {
    event.preventDefault()

    const params = new URLSearchParams(form)

    navigate(`/search?${params.toString()}`)
  }

  function selectedCityName(cityId, fallback) {
    return (
      cities.find((c) => String(c.id) === String(cityId))?.name || fallback
    )
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  }

  function swapCities() {
    setForm((prev) => ({
      ...prev,
      from_city: prev.to_city,
      to_city: prev.from_city
    }))
  }

  const filteredFromCities = cities.filter((city) =>
    normalizeText(city.name).includes(normalizeText(cityKeyword.from))
  )

  const filteredToCities = cities.filter((city) =>
    normalizeText(city.name).includes(normalizeText(cityKeyword.to))
  )

  const popularRoutes = [
    {
      from: "TP. Hồ Chí Minh",
      to: "Đà Lạt"
    },
    {
      from: "TP. Hồ Chí Minh",
      to: "Nha Trang"
    },
    {
      from: "Đà Nẵng",
      to: "Huế"
    },
    {
      from: "Hà Nội",
      to: "Sapa"
    }
  ]

  return (
    <div className="min-h-screen bg-[#F5F9FF]">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-b-[40px] bg-gradient-to-r from-[#0A4D9C] via-[#1565C0] to-[#1E88E5]">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-cyan-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            {/* LEFT */}
            <div className="text-center lg:text-left">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur sm:text-sm">
                <Bus className="h-4 w-4" />
                Hơn 1000+ tuyến xe toàn quốc
              </div>

              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-6xl">
                Đặt vé xe khách
                <span className="block text-blue-100">
                  nhanh chóng & tiện lợi
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-blue-100 sm:text-base lg:mx-0 lg:text-lg">
                Tìm kiếm chuyến xe chất lượng cao, giá tốt và đặt vé online chỉ
                trong vài giây.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <div className="flex items-center justify-center gap-3 rounded-2xl bg-white/10 px-5 py-4 text-white backdrop-blur lg:justify-start">
                  <ShieldCheck className="h-5 w-5 text-cyan-200" />

                  <span className="font-medium">
                    Thanh toán an toàn
                  </span>
                </div>

                <div className="flex items-center justify-center gap-3 rounded-2xl bg-white/10 px-5 py-4 text-white backdrop-blur lg:justify-start">
                  <Headphones className="h-5 w-5 text-cyan-200" />

                  <span className="font-medium">
                    Hỗ trợ 24/7
                  </span>
                </div>
              </div>
            </div>

            {/* SEARCH BOX */}
            <div ref={cityMenuRef}>
              <div className="rounded-[28px] border border-white/30 bg-white p-4 shadow-[0_20px_70px_rgba(0,0,0,0.18)] sm:p-6 lg:rounded-[32px]">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-slate-800">
                    Tìm chuyến xe
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Chọn thông tin hành trình của bạn
                  </p>
                </div>

                <form
                  onSubmit={onSubmit}
                  className="space-y-5"
                >
                  {/* FROM + TO */}
                  <div className="relative grid gap-4 md:grid-cols-2">
                    {/* FROM */}
                    <div className="relative">
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Nơi đi
                      </label>

                      <MapPin className="pointer-events-none absolute left-4 top-[52px] h-5 w-5 -translate-y-1/2 text-[#1976D2]" />

                      <button
                        type="button"
                        disabled={citiesLoading}
                        onClick={() => {
                          setOpenCityMenu((prev) =>
                            prev === "from" ? null : "from"
                          )

                          setCityKeyword((prev) => ({
                            ...prev,
                            from: ""
                          }))
                        }}
                        className="flex h-14 w-full items-center justify-between rounded-2xl border border-blue-100 bg-[#F5F9FF] pl-12 pr-4 text-left transition hover:border-[#1976D2]"
                      >
                        <span
                          className={`truncate text-sm ${
                            form.from_city
                              ? "text-slate-800"
                              : "text-slate-400"
                          }`}
                        >
                          {citiesLoading
                            ? "Đang tải..."
                            : selectedCityName(
                                form.from_city,
                                "Chọn nơi đi"
                              )}
                        </span>

                        <ChevronDown className="h-5 w-5 text-slate-500" />
                      </button>

                      {openCityMenu === "from" && (
                        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-100 bg-white shadow-2xl">
                          <div className="sticky top-0 bg-white p-3">
                            <input
                              type="text"
                              value={cityKeyword.from}
                              onChange={(e) =>
                                setCityKeyword((prev) => ({
                                  ...prev,
                                  from: e.target.value
                                }))
                              }
                              placeholder="Tìm tỉnh/thành..."
                              className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#1976D2]"
                            />
                          </div>

                          {filteredFromCities.map((city) => (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  from_city: String(city.id)
                                }))

                                setOpenCityMenu(null)
                              }}
                              className="block w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-blue-50"
                            >
                              {city.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* TO */}
                    <div className="relative">
                      <label className="mb-2 block text-sm font-bold text-slate-700">
                        Nơi đến
                      </label>

                      <MapPin className="pointer-events-none absolute left-4 top-[52px] h-5 w-5 -translate-y-1/2 text-[#1976D2]" />

                      <button
                        type="button"
                        disabled={citiesLoading}
                        onClick={() => {
                          setOpenCityMenu((prev) =>
                            prev === "to" ? null : "to"
                          )

                          setCityKeyword((prev) => ({
                            ...prev,
                            to: ""
                          }))
                        }}
                        className="flex h-14 w-full items-center justify-between rounded-2xl border border-blue-100 bg-[#F5F9FF] pl-12 pr-4 text-left transition hover:border-[#1976D2]"
                      >
                        <span
                          className={`truncate text-sm ${
                            form.to_city
                              ? "text-slate-800"
                              : "text-slate-400"
                          }`}
                        >
                          {citiesLoading
                            ? "Đang tải..."
                            : selectedCityName(
                                form.to_city,
                                "Chọn nơi đến"
                              )}
                        </span>

                        <ChevronDown className="h-5 w-5 text-slate-500" />
                      </button>

                      {openCityMenu === "to" && (
                        <div className="absolute z-50 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-slate-100 bg-white shadow-2xl">
                          <div className="sticky top-0 bg-white p-3">
                            <input
                              type="text"
                              value={cityKeyword.to}
                              onChange={(e) =>
                                setCityKeyword((prev) => ({
                                  ...prev,
                                  to: e.target.value
                                }))
                              }
                              placeholder="Tìm tỉnh/thành..."
                              className="h-11 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-[#1976D2]"
                            />
                          </div>

                          {filteredToCities.map((city) => (
                            <button
                              key={city.id}
                              type="button"
                              onClick={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  to_city: String(city.id)
                                }))

                                setOpenCityMenu(null)
                              }}
                              className="block w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-blue-50"
                            >
                              {city.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SWAP DESKTOP */}
                    <button
                      type="button"
                      onClick={swapCities}
                      className="absolute left-1/2 top-[52px] hidden h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border-4 border-white bg-[#1976D2] text-white shadow-lg transition hover:rotate-180 md:flex"
                    >
                      <ArrowRightLeft className="h-5 w-5" />
                    </button>
                  </div>

                  {/* MOBILE SWAP */}
                  <button
                    type="button"
                    onClick={swapCities}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 text-sm font-bold text-[#1976D2] md:hidden"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    Đổi nơi đi / nơi đến
                  </button>

                  {/* DATE */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Ngày đi
                    </label>

                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1976D2]" />

                      <input
                        type="date"
                        name="date"
                        value={form.date}
                        min={today}
                        onChange={updateField}
                        className="h-14 w-full rounded-2xl border border-blue-100 bg-[#F5F9FF] pl-12 pr-4 outline-none transition focus:border-[#1976D2]"
                      />
                    </div>
                  </div>

                  {/* ERROR */}
                  {form.from_city === form.to_city &&
                    form.from_city &&
                    form.to_city && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                        Nơi đi và nơi đến không được trùng nhau.
                      </div>
                    )}

                  {citiesError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                      Không tải được dữ liệu: {citiesError}
                    </div>
                  )}

                  {/* BUTTON */}
                  <button
                    type="submit"
                    disabled={!canSubmit || citiesLoading}
                    className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#0A4D9C] to-[#1976D2] text-base font-black text-white shadow-lg shadow-blue-300 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Search className="h-5 w-5" />

                    Tìm chuyến xe
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR ROUTES */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-800 sm:text-3xl">
            Tuyến xe phổ biến
          </h2>

          <p className="mt-2 text-sm text-slate-500 sm:text-base">
            Các tuyến xe được đặt nhiều nhất hôm nay
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularRoutes.map((route, index) => (
            <div
              key={index}
              className="group cursor-pointer rounded-3xl border border-blue-100 bg-white p-5 shadow-md transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100">
                <Bus className="h-7 w-7 text-[#1976D2]" />
              </div>

              <h3 className="text-lg font-black text-slate-800">
                {route.from}
              </h3>

              <div className="my-2 flex items-center gap-2 text-[#1976D2]">
                <div className="h-[2px] flex-1 bg-blue-200" />

                <ArrowRightLeft className="h-4 w-4 rotate-90" />

                <div className="h-[2px] flex-1 bg-blue-200" />
              </div>

              <h3 className="text-lg font-black text-slate-800">
                {route.to}
              </h3>

              <button className="mt-5 w-full rounded-2xl bg-[#F5F9FF] py-3 text-sm font-bold text-[#1976D2] transition hover:bg-blue-100">
                Xem chuyến xe
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white py-10 sm:py-14">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:px-8 md:grid-cols-3">
          <div className="rounded-3xl border border-blue-100 bg-[#F8FBFF] p-7">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100">
              <ShieldCheck className="h-8 w-8 text-[#1976D2]" />
            </div>

            <h3 className="text-xl font-black text-slate-800">
              Thanh toán an toàn
            </h3>

            <p className="mt-3 leading-relaxed text-slate-500">
              Hệ thống bảo mật hiện đại giúp bạn thanh toán nhanh chóng và an
              toàn.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-[#F8FBFF] p-7">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100">
              <Clock3 className="h-8 w-8 text-[#1976D2]" />
            </div>

            <h3 className="text-xl font-black text-slate-800">
              Đặt vé nhanh chóng
            </h3>

            <p className="mt-3 leading-relaxed text-slate-500">
              Chỉ vài thao tác đơn giản là bạn đã có thể đặt vé thành công.
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-[#F8FBFF] p-7">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100">
              <Headphones className="h-8 w-8 text-[#1976D2]" />
            </div>

            <h3 className="text-xl font-black text-slate-800">
              Hỗ trợ 24/7
            </h3>

            <p className="mt-3 leading-relaxed text-slate-500">
              Đội ngũ hỗ trợ luôn sẵn sàng giúp bạn mọi lúc mọi nơi.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
