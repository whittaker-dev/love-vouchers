import { Link } from "react-router";
import { buttonClassName } from "../components/Button";
import { EmptyState } from "../components/StateViews";

export function NotFoundPage() {
  return (
    <div className="container" style={{ paddingTop: "var(--space-16)" }}>
      <EmptyState emoji="🫣" title="Trang này không tồn tại">
        <Link to="/" className={buttonClassName("ghost", "sm")}>
          Về trang chủ
        </Link>
      </EmptyState>
    </div>
  );
}
