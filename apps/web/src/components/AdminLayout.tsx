import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { useAdminWishes, useLogout, useMe } from "../api/hooks";
import { spring } from "../lib/motion";
import { AnimatedOutlet } from "./AnimatedOutlet";
import { Button } from "./Button";
import styles from "./AdminLayout.module.css";

const TABS = [
  { to: "/admin", label: "Voucher", end: true },
  { to: "/admin/notifications", label: "Thông báo", end: false },
  { to: "/admin/occasions", label: "Dịp lễ", end: false },
  { to: "/admin/profile", label: "Hồ sơ em", end: false },
  { to: "/admin/account", label: "Tài khoản", end: false },
];

export function AdminLayout() {
  const me = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const wishes = useAdminWishes();
  // Every item that still exists is waiting: handled ones are deleted.
  const pendingCount = wishes.data?.reduce((total, wish) => total + wish.items.length, 0) ?? 0;

  // On phones the tab row scrolls sideways; keep the current tab in view after navigating.
  const tabsRef = useRef<HTMLElement>(null);
  const location = useLocation();
  useEffect(() => {
    tabsRef.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [location.pathname]);

  function handleLogout() {
    logout.mutate(undefined, { onSuccess: () => navigate("/admin/login", { replace: true }) });
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={`container ${styles.top}`}>
          <Link to="/admin" className={styles.brand}>
            <motion.span className={styles.brandHeart} whileHover={{ scale: 1.25, rotate: -10 }} transition={spring.bouncy}>
              ♡
            </motion.span>
            love vouchers <span className={styles.badge}>Quản trị</span>
          </Link>
          <div className={styles.actions}>
            <span className={styles.who}>{me.data?.email}</span>
            <Link to="/" className={styles.viewSite} target="_blank">
              <span className={styles.viewSiteLong}>Xem trang của em</span>
              <span className={styles.viewSiteShort}>Trang em</span> ↗
            </Link>
            <Button size="sm" variant="secondary" onClick={handleLogout} loading={logout.isPending}>
              Đăng xuất
            </Button>
          </div>
        </div>
        <nav ref={tabsRef} className={`container ${styles.tabs}`} aria-label="Quản trị">
          {TABS.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className={styles.tab}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span layoutId="admin-tab" className={styles.tabActive} transition={spring.snappy} />
                  )}
                  <span className={styles.tabLabel}>
                    {tab.label}
                    <AnimatePresence>
                      {tab.to === "/admin/notifications" && pendingCount > 0 && (
                        <motion.span
                          key={pendingCount}
                          className={styles.count}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={spring.bouncy}
                        >
                          {pendingCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className={`container ${styles.main}`}>
        <AnimatedOutlet />
      </main>
    </div>
  );
}
