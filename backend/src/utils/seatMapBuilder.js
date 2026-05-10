function isLimousineNineLayout(meta = {}) {
  const name = String(meta.bus_type_name || "").toLowerCase()
  const layout = String(meta.layout || "")

  return (
    name.includes("limousine 9") ||
    name.includes("dcar 9") ||
    layout === "2-2-3"
  )
}

function isLuxuryThirtyFourLayout(meta = {}) {
  const name = String(meta.bus_type_name || "").toLowerCase()

  return (
    name.includes("luxury 34") ||
    (name.includes("luxury") &&
      name.includes("34"))
  )
}

function parseLayoutGroups(layout) {
  return String(layout || "")
    .split("-")
    .map((item) => Number(item))
    .filter(
      (num) =>
        Number.isInteger(num) &&
        num > 0
    )
}

function buildAisleColumns(layoutGroups) {
  const aisleCols = new Set()

  let cursor = 0

  for (
    let i = 0;
    i < layoutGroups.length;
    i++
  ) {
    cursor += layoutGroups[i]

    if (i < layoutGroups.length - 1) {
      cursor += 1
      aisleCols.add(cursor)
    }
  }

  return aisleCols
}

function buildSeatMap(
  seatRows,
  meta
) {
  const {
    floors,
    row_count,
    col_count,
    layout
  } = meta

  const floorCount = Number(
    floors || 1
  )

  const rowCount = Number(
    row_count || 0
  )

  const isLimo9 =
    isLimousineNineLayout(meta)

  const isLuxury34 =
    isLuxuryThirtyFourLayout(meta)

  let colCount = Number(
    col_count || 0
  )

  let aisleCols = new Set()

  /* =========================================
    BUILD AISLE FROM LAYOUT
  ========================================= */

  if (!isLimo9) {
    const layoutGroups =
      parseLayoutGroups(layout)

    if (layoutGroups.length > 0) {
      aisleCols =
        buildAisleColumns(
          layoutGroups
        )

      if (!colCount) {
        colCount =
          layoutGroups.reduce(
            (sum, n) => sum + n,
            0
          ) +
          Math.max(
            layoutGroups.length - 1,
            0
          )
      }
    }
  }

  if (!colCount) {
    colCount = seatRows.reduce(
      (max, seat) =>
        Math.max(
          max,
          Number(
            seat.col_index || 0
          )
        ),
      0
    )
  }

  /* =========================================
    INIT FLOORS
  ========================================= */

  const floorsArr = []

  for (
    let f = 1;
    f <= floorCount;
    f++
  ) {
    const rows = []

    for (
      let r = 1;
      r <= rowCount;
      r++
    ) {
      const cols = []

      for (
        let c = 1;
        c <= colCount;
        c++
      ) {
        if (aisleCols.has(c)) {
          cols.push({
            type: "aisle"
          })
        } else {
          cols.push({
            type: "empty"
          })
        }
      }

      rows.push(cols)
    }

    floorsArr.push({
      floor: f,
      rows
    })
  }

  /* =========================================
    INSERT SEATS
  ========================================= */

  for (const seat of seatRows) {
    const floorObj = floorsArr.find(
      (f) =>
        f.floor === seat.floor
    )

    if (!floorObj) continue

    const rowIdx =
      Number(seat.row_index) - 1

    const colIdx =
      Number(seat.col_index) - 1

    if (
      !floorObj.rows[rowIdx] ||
      colIdx < 0 ||
      colIdx >= colCount
    ) {
      continue
    }

    floorObj.rows[rowIdx][colIdx] = {
      type: "seat",

      trip_seat_id:
        seat.trip_seat_id,

      seat_id: seat.seat_id,

      seat_number:
        seat.seat_number,

      label: seat.seat_number,

      floor: seat.floor,

      row_index:
        seat.row_index,

      col_index:
        seat.col_index,

      status: seat.status,

      seat_type:
        seat.seat_type,

      seat_class:
        seat.seat_class ||
        "normal",

      price_multiplier:
        Number(
          seat.price_multiplier || 1
        ),

      is_hidden:
        Boolean(seat.is_hidden),

      is_available:
        seat.status ===
        "available"
    }
  }

  /* =========================================
    DRIVER CELL
  ========================================= */

  if (
    isLimo9 &&
    floorsArr[0]?.rows?.[0]?.[0]
      ?.type === "empty"
  ) {
    floorsArr[0].rows[0][0] = {
      type: "driver",
      label: "Tài"
    }
  }

  /* =========================================
    LUXURY 34 FIX
  ========================================= */

  if (isLuxury34) {
    for (const floorObj of floorsArr) {
      const lastRow =
        floorObj.rows?.[5]

      if (!lastRow) continue

      const seatCol3 =
        lastRow[2]

      const seatCol4 =
        lastRow[3]

      if (
        seatCol3?.type === "seat" &&
        seatCol4?.type === "empty"
      ) {
        lastRow[3] = seatCol3
        lastRow[2] = {
          type: "empty"
        }
      }
    }
  }

  return floorsArr
}

module.exports = {
  buildSeatMap
}
