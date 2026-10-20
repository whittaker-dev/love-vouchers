import { createBrowserRouter } from "react-router";
import { AdminLayout } from "./components/AdminLayout";
import { PublicLayout } from "./components/PublicLayout";
import { RequireAdmin } from "./components/RequireAdmin";
import { AboutPage } from "./pages/AboutPage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AccountPage } from "./pages/admin/AccountPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { ProfileEditPage } from "./pages/admin/ProfileEditPage";
import { NotificationsPage } from "./pages/admin/NotificationsPage";
import { VoucherEditPage } from "./pages/admin/VoucherEditPage";
import { VouchersPage } from "./pages/admin/VouchersPage";

export const router = createBrowserRouter([
  {
    // Girlfriend's side: public, no login.
    element: <PublicLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/em", element: <AboutPage /> },
      { path: "/da-chon", element: <HistoryPage /> },
      { path: "*", element: <NotFoundPage /> },
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
          { path: "profile", element: <ProfileEditPage /> },
          { path: "account", element: <AccountPage /> },
        ],
      },
    ],
  },
]);
