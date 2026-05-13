function generateSeatLabel(row, col, floor = 1) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const rowLetter = letters[row - 1] || String(row)
  const baseLabel = `${rowLetter}${col}`

  if (!Number.isInteger(floor) || floor <= 1) {
    return baseLabel
  }

  return `F${floor}${baseLabel}`
}

module.exports = {
  generateSeatLabel
}