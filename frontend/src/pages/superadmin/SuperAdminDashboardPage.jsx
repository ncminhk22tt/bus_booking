import { useEffect, useState } from "react"
import { Building2, BusFront, Lock, ShieldCheck, Trash2, Unlock } from "lucide-react"
import { superAdminApi } from "../../lib/superAdminApi"

const sections = [
  { key: "create-admin", label: "Tạo admin", desc: "Tạo tài khoản admin và nhà xe", icon: ShieldCheck },
  { key: "companies", label: "Quản lý nhà xe", desc: "Theo dõi, khóa/mở và xóa nhà xe", icon: Building2 },
  { key: "bus-types", label: "Loại xe & layout", desc: "Super Admin tự khai báo sơ đồ ghế", icon: BusFront }
]

function SectionCard({ title, children, className = "", bodyClassName = "" }) {
  return (
    <section className={`flex flex-col rounded-2xl border border-blue-100 bg-white p-4 shadow-card ${className}`}>
      <h3 className="text-lg font-bold text-slate-900">{title}</h3>
      <div className={`mt-3 ${bodyClassName}`}>{children}</div>
    </section>
  )
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  )
}

function makeGrid(floors, rows, cols) {
  return Array.from({ length: floors }, (_, floorIdx) => ({
    floor: floorIdx + 1,
    rows: Array.from({ length: rows }, (_, rowIdx) => ({
      row: rowIdx + 1,
      cols: Array.from({ length: cols }, () => false)
    }))
  }))
}

export function SuperAdminDashboardPage() {
  const [activeSection, setActiveSection] = useState("create-admin")
  const [overview, setOverview] = useState({
    total_admins: 0,
    active_admins: 0,
    total_companies: 0,
    active_companies: 0
  })
  const [companies, setCompanies] = useState([])
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [pendingToggleCompany, setPendingToggleCompany] = useState(null)
  const [pendingDeleteCompany, setPendingDeleteCompany] = useState(null)

  const [createForm, setCreateForm] = useState({
    phone: "",
    password: "",
    company_name: "",
    address: ""
  })

  const [busTypeForm, setBusTypeForm] = useState({
    name: "",
    description: "",
    seat_type: "seat"
  })
  const [gridShape, setGridShape] = useState({ floors: 1, rows: 10, cols: 5 })
  const [gridInput, setGridInput] = useState({ floors: "1", rows: "10", cols: "5" })
  const [seatGrid, setSeatGrid] = useState(() => makeGrid(1, 10, 5))
  const [activeFloorIndex, setActiveFloorIndex] = useState(0)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setError("")
      const [overviewData, companyRows] = await Promise.all([
        superAdminApi.getOverview(),
        superAdminApi.getCompanies()
      ])
      setOverview(overviewData)
      setCompanies(companyRows)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCreateAdmin(event) {
    event.preventDefault()
    try {
      setBusy(true)
      setError("")
      setMessage("")
      await superAdminApi.createAdmin(createForm)
      setMessage("Tạo admin thành công")
      setCreateForm({ phone: "", password: "", company_name: "", address: "" })
      await loadData()
      setActiveSection("companies")
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateBusType(event) {
    event.preventDefault()
    try {
      setBusy(true)
      setError("")
      setMessage("")
      const seatMapTemplate = {
        floors: seatGrid.map((floorItem) => ({
          floor: floorItem.floor,
          rows: floorItem.rows.map((rowItem) => ({
            row: rowItem.row,
            seat_cols: rowItem.cols
              .map((checked, idx) => (checked ? idx + 1 : null))
              .filter(Boolean)
          }))
        }))
      }
      await superAdminApi.createBusType({
        ...busTypeForm,
        floors: gridShape.floors,
        row_count: gridShape.rows,
        col_count: gridShape.cols,
        layout: String(gridShape.cols),
        seat_map_template: seatMapTemplate
      })
      setMessage("Tạo loại xe thành công")
      setBusTypeForm({ name: "", description: "", seat_type: "seat" })
      setGridShape({ floors: 1, rows: 10, cols: 5 })
      setGridInput({ floors: "1", rows: "10", cols: "5" })
      setSeatGrid(makeGrid(1, 10, 5))
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function rebuildGrid(next) {
    const normalized = {
      floors: Math.max(1, Number(next.floors || 1)),
      rows: Math.max(1, Number(next.rows || 1)),
      cols: Math.max(1, Number(next.cols || 1))
    }
    setGridShape(normalized)
    setSeatGrid((prev) => {
      const nextGrid = makeGrid(normalized.floors, normalized.rows, normalized.cols)
      for (let f = 0; f < normalized.floors; f++) {
        for (let r = 0; r < normalized.rows; r++) {
          for (let c = 0; c < normalized.cols; c++) {
            nextGrid[f].rows[r].cols[c] = Boolean(prev?.[f]?.rows?.[r]?.cols?.[c])
          }
        }
      }
      return nextGrid
    })
    setActiveFloorIndex((prev) => Math.min(prev, normalized.floors - 1))
  }

  function handleGridInputChange(field, value) {
    if (!/^\d*$/.test(value)) return
    setGridInput((prev) => ({ ...prev, [field]: value }))

    // Cập nhật lưới ngay khi nhập số hợp lệ, tránh lệch giữa input và danh sách hàng.
    if (value !== "") {
      const parsed = Number(value)
      if (Number.isInteger(parsed) && parsed > 0) {
        rebuildGrid({ ...gridShape, [field]: parsed })
      }
    }
  }

  function commitGridInput(field) {
    const raw = gridInput[field]
    const parsed = Number(raw)
    const safeValue = Number.isInteger(parsed) && parsed > 0 ? parsed : gridShape[field]
    const nextShape = { ...gridShape, [field]: safeValue }
    setGridInput((prev) => ({ ...prev, [field]: String(safeValue) }))
    rebuildGrid(nextShape)
  }

  function toggleSeatCell(floorIdx, rowIdx, colIdx) {
    setSeatGrid((prev) => {
      const clone = prev.map((floorItem) => ({
        ...floorItem,
        rows: floorItem.rows.map((rowItem) => ({ ...rowItem, cols: [...rowItem.cols] }))
      }))
      clone[floorIdx].rows[rowIdx].cols[colIdx] = !clone[floorIdx].rows[rowIdx].cols[colIdx]

      // Auto-copy tầng 1 lên các tầng trên.
      if (floorIdx === 0 && clone.length > 1) {
        for (let i = 1; i < clone.length; i++) {
          clone[i].rows = clone[0].rows.map((rowItem) => ({
            ...rowItem,
            cols: [...rowItem.cols]
          }))
        }
      }

      return clone
    })
  }

  function setRowSeatCount(floorIdx, rowIdx, countRaw) {
    const count = Math.max(0, Math.min(gridShape.cols, Number(countRaw || 0)))
    setSeatGrid((prev) => {
      const clone = prev.map((floorItem) => ({
        ...floorItem,
        rows: floorItem.rows.map((rowItem) => ({ ...rowItem, cols: [...rowItem.cols] }))
      }))
      clone[floorIdx].rows[rowIdx].cols = clone[floorIdx].rows[rowIdx].cols.map((_, colIdx) => colIdx < count)

      // Auto-copy tầng 1 lên các tầng trên.
      if (floorIdx === 0 && clone.length > 1) {
        for (let i = 1; i < clone.length; i++) {
          clone[i].rows = clone[0].rows.map((rowItem) => ({
            ...rowItem,
            cols: [...rowItem.cols]
          }))
        }
      }

      return clone
    })
  }

  async function toggleCompanyStatus(company) {
    try {
      setBusy(true)
      setError("")
      setMessage("")
      await superAdminApi.setCompanyActive(company.id, !Number(company.is_active))
      setMessage("Đã cập nhật trạng thái nhà xe")
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmToggleCompany() {
    if (!pendingToggleCompany) return
    await toggleCompanyStatus(pendingToggleCompany)
    setPendingToggleCompany(null)
  }

  async function confirmDeleteCompany() {
    if (!pendingDeleteCompany) return

    try {
      setBusy(true)
      setError("")
      setMessage("")
      await superAdminApi.deleteCompany(pendingDeleteCompany.id)
      setMessage(`Đã xóa nhà xe ${pendingDeleteCompany.name}`)
      setPendingDeleteCompany(null)
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="min-h-0 space-y-3 overflow-auto pr-1">
        <SectionCard title="Quản lý Super Admin">
          <p className="text-sm text-slate-600">Tối ưu thao tác quản trị toàn hệ thống.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <StatTile label="Tổng admin" value={overview.total_admins} />
            <StatTile label="Admin hoạt động" value={overview.active_admins} />
            <StatTile label="Tổng nhà xe" value={overview.total_companies} />
            <StatTile label="Nhà xe hoạt động" value={overview.active_companies} />
          </div>
        </SectionCard>

        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.key
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => setActiveSection(section.key)}
              className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                isActive
                  ? "border-blue-300 bg-blue-100/60"
                  : "border-blue-100 bg-white hover:border-blue-200 hover:bg-blue-50"
              }`}
            >
              <span className={`rounded-xl p-3 ${isActive ? "bg-brand-500 text-white" : "bg-blue-100 text-brand-600"}`}>
                <Icon size={18} />
              </span>
              <span className="flex-1">
                <span className="block text-xl font-bold text-slate-900">{section.label}</span>
                <span className="block text-sm text-slate-600">{section.desc}</span>
              </span>
            </button>
          )
        })}
      </aside>

      <main className="min-h-0 overflow-hidden">
        {activeSection === "create-admin" && (
          <SectionCard title="Tạo tài khoản admin mới" className="h-full" bodyClassName="h-full min-h-0">
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
              <form onSubmit={handleCreateAdmin} className="grid gap-3 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Số điện thoại admin</span>
                  <input value={createForm.phone} onChange={(e) => setCreateForm((prev) => ({ ...prev, phone: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3" required />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Mật khẩu</span>
                  <input type="password" value={createForm.password} onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3" required />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Tên nhà xe</span>
                  <input value={createForm.company_name} onChange={(e) => setCreateForm((prev) => ({ ...prev, company_name: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Địa chỉ</span>
                  <input value={createForm.address} onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
                </label>
                <button type="submit" disabled={busy} className="md:col-span-2 h-11 rounded-xl bg-brand-500 px-4 font-semibold text-white disabled:opacity-60">Tạo admin</button>
              </form>
            </div>
          </SectionCard>
        )}

        {activeSection === "companies" && (
          <SectionCard title="Quản lý nhà xe" className="h-full" bodyClassName="h-full min-h-0">
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-3 text-sm text-slate-700">
                Tổng nhà xe: <b>{overview.total_companies}</b> | Hoạt động: <b>{overview.active_companies}</b>
              </div>
              <div className="min-h-0 overflow-auto rounded-xl border border-slate-200">
                {companies.length === 0 ? (
                  <div className="px-4 py-4 text-center text-sm text-slate-500">Chưa có nhà xe nào.</div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {companies.map((company, index) => (
                      <article key={company.id} className={`px-4 py-4 ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-[220px] flex-1">
                            <p className="font-bold text-slate-900">#{company.id} - {company.name}</p>
                            <p className="text-sm text-slate-600">SĐT: {company.phone || "--"}</p>
                            <p className="text-sm text-slate-600">Địa chỉ: {company.address || "--"}</p>
                            <p className="text-sm text-slate-600">Số admin: {company.admin_count || 0}</p>
                          </div>
                          <div className="w-full max-w-[180px]">
                            <div className="flex flex-col gap-2">
                              <button type="button" onClick={() => setPendingToggleCompany(company)} className={`inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${Number(company.is_active) ? "bg-emerald-600" : "bg-orange-500"}`}>
                                {Number(company.is_active) ? <Lock size={13} /> : <Unlock size={13} />}
                                {Number(company.is_active) ? "Đang mở" : "Đang khóa"}
                              </button>
                              <button type="button" onClick={() => setPendingDeleteCompany(company)} className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white">
                                <Trash2 size={13} /> Xóa nhà xe
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>
        )}

        {activeSection === "bus-types" && (
          <SectionCard title="Khai báo loại xe và sơ đồ ghế" className="h-full" bodyClassName="h-full min-h-0">
            <div className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4">
              <form onSubmit={handleCreateBusType} className="sticky top-0 z-20 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Tên loại xe</span>
                  <input value={busTypeForm.name} onChange={(e) => setBusTypeForm((prev) => ({ ...prev, name: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3" required />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Loại ghế</span>
                  <select value={busTypeForm.seat_type} onChange={(e) => setBusTypeForm((prev) => ({ ...prev, seat_type: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3">
                    <option value="seat">seat</option>
                    <option value="bed">bed</option>
                    <option value="vip">vip</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Số tầng</span>
                  <input
                    type="number"
                    min={1}
                    value={gridInput.floors}
                    onChange={(e) => handleGridInputChange("floors", e.target.value)}
                    onBlur={() => commitGridInput("floors")}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Số hàng</span>
                  <input
                    type="number"
                    min={1}
                    value={gridInput.rows}
                    onChange={(e) => handleGridInputChange("rows", e.target.value)}
                    onBlur={() => commitGridInput("rows")}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-semibold text-slate-700">Số cột</span>
                  <input
                    type="number"
                    min={1}
                    value={gridInput.cols}
                    onChange={(e) => handleGridInputChange("cols", e.target.value)}
                    onBlur={() => commitGridInput("cols")}
                    className="h-11 w-full rounded-xl border border-slate-200 px-3"
                    required
                  />
                </label>
                <label className="block text-sm md:col-span-2">
                  <span className="mb-1 block font-semibold text-slate-700">Mô tả</span>
                  <input value={busTypeForm.description} onChange={(e) => setBusTypeForm((prev) => ({ ...prev, description: e.target.value }))} className="h-11 w-full rounded-xl border border-slate-200 px-3" />
                </label>
                <button type="submit" disabled={busy} className="md:col-span-2 h-11 rounded-xl bg-brand-500 px-4 font-semibold text-white disabled:opacity-60">Tạo loại xe</button>
              </form>

              <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="z-10 bg-slate-50">
                  <p className="text-sm font-semibold text-slate-700">Xếp hình ghế: bấm vào ô để bật/tắt ghế</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.from({ length: gridShape.floors }, (_, idx) => (
                      <button
                        key={`floor-tab-${idx + 1}`}
                        type="button"
                        onClick={() => setActiveFloorIndex(idx)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          activeFloorIndex === idx
                            ? "bg-brand-500 text-white"
                            : "border border-slate-300 bg-white text-slate-700"
                        }`}
                      >
                        Tầng {idx + 1}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Khi chỉnh tầng 1, hệ thống tự động copy sơ đồ lên các tầng trên.
                  </p>
                </div>
                <div className="mt-3 min-h-0 overflow-y-auto pr-1">
                  <div className="space-y-3 pb-4">
                  {seatGrid
                    .filter((_, floorIdx) => floorIdx === activeFloorIndex)
                    .map((floorItem, floorIdxFiltered) => {
                      const floorIdx = activeFloorIndex + floorIdxFiltered
                      return (
                    <div key={`grid-floor-${floorItem.floor}`} className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="mb-2 text-sm font-bold text-slate-700">Tầng {floorItem.floor}</p>
                      <div className="space-y-1">
                        {floorItem.rows.map((rowItem, rowIdx) => (
                          <div key={`grid-row-${floorItem.floor}-${rowItem.row}`} className="rounded-md border border-slate-200 bg-slate-50 p-2">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-slate-600">Hàng {rowItem.row}</span>
                              <label className="flex items-center gap-2 text-xs text-slate-600">
                                <span>Số ghế</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={gridShape.cols}
                                  value={rowItem.cols.filter(Boolean).length}
                                  onChange={(e) => setRowSeatCount(floorIdx, rowIdx, e.target.value)}
                                  className="h-7 w-16 rounded border border-slate-300 px-2 text-center text-xs"
                                />
                              </label>
                            </div>
                            <div className="flex gap-1">
                              {rowItem.cols.map((checked, colIdx) => (
                                <button
                                  key={`grid-cell-${floorItem.floor}-${rowItem.row}-${colIdx + 1}`}
                                  type="button"
                                  onClick={() => toggleSeatCell(floorIdx, rowIdx, colIdx)}
                                  className={`h-7 w-7 rounded border text-[11px] font-semibold ${
                                    checked ? "border-brand-600 bg-brand-500 text-white" : "border-slate-300 bg-white text-slate-500"
                                  }`}
                                  title={`Hàng ${rowItem.row}, cột ${colIdx + 1}`}
                                >
                                  {colIdx + 1}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                      )
                    })}
                  </div>
                </div>
              </div>

            </div>
          </SectionCard>
        )}
      </main>

      {(message || error) && (
        <div className="fixed bottom-4 right-4 z-50 flex w-[min(92vw,360px)] flex-col gap-2">
          {message && <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 shadow-lg">{message}</div>}
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 shadow-lg">{error}</div>}
        </div>
      )}

      {pendingDeleteCompany && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa nhà xe</h3>
            <p className="mt-2 text-sm text-slate-600">Bạn có chắc muốn xóa nhà xe <b>{pendingDeleteCompany.name}</b> không?</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingDeleteCompany(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Hủy</button>
              <button type="button" onClick={confirmDeleteCompany} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white" disabled={busy}>{busy ? "Đang xóa..." : "Xóa nhà xe"}</button>
            </div>
          </div>
        </div>
      )}

      {pendingToggleCompany && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Xác nhận cập nhật trạng thái</h3>
            <p className="mt-2 text-sm text-slate-600">Bạn có chắc muốn {Number(pendingToggleCompany.is_active) ? <b>khóa</b> : <b>mở</b>} nhà xe <b>{pendingToggleCompany.name}</b> không?</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setPendingToggleCompany(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Hủy</button>
              <button type="button" onClick={confirmToggleCompany} className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${Number(pendingToggleCompany.is_active) ? "bg-emerald-600" : "bg-orange-500"}`} disabled={busy}>{busy ? "Đang xử lý..." : Number(pendingToggleCompany.is_active) ? "Xác nhận khóa" : "Xác nhận mở"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
