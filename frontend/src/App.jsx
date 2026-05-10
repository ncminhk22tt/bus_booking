import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "./components/layout/AppLayout"
import { AdminLayout } from "./components/layout/AdminLayout"
import { SuperAdminLayout } from "./components/layout/SuperAdminLayout"
import { ProtectedRoute } from "./components/routing/ProtectedRoute"
import { AdminProtectedRoute } from "./components/routing/AdminProtectedRoute"
import { SuperAdminProtectedRoute } from "./components/routing/SuperAdminProtectedRoute"
import { HomePage } from "./pages/HomePage"
import { LoginPage } from "./pages/LoginPage"
import { RegisterPage } from "./pages/RegisterPage"
import { SearchResultsPage } from "./pages/SearchResultsPage"
import { TripDetailPage } from "./pages/TripDetailPage"
import { BookingHistoryPage } from "./pages/BookingHistoryPage"
import { ProfilePage } from "./pages/ProfilePage"
import { AdminLoginPage } from "./pages/admin/AdminLoginPage"
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage"
import { SuperAdminLoginPage } from "./pages/superadmin/SuperAdminLoginPage"
import { SuperAdminDashboardPage } from "./pages/superadmin/SuperAdminDashboardPage"

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/trip/:id" element={<TripDetailPage />} />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <BookingHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route path="login" element={<AdminLoginPage />} />
        <Route
          index
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />
      </Route>

      <Route path="/super-admin" element={<SuperAdminLayout />}>
        <Route path="login" element={<SuperAdminLoginPage />} />
        <Route
          index
          element={
            <SuperAdminProtectedRoute>
              <SuperAdminDashboardPage />
            </SuperAdminProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
