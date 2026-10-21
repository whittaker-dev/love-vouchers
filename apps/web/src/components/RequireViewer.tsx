import { Navigate, Outlet, useLocation } from "react-router";
import { useViewer } from "../api/hooks";
import { LoadingText } from "./StateViews";

/**
 * Gate for her pages: she must be logged in (the admin previewing also passes). The API enforces
 * the same rule; this only avoids rendering pages whose requests would all 401.
 */
export function RequireViewer() {
  const viewer = useViewer();
  const location = useLocation();

  if (viewer.isPending) return <LoadingText>Đang mở…</LoadingText>;
  if (!viewer.data) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/dang-nhap?next=${next}`} replace />;
  }
  return <Outlet />;
}
