const db = require("../config/db")
const { generateSeatLabel } = require("../utils/seatLayoutHelper")

const VALID_SEAT_TYPES = ["seat", "bed", "vip"]

function parseLayoutGroups(layout) {
  const groups = String(layout || "")
    .split("-")
    .map((item) => Number(item))
    .filter((num) => Number.isInteger(num) && num > 0)

  if (groups.length === 0) {
    return null
  }

  return groups
}

function normalizeSeatType(seatType) {
  const value = String(seatType || "").toLowerCase().trim()
  return VALID_SEAT_TYPES.includes(value) ? value : "seat"
}

function hasValidSeatMapDefinition(busType = {}) {
  if (busType && busType.seat_map_template) {
    try {
      const parsed = typeof busType.seat_map_template === "string"
        ? JSON.parse(busType.seat_map_template)
        : busType.seat_map_template

      if (parsed && Array.isArray(parsed.floors) && parsed.floors.length > 0) {
        return true
      }
    } catch (error) {
      // fallback to layout parsing
    }
  }

  return parseLayoutGroups(busType.layout) !== null
}

function isLimousineNineBusType(busType = {}) {
  const name = String(busType.name || "").toLowerCase()
  const layout = String(busType.layout || "")
  const floors = Number(busType.floors || 0)
  const rowCount = Number(busType.row_count || 0)

  return (
    name.includes("limousine 9") ||
    name.includes("dcar 9") ||
    (layout === "2-2-3" && floors === 1 && rowCount === 4)
  )
}

function isSeaterFortyFiveBusType(busType = {}) {
  const name = String(busType.name || "").toLowerCase()
  const layout = String(busType.layout || "")
  const floors = Number(busType.floors || 0)
  const rowCount = Number(busType.row_count || 0)
  const totalSeats = Number(busType.total_seats || 0)

  return (
    name.includes("45") ||
    (layout === "2-2" && floors === 1 && rowCount === 11 && totalSeats === 45)
  )
}

function isSleeperFortyBusType(busType = {}) {
  const name = String(busType.name || "").toLowerCase()
  const layout = String(busType.layout || "")
  const floors = Number(busType.floors || 0)
  const totalSeats = Number(busType.total_seats || 0)

  return (
    name.includes("giường nằm 40") ||
    name.includes("giuong nam 40") ||
    (layout === "1-1-1" && floors === 2 && totalSeats === 40)
  )
}

function isLuxuryThirtyFourBusType(busType = {}) {
  const name = String(busType.name || "").toLowerCase()
  const totalSeats = Number(busType.total_seats || 0)
  return name.includes("luxury 34") || (name.includes("34") && name.includes("luxury")) || totalSeats === 34
}

function buildLimousineNineSeats(busId, seatType) {
  return [
    [busId, "A1", 1, 1, 3, seatType],
    [busId, "A2", 1, 2, 1, seatType],
    [busId, "A3", 1, 2, 3, seatType],
    [busId, "A4", 1, 3, 1, seatType],
    [busId, "A5", 1, 3, 3, seatType],
    [busId, "A6", 1, 4, 1, seatType],
    [busId, "A7", 1, 4, 2, seatType],
    [busId, "A8", 1, 4, 3, seatType]
  ]
}

function buildSeaterFortyFiveSeats(busId, seatType) {
  const seats = []
  let seatNo = 1

  // Hàng 1-10: 2 ghế trái, lối đi, 2 ghế phải
  for (let row = 1; row <= 10; row++) {
    for (const col of [1, 2, 4, 5]) {
      seats.push([
        busId,
        `A${seatNo}`,
        1,
        row,
        col,
        seatType
      ])
      seatNo += 1
    }
  }

  // Hàng cuối: 5 ghế liền A41-A45
  for (const col of [1, 2, 3, 4, 5]) {
    seats.push([
      busId,
      `A${seatNo}`,
      1,
      11,
      col,
      seatType
    ])
    seatNo += 1
  }

  return seats
}

function buildSleeperFortySeats(busId, seatType) {
  const seats = []

  for (let floor = 1; floor <= 2; floor++) {
    const prefix = floor === 1 ? "A" : "B"
    let seatNo = 1

    for (let row = 1; row <= 6; row++) {
      for (const col of [1, 3, 5]) {
        seats.push([
          busId,
          `${prefix}${String(seatNo).padStart(2, "0")}`,
          floor,
          row,
          col,
          seatType
        ])
        seatNo += 1
      }
    }

    for (const col of [1, 2, 3, 4, 5]) {
      seats.push([
        busId,
        `${prefix}${String(seatNo).padStart(2, "0")}`,
        floor,
        7,
        col,
        seatType
      ])
      seatNo += 1
    }
  }

  return seats
}

function buildLuxuryThirtyFourSeats(busId, seatType) {
  const seats = []

  for (let floor = 1; floor <= 2; floor++) {
    const prefix = floor === 1 ? "A" : "B"
    let seatNo = 1

    for (let row = 1; row <= 5; row++) {
      const rowPattern = [
        { col: 1, suffix: "L" },
        { col: 3, suffix: "M" },
        { col: 5, suffix: "R" }
      ]

      for (const item of rowPattern) {
        seats.push([
          busId,
          `${prefix}${String(seatNo).padStart(2, "0")}${item.suffix}`,
          floor,
          row,
          item.col,
          seatType
        ])
        seatNo += 1
      }
    }

    const lastRowPattern = [
      { col: 1, suffix: "L" },
      { col: 2, suffix: "M" },
      { col: 4, suffix: "R" },
      { col: 5, suffix: "R" }
    ]

    for (const item of lastRowPattern) {
      seats.push([
        busId,
        `${prefix}${String(seatNo).padStart(2, "0")}${item.suffix}`,
        floor,
        6,
        item.col,
        seatType
      ])
      seatNo += 1
    }
  }

  return seats
}

async function createSeatMap(busId, busType, executor = db) {
  const { floors, row_count, layout, seat_type, seat_map_template } = busType
  const normalizedSeatType = normalizeSeatType(seat_type)
  const floorCount = Number(floors) || 0
  const rowCount = Number(row_count) || 0

  let seats = []

  if (seat_map_template) {
    let parsed = null
    try {
      parsed = typeof seat_map_template === "string"
        ? JSON.parse(seat_map_template)
        : seat_map_template
    } catch (error) {
      parsed = null
    }

    if (parsed && Array.isArray(parsed.floors)) {
      for (const floorItem of parsed.floors) {
        const floor = Number(floorItem.floor)
        if (!Number.isInteger(floor) || floor <= 0) continue
        const rows = Array.isArray(floorItem.rows) ? floorItem.rows : []
        for (const rowItem of rows) {
          const row = Number(rowItem.row)
          if (!Number.isInteger(row) || row <= 0) continue
          const cols = Array.isArray(rowItem.seat_cols) ? rowItem.seat_cols : []
          let seatIndexInRow = 1
          for (const colRaw of cols) {
            const col = Number(colRaw)
            if (!Number.isInteger(col) || col <= 0) continue
            seats.push([
              busId,
              generateSeatLabel(row, seatIndexInRow, floor),
              floor,
              row,
              col,
              normalizedSeatType
            ])
            seatIndexInRow++
          }
        }
      }
    }
  }

  if (seats.length > 0) {
    // no-op, already built from super admin template
  } else if (isSeaterFortyFiveBusType(busType)) {
    seats = buildSeaterFortyFiveSeats(busId, normalizedSeatType)
  } else if (isLuxuryThirtyFourBusType(busType)) {
    seats = buildLuxuryThirtyFourSeats(busId, normalizedSeatType)
  } else if (isSleeperFortyBusType(busType)) {
    seats = buildSleeperFortySeats(busId, normalizedSeatType)
  } else if (isLimousineNineBusType(busType)) {
    seats = buildLimousineNineSeats(busId, normalizedSeatType)
  } else {
    const layoutGroups = parseLayoutGroups(layout)

    if (!layoutGroups || floorCount <= 0 || rowCount <= 0) {
      throw new Error("Layout xe không hợp lệ")
    }

    for (let f = 1; f <= floorCount; f++) {
      for (let r = 1; r <= rowCount; r++) {
        let seatIndexInRow = 1
        let col = 1

        for (let groupIndex = 0; groupIndex < layoutGroups.length; groupIndex++) {
          const groupSize = layoutGroups[groupIndex]

          for (let i = 1; i <= groupSize; i++) {
            seats.push([
              busId,
              generateSeatLabel(r, seatIndexInRow, f),
              f,
              r,
              col,
              normalizedSeatType
            ])

            seatIndexInRow++
            col++
          }

          if (groupIndex < layoutGroups.length - 1) {
            col++
          }
        }
      }
    }
  }

  const seatLabels = seats.map((item) => String(item[1]))
  const duplicates = seatLabels.filter((label, index) => seatLabels.indexOf(label) !== index)
  if (duplicates.length > 0) {
    const uniqueDuplicates = [...new Set(duplicates)]
    throw new Error(`Duplicate seat labels detected: ${uniqueDuplicates.join(", ")}`)
  }

  await executor.query(
    `INSERT INTO seats
    (bus_id, seat_number, floor, row_index, col_index, seat_type)
    VALUES ?`,
    [seats]
  )
}

module.exports = {
  createSeatMap,
  parseLayoutGroups,
  hasValidSeatMapDefinition,
  isLimousineNineBusType,
  isSeaterFortyFiveBusType,
  isSleeperFortyBusType,
  isLuxuryThirtyFourBusType
}
