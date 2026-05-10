function generateSeatLabel(row, col) {

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

  const rowLetter = letters[row - 1]

  return `${rowLetter}${col}`

}

module.exports = {
  generateSeatLabel
}