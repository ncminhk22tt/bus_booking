import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  BusFront,
  Lock,
  Phone,
  User,
  ArrowRight,
  Ticket,
  ShieldCheck
} from "lucide-react"

import { useAuth } from "../context/AuthContext"

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()

  const rawNext = searchParams.get("next") || "/"
  const next = rawNext.startsWith("/") ? rawNext : "/"

  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  function onChange(event) {
    const { name, value } = event.target

    setForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  async function onSubmit(event) {
    event.preventDefault()

    if (form.password !== form.confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp")
      return
    }

    try {
      setLoading(true)
      setError("")
      setMessage("")

      await register({
        name: form.name,
        phone: form.phone,
        password: form.password
      })

      setMessage("Đăng ký thành công")

      setTimeout(() => {
        navigate(`/login?next=${encodeURIComponent(next)}`)
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#EAF4FF] via-white to-[#DCEEFF]">
      {/* BACKGROUND */}
      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />

      <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full overflow-hidden rounded-[36px] bg-white shadow-[0_20px_80px_rgba(37,99,235,0.18)] lg:grid-cols-2">
          
          {/* LEFT SIDE */}
          <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#0052D4] via-[#1976D2] to-[#42A5F5] p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 backdrop-blur">
                <BusFront className="h-10 w-10" />
              </div>

              <h1 className="mt-8 text-4xl font-black leading-tight">
                Đặt vé xe
                <br />
                nhanh chóng &
                <br />
                tiện lợi
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-blue-100">
                Tạo tài khoản để đặt vé, theo dõi chuyến đi và nhận ưu đãi hấp dẫn mỗi ngày.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <Ticket className="h-6 w-6" />
                </div>

                <div>
                  <p className="font-bold">Đặt vé dễ dàng</p>
                  <p className="text-sm text-blue-100">
                    Chỉ vài thao tác đơn giản
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <p className="font-bold">Thanh toán an toàn</p>
                  <p className="text-sm text-blue-100">
                    Bảo mật thông tin người dùng
                  </p>
                </div>
              </div>
            </div>

            {/* DECOR */}
            <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full border border-white/10" />
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center justify-center bg-white px-6 py-10 sm:px-10">
            <div className="w-full max-w-md">
              
              {/* MOBILE LOGO */}
              <div className="mb-8 flex flex-col items-center text-center lg:hidden">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-r from-[#0052D4] to-[#1976D2] shadow-lg">
                  <BusFront className="h-10 w-10 text-white" />
                </div>

                <h1 className="mt-5 text-3xl font-black text-slate-800">
                  Tạo tài khoản
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Đăng ký để bắt đầu đặt vé xe
                </p>
              </div>

              {/* DESKTOP TITLE */}
              <div className="hidden lg:block">
                <h2 className="text-4xl font-black text-slate-800">
                  Đăng ký
                </h2>

                <p className="mt-2 text-slate-500">
                  Chào mừng bạn đến với hệ thống đặt vé xe
                </p>
              </div>

              {/* FORM */}
              <form
                onSubmit={onSubmit}
                className="mt-8 space-y-5"
              >
                {/* NAME */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Họ và tên
                  </label>

                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1976D2]" />

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      required
                      placeholder="Nhập họ và tên"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7FBFF] pl-12 pr-4 text-slate-700 outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* PHONE */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Số điện thoại
                  </label>

                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1976D2]" />

                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      required
                      placeholder="Nhập số điện thoại"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7FBFF] pl-12 pr-4 text-slate-700 outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Mật khẩu
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1976D2]" />

                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={onChange}
                      required
                      placeholder="Nhập mật khẩu"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7FBFF] pl-12 pr-4 text-slate-700 outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* CONFIRM PASSWORD */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Xác nhận mật khẩu
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#1976D2]" />

                    <input
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={onChange}
                      required
                      placeholder="Nhập lại mật khẩu"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-[#F7FBFF] pl-12 pr-4 text-slate-700 outline-none transition-all focus:border-[#1976D2] focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                  </div>
                )}

                {/* SUCCESS */}
                {message && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                    {message}
                  </div>
                )}

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0052D4] to-[#1976D2] text-base font-black text-white shadow-xl shadow-blue-200 transition-all duration-200 hover:-translate-y-[2px] hover:shadow-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    "Đang tạo tài khoản..."
                  ) : (
                    <>
                      Đăng ký ngay
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>

                {/* LOGIN */}
                <p className="pt-2 text-center text-sm text-slate-500">
                  Đã có tài khoản?{" "}
                  <Link
                    to={`/login?next=${encodeURIComponent(next)}`}
                    className="font-bold text-[#1976D2] hover:underline"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
