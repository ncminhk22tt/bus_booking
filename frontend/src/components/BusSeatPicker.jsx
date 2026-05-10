import { useMemo, useState } from "react"
import {
  CircleOff,
  ShipWheel,
  Armchair,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Wallet,
  Landmark,
  User,
  Phone,
  Sparkles
} from "lucide-react"

import { Link, useLocation } from "react-router-dom"
import Seat from "./Seat"

import { useAuth } from "../context/AuthContext"
import { formatCurrency } from "../lib/formatters"

function groupSeatsByFloorAndRow(seats) {
  const floors = new Map()

  for (const seat of seats) {
    if (!floors.has(seat.floor)) {
      floors.set(seat.floor, new Map())
    }

    const rows = floors.get(seat.floor)

    if (!rows.has(seat.row)) {
      rows.set(seat.row, [])
    }

    rows.get(seat.row).push(seat)
  }

  return floors
}

function normalizeSeatPosition(rowSeats) {
  const byCol = new Map()

  for (const seat of rowSeats) {
    const col = Number(seat.column)

    if (
      Number.isInteger(col) &&
      col > 0 &&
      !byCol.has(col)
    ) {
      byCol.set(col, seat)
    }
  }

  return byCol
}

function parseLayoutGroups(layout) {
  return String(layout || "")
    .split("-")
    .map((item) => Number(item))
    .filter(
      (num) => Number.isInteger(num) && num > 0
    )
}

function buildColumnSlots(
  layout,
  fallbackColCount
) {
  const groups = parseLayoutGroups(layout)

  if (groups.length > 0) {
    const slots = []
    let col = 1

    for (let g = 0; g < groups.length; g++) {
      for (let i = 0; i < groups[g]; i++) {
        slots.push({
          kind: "seat",
          col
        })

        col += 1
      }

      if (g < groups.length - 1) {
        slots.push({
          kind: "space",
          col
        })

        col += 1
      }
    }

    return slots
  }

  const colCount = Math.max(
    1,
    Number(fallbackColCount || 0)
  )

  return Array.from(
    { length: colCount },
    (_, idx) => ({
      kind: "seat",
      col: idx + 1
    })
  )
}

export default function BusSeatPicker({
  seats = [],
  busType = "",
  onConfirmBooking
}) {
  const { isAuthenticated } = useAuth()

  const location = useLocation()

  const nextUrl = `${location.pathname}${location.search}`

  const [activeFloor, setActiveFloor] =
    useState(1)

  const [selectedSeatIds, setSelectedSeatIds] =
    useState([])

  const [showPaymentModal, setShowPaymentModal] =
    useState(false)

  const [
    showFinalConfirmModal,
    setShowFinalConfirmModal
  ] = useState(false)

  const [paying, setPaying] = useState(false)

  const [paymentErrors, setPaymentErrors] =
    useState({})

  const [paymentNotice, setPaymentNotice] =
    useState("")

  const [actionNotice, setActionNotice] =
    useState("")

  const [actionNoticeType, setActionNoticeType] =
    useState("info")

  const [
    showLoginLinkNotice,
    setShowLoginLinkNotice
  ] = useState(false)

  const [paymentForm, setPaymentForm] =
    useState({
      fullName: "",
      phone: "",
      method: "",
      bank: ""
    })

  const floors = useMemo(() => {
    const floorList = [
      ...new Set(
        seats.map((s) => Number(s.floor))
      )
    ].sort((a, b) => a - b)

    return floorList.length
      ? floorList
      : [1]
  }, [seats])

  const rows = useMemo(() => {
    const grouped =
      groupSeatsByFloorAndRow(
        seats.filter(
          (seat) =>
            Number(seat.floor) ===
            Number(activeFloor)
        )
      )

    const floorRows =
      grouped.get(activeFloor) || new Map()

    return [...floorRows.entries()]
      .sort(
        (a, b) =>
          Number(a[0]) - Number(b[0])
      )
      .map(([rowNumber, rowSeats]) => ({
        rowNumber,
        byCol:
          normalizeSeatPosition(rowSeats)
      }))
  }, [seats, activeFloor])

  const busMeta = useMemo(
    () => seats[0] || {},
    [seats]
  )

  const columnSlots = useMemo(
    () =>
      buildColumnSlots(
        busMeta.layout,
        busMeta.col_count
      ),
    [busMeta.layout, busMeta.col_count]
  )

  const selectedSeats = useMemo(() => {
    return seats
      .filter((seat) =>
        selectedSeatIds.includes(seat.id)
      )
      .sort((a, b) =>
        String(a.seat_number).localeCompare(
          String(b.seat_number),
          "vi"
        )
      )
  }, [seats, selectedSeatIds])

  const totalPrice = useMemo(
    () =>
      selectedSeats.reduce(
        (sum, seat) =>
          sum + Number(seat.price || 0),
        0
      ),
    [selectedSeats]
  )

  function handleSeatClick(seat) {
    if (seat.status !== "Available") return

    setSelectedSeatIds((prev) => {
      const existed = prev.includes(seat.id)

      if (existed) {
        return prev.filter(
          (id) => id !== seat.id
        )
      }

      if (prev.length >= 6) {
        setActionNotice(
          "Bạn chỉ được chọn tối đa 6 ghế."
        )

        setActionNoticeType("error")

        return prev
      }

      return [...prev, seat.id]
    })
  }

  function resetPaymentState() {
    setShowPaymentModal(false)
    setShowFinalConfirmModal(false)

    setPaying(false)

    setPaymentErrors({})
    setPaymentNotice("")

    setPaymentForm({
      fullName: "",
      phone: "",
      method: "",
      bank: ""
    })
  }

  async function handleBookingConfirm() {
    if (selectedSeatIds.length === 0) {
      setActionNotice(
        "Vui lòng chọn ít nhất 1 ghế."
      )

      setActionNoticeType("error")

      return
    }

    if (!isAuthenticated) {
      setActionNotice(
        "Bạn cần đăng nhập để tiếp tục."
      )

      setActionNoticeType("warning")

      setShowLoginLinkNotice(true)

      return
    }

    setShowPaymentModal(true)
  }

  async function handlePaymentSubmit(e) {
    e.preventDefault()

    setShowFinalConfirmModal(true)
  }

  async function handleFinalConfirmPayment() {
    setPaymentNotice("Đang thanh toán...")
    setPaying(true)

    try {
      await onConfirmBooking?.(
        selectedSeatIds,
        {
          contact_name:
            paymentForm.fullName,
          contact_phone:
            paymentForm.phone,
          payment_method:
            paymentForm.method,
          payment_bank:
            paymentForm.bank
        }
      )

      resetPaymentState()

      setSelectedSeatIds([])
    } catch (error) {
      setPaymentNotice(
        error?.message ||
          "Có lỗi khi thanh toán"
      )
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* TOP */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles
                size={20}
                className="text-[#2563eb]"
              />

              <h2 className="text-3xl font-extrabold text-slate-900">
                Sơ đồ ghế
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              {busType}
            </p>
          </div>

          {/* FLOOR */}
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100 p-2">
            {floors.map((floor) => (
              <button
                key={floor}
                type="button"
                onClick={() =>
                  setActiveFloor(floor)
                }
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  Number(activeFloor) ===
                  Number(floor)
                    ? "bg-[#2563eb] text-white shadow-sm"
                    : "text-slate-600 hover:bg-white"
                }`}
              >
                {floor === 1
                  ? "Tầng dưới"
                  : "Tầng trên"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* LEFT */}
        <div className="space-y-4">
          {/* LEGEND */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Chú thích
            </h3>

            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl border border-slate-300 bg-white" />

                <span className="text-sm text-slate-700">
                  Ghế trống
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-300 bg-slate-200">
                  <CircleOff
                    size={15}
                    className="text-slate-600"
                  />
                </div>

                <span className="text-sm text-slate-700">
                  Đã đặt
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl border border-amber-400 bg-amber-100" />

                <span className="text-sm text-slate-700">
                  Ghế VIP
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-emerald-500" />

                <span className="text-sm text-slate-700">
                  Đang chọn
                </span>
              </div>
            </div>
          </div>

          {/* SELECTED */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Armchair
                size={18}
                className="text-[#2563eb]"
              />

              <h3 className="text-lg font-bold text-slate-900">
                Ghế đã chọn
              </h3>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                Danh sách ghế
              </p>

              <p className="mt-1 font-bold text-slate-800">
                {selectedSeats.length
                  ? selectedSeats
                      .map(
                        (s) => s.seat_number
                      )
                      .join(", ")
                  : "Chưa chọn ghế"}
              </p>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-sm text-slate-500">
                  Tổng tiền
                </p>

                <p className="text-3xl font-extrabold text-[#2563eb]">
                  {formatCurrency(totalPrice)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleBookingConfirm}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2563eb] px-4 py-3 font-semibold text-white transition hover:bg-[#1d4ed8]"
              >
                <CheckCircle2 size={18} />
                Xác nhận đặt ghế
              </button>
            </div>
          </div>

          {/* NOTICE */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div
              className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                actionNoticeType === "error"
                  ? "bg-red-50 text-red-600"
                  : actionNoticeType ===
                    "warning"
                  ? "bg-yellow-50 text-yellow-700"
                  : "bg-slate-100 text-slate-700"
              }`}
            >
              {actionNotice || (
                <span className="text-slate-400">
                  Thông báo sẽ hiển thị
                  tại đây.
                </span>
              )}

              {showLoginLinkNotice && (
                <>
                  {" "}
                  <Link
                    to={`/login?next=${encodeURIComponent(
                      nextUrl
                    )}`}
                    className="font-bold underline"
                  >
                    Đăng nhập
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-900">
              {activeFloor === 1
                ? "Tầng dưới"
                : "Tầng trên"}
            </h3>

            {activeFloor === 1 && (
              <ShipWheel className="text-slate-400" />
            )}
          </div>

          <div className="overflow-x-auto">
            <div className="mx-auto min-w-max space-y-3">
              {rows.map((row) => (
                <div
                  key={`row-${row.rowNumber}`}
                  className="flex items-center gap-3"
                >
                  <span className="w-6 text-right text-xs font-bold text-slate-400">
                    {row.rowNumber}
                  </span>

                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: `repeat(${columnSlots.length}, minmax(2.8rem, 3rem))`
                    }}
                  >
                    {columnSlots.map(
                      (slot, index) => {
                        const seat =
                          row.byCol.get(
                            slot.col
                          )

                        if (
                          slot.kind ===
                            "space" &&
                          !seat
                        ) {
                          return (
                            <div
                              key={`space-${row.rowNumber}-${index}`}
                              className="w-5"
                            />
                          )
                        }

                        if (!seat) {
                          return (
                            <div
                              key={`empty-${row.rowNumber}-${slot.col}`}
                              className="h-12 w-12"
                            />
                          )
                        }

                        return (
                          <Seat
                            key={`seat-${seat.id}`}
                            seat={seat}
                            isSelected={selectedSeatIds.includes(
                              seat.id
                            )}
                            onClick={
                              handleSeatClick
                            }
                          />
                        )
                      }
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-extrabold text-slate-900">
              Thanh toán vé xe
            </h3>

            <div className="mt-4 rounded-2xl bg-[#f8fbff] p-4">
              <p className="text-sm text-slate-500">
                Ghế đã chọn
              </p>

              <p className="mt-1 font-bold text-slate-800">
                {selectedSeats
                  .map((s) => s.seat_number)
                  .join(", ")}
              </p>

              <p className="mt-3 text-sm text-slate-500">
                Tổng thanh toán
              </p>

              <p className="text-3xl font-extrabold text-[#2563eb]">
                {formatCurrency(totalPrice)}
              </p>
            </div>

            <form
              className="mt-5 space-y-4"
              onSubmit={handlePaymentSubmit}
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Họ và tên
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={
                      paymentForm.fullName
                    }
                    onChange={(e) =>
                      setPaymentForm(
                        (prev) => ({
                          ...prev,
                          fullName:
                            e.target.value
                        })
                      )
                    }
                    placeholder="Nhập họ và tên"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Số điện thoại
                </label>

                <div className="relative">
                  <Phone
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={
                      paymentForm.phone
                    }
                    onChange={(e) =>
                      setPaymentForm(
                        (prev) => ({
                          ...prev,
                          phone:
                            e.target.value
                        })
                      )
                    }
                    placeholder="Nhập số điện thoại"
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 outline-none focus:border-[#2563eb]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Phương thức thanh toán
                </label>

                <div className="relative">
                  <Wallet
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={
                      paymentForm.method
                    }
                    onChange={(e) =>
                      setPaymentForm(
                        (prev) => ({
                          ...prev,
                          method:
                            e.target.value
                        })
                      )
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 outline-none focus:border-[#2563eb]"
                  >
                    <option value="">
                      Chọn phương thức
                    </option>

                    <option value="momo">
                      Ví MoMo
                    </option>

                    <option value="bank">
                      Thẻ ngân hàng
                    </option>

                    <option value="cash">
                      Tiền mặt
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Ngân hàng
                </label>

                <div className="relative">
                  <Landmark
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={paymentForm.bank}
                    onChange={(e) =>
                      setPaymentForm(
                        (prev) => ({
                          ...prev,
                          bank:
                            e.target.value
                        })
                      )
                    }
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 outline-none focus:border-[#2563eb]"
                  >
                    <option value="">
                      Chọn ngân hàng
                    </option>

                    <option value="vcb">
                      Vietcombank
                    </option>

                    <option value="mb">
                      MB Bank
                    </option>

                    <option value="tcb">
                      Techcombank
                    </option>

                    <option value="bidv">
                      BIDV
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={
                    resetPaymentState
                  }
                  className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-2xl bg-[#2563eb] px-5 py-3 font-semibold text-white hover:bg-[#1d4ed8]"
                >
                  <CreditCard size={18} />
                  Tiếp tục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FINAL MODAL */}
      {showFinalConfirmModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#eff6ff]">
              <AlertTriangle className="text-[#2563eb]" size={38} />
            </div>

            <h3 className="mt-5 text-center text-2xl font-extrabold text-slate-900">
              Xác nhận thanh toán
            </h3>

            <p className="mt-2 text-center text-sm text-slate-500">
              Bạn có chắc muốn thanh toán
              đơn vé này không?
            </p>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  Ghế
                </span>

                <span className="font-bold text-slate-800">
                  {selectedSeats
                    .map((s) => s.seat_number)
                    .join(", ")}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-slate-500">
                  Tổng tiền
                </span>

                <span className="text-2xl font-extrabold text-[#2563eb]">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>

            {paymentNotice && (
              <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                {paymentNotice}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowFinalConfirmModal(
                    false
                  )
                }
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Quay lại
              </button>

              <button
                type="button"
                onClick={
                  handleFinalConfirmPayment
                }
                disabled={paying}
                className="rounded-2xl bg-[#2563eb] px-5 py-3 font-semibold text-white hover:bg-[#1d4ed8] disabled:opacity-60"
              >
                {paying
                  ? "Đang xử lý..."
                  : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
