import { useEffect, useState } from "react"
import { User, Phone, LockKeyhole, Save, ShieldCheck } from "lucide-react"
import { api } from "../lib/api"
import { useAuth } from "../context/AuthContext"
import { formatDateTime } from "../lib/formatters"

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth()

  const [infoForm, setInfoForm] = useState({
    name: "",
    phone: ""
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: ""
  })

  const [infoMessage, setInfoMessage] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [error, setError] = useState("")

  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    setInfoForm({
      name: profile?.name || "",
      phone: profile?.phone || ""
    })
  }, [profile])

  async function saveInfo(event) {
    event.preventDefault()

    try {
      setSavingInfo(true)
      setError("")
      setInfoMessage("")

      await api.updateProfile(infoForm)
      await refreshProfile()

      setInfoMessage("Cập nhật thông tin thành công")
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingInfo(false)
    }
  }

  async function savePassword(event) {
    event.preventDefault()

    try {
      setSavingPassword(true)
      setError("")
      setPasswordMessage("")

      await api.changePassword(passwordForm)

      setPasswordForm({
        current_password: "",
        new_password: ""
      })

      setPasswordMessage("Đổi mật khẩu thành công")
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100">
              <User className="text-[#2563eb]" size={34} />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">
                {profile?.name || "Tài khoản"}
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Thành viên từ{" "}
                {profile?.created_at
                  ? formatDateTime(profile.created_at)
                  : "--"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-[#eff6ff] px-4 py-3 text-sm font-medium text-[#1d4ed8]">
            Quản lý thông tin tài khoản
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* THÔNG TIN */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2">
              <User className="text-[#2563eb]" size={20} />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Thông tin cá nhân
              </h2>

              <p className="text-sm text-slate-500">
                Cập nhật thông tin của bạn
              </p>
            </div>
          </div>

          <form onSubmit={saveInfo} className="space-y-4">
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
                  value={infoForm.name}
                  onChange={(e) =>
                    setInfoForm((prev) => ({
                      ...prev,
                      name: e.target.value
                    }))
                  }
                  placeholder="Nhập họ và tên"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 outline-none transition focus:border-[#2563eb] focus:bg-white"
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
                  value={infoForm.phone}
                  onChange={(e) =>
                    setInfoForm((prev) => ({
                      ...prev,
                      phone: e.target.value
                    }))
                  }
                  placeholder="Nhập số điện thoại"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 outline-none transition focus:border-[#2563eb] focus:bg-white"
                />
              </div>
            </div>

            {infoMessage && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {infoMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={savingInfo}
              className="flex items-center gap-2 rounded-2xl bg-[#2563eb] px-5 py-3 font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              <Save size={18} />

              {savingInfo ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </form>
        </section>

        {/* ĐỔI MẬT KHẨU */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-yellow-100 p-2">
              <ShieldCheck className="text-yellow-600" size={20} />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Bảo mật tài khoản
              </h2>

              <p className="text-sm text-slate-500">
                Thay đổi mật khẩu đăng nhập
              </p>
            </div>
          </div>

          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mật khẩu hiện tại
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      current_password: e.target.value
                    }))
                  }
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 outline-none transition focus:border-[#2563eb] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mật khẩu mới
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      new_password: e.target.value
                    }))
                  }
                  placeholder="Nhập mật khẩu mới"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 outline-none transition focus:border-[#2563eb] focus:bg-white"
                />
              </div>
            </div>

            {passwordMessage && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {passwordMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-2 rounded-2xl bg-[#facc15] px-5 py-3 font-semibold text-slate-900 transition hover:bg-[#eab308] disabled:opacity-60"
            >
              <ShieldCheck size={18} />

              {savingPassword
                ? "Đang cập nhật..."
                : "Đổi mật khẩu"}
            </button>
          </form>
        </section>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}
