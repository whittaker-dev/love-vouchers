import { createBrowserRouter } from "react-router";
import { AdminLayout } from "./components/AdminLayout";
import { PublicLayout } from "./components/PublicLayout";
import { RequireAdmin } from "./components/RequireAdmin";
import { RequireViewer } from "./components/RequireViewer";
import { AboutPage } from "./pages/AboutPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { UserLoginPage } from "./pages/UserLoginPage";
import { AccountPage } from "./pages/admin/AccountPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { NotificationsPage } from "./pages/admin/NotificationsPage";
import { OccasionsPage } from "./pages/admin/OccasionsPage";
import { ProfileEditPage } from "./pages/admin/ProfileEditPage";
import { VoucherEditPage } from "./pages/admin/VoucherEditPage";
import { VouchersPage } from "./pages/admin/VouchersPage";

export const router = createBrowserRouter([
  { path: "/dang-nhap", element: <UserLoginPage /> },
  {
    // Her side: needs her login (or the admin, previewing).
    element: <RequireViewer />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/em", element: <AboutPage /> },
          { path: "/da-chon", element: <HistoryPage /> },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
  { path: "/admin/login", element: <LoginPage /> },
  {
    path: "/admin",
    element: <RequireAdmin />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <VouchersPage /> },
          { path: "vouchers/new", element: <VoucherEditPage /> },
          { path: "vouchers/:id", element: <VoucherEditPage /> },
          { path: "notifications", element: <NotificationsPage /> },
          { path: "occasions", element: <OccasionsPage /> },
          { path: "profile", element: <ProfileEditPage /> },
          { path: "account", element: <AccountPage /> },
        ],
      },
    ],
  },
]);
