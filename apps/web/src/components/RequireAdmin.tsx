import { Navigate, Outlet, useLocation } from "react-router";
import { useMe } from "../api/hooks";
import { LoadingText } from "./StateViews";

/** Gate for /admin routes. The API enforces auth too; this only avoids rendering a page that would 401. */
export function RequireAdmin() {
  const me = useMe();
  const location = useLocation();

  if (me.isPending) return <LoadingText>Đang kiểm tra đăng nhập…</LoadingText>;
  if (!me.data) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?next=${next}`} replace />;
  }
  return <Outlet />;
}
