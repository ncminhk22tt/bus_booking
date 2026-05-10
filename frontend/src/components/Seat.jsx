function classBySeat(seat, isSelected) {
  if (seat.status === "Booked") {
    return "border-slate-300 bg-slate-200 text-slate-400"
  }
  if (isSelected || seat.status === "Selecting") {
    return "border-emerald-500 bg-emerald-500 text-white"
  }
  if (seat.type === "VIP") {
    return "border-amber-500 bg-amber-50 text-amber-700"
  }
  return "border-slate-300 bg-white text-slate-700"
}

export default function Seat({ seat, isSelected, onClick }) {
  const disabled = seat.status === "Booked"

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onClick?.(seat)}
      className={[
        "relative h-12 w-10 rounded-md border-2 text-[11px] font-bold transition md:h-14 md:w-11",
        classBySeat(seat, isSelected),
        disabled ? "cursor-not-allowed" : "hover:-translate-y-0.5"
      ].join(" ")}
      title={`${seat.seat_number} - ${seat.status}`}
    >
      {disabled ? "X" : seat.seat_number}
    </button>
  )
}
