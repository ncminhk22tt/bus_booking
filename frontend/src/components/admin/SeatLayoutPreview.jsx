import { useEffect, useMemo, useState } from "react"

function parseLayout(layout) {
  return String(layout || "")
    .split("-")
    .map((item) => Number(item))
    .filter((num) => Number.isInteger(num) && num > 0)
}

function isLimousineNine(busType) {
  const name = String(busType?.name || "").toLowerCase()
  const layout = String(busType?.layout || "")
  return name.includes("limousine 9") || name.includes("dcar 9") || layout === "2-2-3"
}

function isSeaterFortyFive(busType) {
  const name = String(busType?.name || "").toLowerCase()
  const layout = String(busType?.layout || "")
  const totalSeats = Number(busType?.total_seats || 0)
  return name.includes("45") || (layout === "2-2" && totalSeats === 45)
}

function isSleeperForty(busType) {
  const name = String(busType?.name || "").toLowerCase()
  const layout = String(busType?.layout || "")
  return name.includes("giường nằm 40") || name.includes("giuong nam 40") || layout === "1-1-1"
}

function isLuxuryThirtyFour(busType) {
  const name = String(busType?.name || "").toLowerCase()
  const totalSeats = Number(busType?.total_seats || 0)
  return name.includes("luxury 34") || (name.includes("34") && name.includes("luxury")) || totalSeats === 34
}

function seatLabelByFloor(floor, indexInFloor) {
  const prefix = Number(floor) === 2 ? "B" : "A"
  return `${prefix}${indexInFloor}`
}

function buildSlots(layoutGroups) {
  const slots = []

  for (let g = 0; g < layoutGroups.length; g++) {
    for (let s = 0; s < layoutGroups[g]; s++) {
      slots.push({ kind: "seat", groupIndex: g, seatInGroup: s + 1 })
    }

    if (g < layoutGroups.length - 1) {
      slots.push({ kind: "space" })
    }
  }

  return slots
}

function parseSeatMapTemplate(raw) {
  if (!raw) return null
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
    if (!parsed || !Array.isArray(parsed.floors)) return null
    return parsed
  } catch {
    return null
  }
}

const LIMOUSINE_NINE_TEMPLATE = [
  [{ kind: "driver", text: "Tài" }, { kind: "space" }, { kind: "seat", label: "A1" }],
  [{ kind: "seat", label: "A2" }, { kind: "space" }, { kind: "seat", label: "A3" }],
  [{ kind: "seat", label: "A4" }, { kind: "space" }, { kind: "seat", label: "A5" }],
  [{ kind: "seat", label: "A6" }, { kind: "seat", label: "A7" }, { kind: "seat", label: "A8" }]
]

export default function SeatLayoutPreview({ busType, title = "Xem trước sơ đồ ghế" }) {
  const [activeFloor, setActiveFloor] = useState(1)

  const layoutGroups = useMemo(() => parseLayout(busType?.layout), [busType?.layout])
  const floors = Number(busType?.floors || 1)
  const rowCount = Number(busType?.row_count || 0)
  const limousineNine = useMemo(() => isLimousineNine(busType), [busType])
  const seaterFortyFive = useMemo(() => isSeaterFortyFive(busType), [busType])
  const sleeperForty = useMemo(() => isSleeperForty(busType), [busType])
  const luxuryThirtyFour = useMemo(() => isLuxuryThirtyFour(busType), [busType])

  const slots = useMemo(() => buildSlots(layoutGroups), [layoutGroups])
  const seatMapTemplate = useMemo(() => parseSeatMapTemplate(busType?.seat_map_template), [busType?.seat_map_template])

  useEffect(() => {
    setActiveFloor(1)
  }, [busType?.id])

  if (!busType) return null

  if (!seatMapTemplate && !limousineNine && (!layoutGroups.length || !rowCount)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Loại xe chưa có cấu hình sơ đồ ghế hợp lệ.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-slate-800">{title}</h4>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>{busType.name}</span>
          <span className="rounded-full bg-white px-2 py-0.5">{busType.layout}</span>
          <span className="rounded-full bg-white px-2 py-0.5">{busType.total_seats} chỗ</span>
        </div>
      </div>

      {floors > 1 && !limousineNine && (
        <div className="mt-2 flex gap-2">
          {Array.from({ length: floors }, (_, i) => i + 1).map((floor) => (
            <button
              key={`preview-floor-${floor}`}
              type="button"
              onClick={() => setActiveFloor(floor)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                floor === activeFloor ? "bg-brand-500 text-white" : "bg-white text-slate-700"
              }`}
            >
              Tầng {floor}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-3">
        {seatMapTemplate ? (
          <div className="space-y-2">
            {(seatMapTemplate.floors || [])
              .filter((floorItem) => Number(floorItem.floor) === Number(activeFloor))
              .map((floorItem) =>
                (floorItem.rows || []).map((rowItem) => {
                  const cols = Array.from({ length: Number(busType?.col_count || 1) }, (_, idx) => idx + 1)
                  const seatCols = new Set((rowItem.seat_cols || []).map((n) => Number(n)))
                  let seatIndexInRow = 1
                  return (
                    <div key={`template-row-${floorItem.floor}-${rowItem.row}`} className="flex items-center gap-2">
                      <span className="w-6 text-right text-xs font-semibold text-slate-400">{rowItem.row}</span>
                      <div
                        className="grid gap-2"
                        style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(24px, 32px))` }}
                      >
                        {cols.map((col) => {
                          if (!seatCols.has(col)) {
                            return <div key={`template-space-${floorItem.floor}-${rowItem.row}-${col}`} className="h-8 w-8" />
                          }
                          const label = seatLabelByFloor(activeFloor, seatIndexInRow)
                          seatIndexInRow += 1
                          return (
                            <div
                              key={`template-seat-${floorItem.floor}-${rowItem.row}-${col}`}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-300 bg-brand-50 text-[10px] font-semibold text-brand-700"
                              title={`Tầng ${activeFloor} - Ghế ${label}`}
                            >
                              {label}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
          </div>
        ) : limousineNine ? (
          <div className="space-y-2">
            {LIMOUSINE_NINE_TEMPLATE.map((row, rowIndex) => (
              <div key={`limo9-row-${rowIndex}`} className="flex items-center gap-2">
                <span className="w-6 text-right text-xs font-semibold text-slate-400">{rowIndex + 1}</span>
                <div className="grid grid-cols-3 gap-2">
                  {row.map((cell, colIndex) => {
                    if (cell.kind === "space") {
                      return <div key={`limo9-space-${rowIndex}-${colIndex}`} className="h-8 w-8" />
                    }

                    if (cell.kind === "driver") {
                      return (
                        <div
                          key={`limo9-driver-${rowIndex}-${colIndex}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-[10px] font-semibold text-slate-600"
                        >
                          {cell.text}
                        </div>
                      )
                    }

                    return (
                      <div
                        key={`limo9-seat-${rowIndex}-${colIndex}`}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-300 bg-brand-50 text-[10px] font-semibold text-brand-700"
                      >
                        {cell.label}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : seaterFortyFive ? (
          <div className="space-y-2">
            {Array.from({ length: 11 }, (_, idx) => idx + 1).map((row) => {
              const start = (row - 1) * 4 + 1
              const labels = row < 11
                ? [`A${start}`, `A${start + 1}`, null, `A${start + 2}`, `A${start + 3}`]
                : ["A41", "A42", "A43", "A44", "A45"]

              return (
                <div key={`preview-row-45-${row}`} className="flex items-center gap-2">
                  <span className="w-6 text-right text-xs font-semibold text-slate-400">{row}</span>
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(5, minmax(24px, 32px))" }}>
                    {labels.map((label, idx) => {
                      if (!label) {
                        return <div key={`preview-45-space-${row}-${idx}`} className="h-8 w-2 rounded bg-transparent" />
                      }

                      return (
                        <div
                          key={`preview-45-seat-${row}-${label}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-300 bg-brand-50 text-[10px] font-semibold text-brand-700"
                          title={`Tầng 1 - Ghế ${label}`}
                        >
                          {label}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : luxuryThirtyFour ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, idx) => idx + 1).map((row) => {
              const prefix = activeFloor === 1 ? "A" : "B"
              const start = (row - 1) * 3 + 1
              const labels = row < 6
                ? [
                    `${prefix}${String(start).padStart(2, "0")}L`,
                    null,
                    `${prefix}${String(start + 1).padStart(2, "0")}M`,
                    null,
                    `${prefix}${String(start + 2).padStart(2, "0")}R`
                  ]
                : [
                    `${prefix}16L`,
                    `${prefix}17M`,
                    null,
                    `${prefix}18R`,
                    `${prefix}19R`
                  ]

              return (
                <div key={`preview-row-34-${activeFloor}-${row}`} className="flex items-center gap-2">
                  <span className="w-6 text-right text-xs font-semibold text-slate-400">{row}</span>
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(5, minmax(24px, 32px))" }}>
                    {labels.map((label, idx) => {
                      if (!label) {
                        return <div key={`preview-34-space-${row}-${idx}`} className="h-8 w-2 rounded bg-transparent" />
                      }

                      return (
                        <div
                          key={`preview-34-seat-${row}-${label}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-300 bg-brand-50 text-[10px] font-semibold text-brand-700"
                          title={`Tầng ${activeFloor} - Ghế ${label}`}
                        >
                          {label}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : sleeperForty ? (
          <div className="space-y-2">
            {Array.from({ length: 7 }, (_, idx) => idx + 1).map((row) => {
              const prefix = activeFloor === 1 ? "A" : "B"
              const start = (row - 1) * 3 + 1
              const labels = row < 7
                ? [`${prefix}${String(start).padStart(2, "0")}`, null, `${prefix}${String(start + 1).padStart(2, "0")}`, null, `${prefix}${String(start + 2).padStart(2, "0")}`]
                : [
                    `${prefix}${String(19).padStart(2, "0")}`,
                    `${prefix}${String(20).padStart(2, "0")}`,
                    `${prefix}${String(21).padStart(2, "0")}`,
                    `${prefix}${String(22).padStart(2, "0")}`,
                    `${prefix}${String(23).padStart(2, "0")}`
                  ]

              return (
                <div key={`preview-row-40-${activeFloor}-${row}`} className="flex items-center gap-2">
                  <span className="w-6 text-right text-xs font-semibold text-slate-400">{row}</span>
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(5, minmax(24px, 32px))" }}>
                    {labels.map((label, idx) => {
                      if (!label) {
                        return <div key={`preview-40-space-${row}-${idx}`} className="h-8 w-2 rounded bg-transparent" />
                      }

                      return (
                        <div
                          key={`preview-40-seat-${row}-${label}`}
                          className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-300 bg-brand-50 text-[10px] font-semibold text-brand-700"
                          title={`Tầng ${activeFloor} - Ghế ${label}`}
                        >
                          {label}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {(() => {
              let seatIndexInFloor = 1
              return Array.from({ length: rowCount }, (_, idx) => idx + 1).map((row) => {
                return (
                  <div key={`preview-row-${activeFloor}-${row}`} className="flex items-center gap-2">
                    <span className="w-6 text-right text-xs font-semibold text-slate-400">{row}</span>
                    <div
                      className="grid gap-2"
                      style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(24px, 32px))` }}
                    >
                      {slots.map((slot, slotIndex) => {
                        if (slot.kind === "space") {
                          return <div key={`preview-space-${row}-${slotIndex}`} className="h-8 w-2 rounded bg-transparent" />
                        }

                        const label = seatLabelByFloor(activeFloor, seatIndexInFloor)
                        seatIndexInFloor += 1

                        return (
                          <div
                            key={`preview-seat-${activeFloor}-${row}-${slotIndex}`}
                            className="flex h-8 w-8 items-center justify-center rounded-md border border-brand-300 bg-brand-50 text-[10px] font-semibold text-brand-700"
                            title={`Tầng ${activeFloor} - Ghế ${label}`}
                          >
                            {label}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
