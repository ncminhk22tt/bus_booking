import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate
} from "react-router-dom"

import {
  Bus,
  User,
  Ticket,
  Phone,
  LogOut,
  Menu
} from "lucide-react"

import { useAuth } from "../../context/AuthContext"

function navClass({ isActive }) {
  return [
    "relative rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200",
    isActive
      ? "bg-[#eff6ff] text-[#2563eb]"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  ].join(" ")
}

export function AppLayout() {
  const {
    isAuthenticated,
    profile,
    logout
  } = useAuth()

  const location = useLocation()
  const navigate = useNavigate()

  const isSearchPage =
    location.pathname === "/search"

  const hideHeader =
    location.pathname === "/login" ||
    location.pathname === "/register"

  const nextUrl = `${location.pathname}${location.search}`

  function handleLogout() {
    logout()
    navigate("/login", {
      replace: true
    })
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* HEADER */}
      {!hideHeader && (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-[76px] items-center justify-between px-4 md:px-8">
            {/* LEFT */}
            <div className="flex items-center gap-10">
              {/* LOGO */}
              <Link
                to="/"
                className="flex items-center gap-2"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2563eb] shadow-sm">
                  <Bus
                    className="text-white"
                    size={22}
                  />
                </div>

                <div>
                  <p className="text-2xl font-extrabold text-[#2563eb]">
                    vexeClone
                  </p>

                  <p className="-mt-1 text-xs text-slate-500">
                    Đặt vé xe online
                  </p>
                </div>
              </Link>

              {/* NAVIGATION */}
              <nav className="hidden items-center gap-2 lg:flex">
                <NavLink
                  to="/"
                  className={navClass}
                >
                  Tìm chuyến
                </NavLink>

                {isAuthenticated && (
                  <>
                    <NavLink
                      to="/bookings"
                      className={navClass}
                    >
                      <div className="flex items-center gap-2">
                        <Ticket size={16} />
                        Vé của tôi
                      </div>
                    </NavLink>

                    <NavLink
                      to="/profile"
                      className={navClass}
                    >
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        Tài khoản
                      </div>
                    </NavLink>
                  </>
                )}
              </nav>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3">
              {/* HOTLINE */}
              <div className="hidden items-center gap-2 rounded-2xl bg-[#eff6ff] px-4 py-2 lg:flex">
                <Phone
                  size={16}
                  className="text-[#2563eb]"
                />

                <span className="text-sm font-semibold text-[#2563eb]">
                  1900 0000
                </span>
              </div>

              {/* USER */}
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 md:flex">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eff6ff]">
                      <User
                        size={18}
                        className="text-[#2563eb]"
                      />
                    </div>

                    <div className="leading-tight">
                      <p className="text-sm font-bold text-slate-800">
                        {profile?.name ||
                          "Tài khoản"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {profile?.phone}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/login?next=${encodeURIComponent(
                      nextUrl
                    )}`}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Đăng nhập
                  </Link>

                  <Link
                    to={`/register?next=${encodeURIComponent(
                      nextUrl
                    )}`}
                    className="rounded-2xl bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}

              {/* MOBILE MENU */}
              <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white lg:hidden">
                <Menu size={20} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* LOGIN / REGISTER BACK BUTTON */}
      {hideHeader && (
        <div className="fixed right-4 top-4 z-50 md:right-8 md:top-6">
          <Link
            to="/"
            className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            ← Quay về trang chủ
          </Link>
        </div>
      )}

      {/* MAIN */}
      <main
        className={`px-4 py-6 md:px-8 ${
          isSearchPage
            ? "h-[calc(100vh-76px)] overflow-hidden"
            : ""
        }`}
      >
        <div className="mx-auto max-w-[1600px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
