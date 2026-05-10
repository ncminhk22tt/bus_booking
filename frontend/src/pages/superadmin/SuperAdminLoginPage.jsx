import { useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useSuperAdminAuth } from "../../context/SuperAdminAuthContext"

export function SuperAdminLoginPage() {
  const { login } = useSuperAdminAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get("next") || "/super-admin"

  const [form, setForm] = useState({ phone: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  function onChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    try {
      setLoading(true)
      setError("")
      await login(form.phone, form.password)
      navigate(next, { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <h1 className="font-display text-3xl text-slate-900">Đăng nhập Super Admin</h1>
      <p className="mt-2 text-sm text-slate-600">Quản trị hệ thống admin, nhà xe và phân quyền.</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Số điện thoại</span>
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-700">Mật khẩu</span>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
          />
        </label>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-500 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  )
}
