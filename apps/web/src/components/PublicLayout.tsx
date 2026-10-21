import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useProfile, useUserLogout, useViewer, useVouchers } from "../api/hooks";
import { IntroContext } from "../lib/intro";
import { duration, easeOut, spring } from "../lib/motion";
import { AnimatedOutlet } from "./AnimatedOutlet";
import { IntroLoader } from "./IntroLoader";
import { OccasionLayer } from "./OccasionLayer";
import { ScrollProgress } from "./ScrollProgress";
import styles from "./PublicLayout.module.css";

const NAV_ITEMS = [
  { to: "/", label: "Voucher", icon: "💝", end: true },
  { to: "/em", label: "Về em", icon: "🌸", end: false },
  { to: "/da-chon", label: "Đã gửi", icon: "💌", end: false },
];

/** The intro plays at least this long, and waits for data up to the max so the page never pops in half-empty. */
const INTRO_MIN_MS = 1300;
const INTRO_MAX_MS = 4000;

export function PublicLayout() {
  const reduceMotion = useReducedMotion();
  const profile = useProfile();
  const vouchers = useVouchers();
  const [minElapsed, setMinElapsed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const min = window.setTimeout(() => setMinElapsed(true), INTRO_MIN_MS);
    const max = window.setTimeout(() => setTimedOut(true), INTRO_MAX_MS);
    return () => {
      window.clearTimeout(min);
      window.clearTimeout(max);
    };
  }, []);

  const dataReady = !profile.isPending && !vouchers.isPending;
  const introDone = Boolean(reduceMotion) || timedOut || (minElapsed && dataReady);

  useEffect(() => {
    if (introDone) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [introDone]);

  return (
    <IntroContext.Provider value={introDone}>
      <AnimatePresence>{!introDone && <IntroLoader key="intro" />}</AnimatePresence>
      <ScrollProgress />

      <div className={styles.shell}>
        <motion.header
          className={styles.topbar}
          initial={{ opacity: 0, y: -24 }}
          animate={introDone ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: duration.slow, ease: easeOut, delay: 0.15 }}
        >
          <div className={`container ${styles.topbarInner}`}>
            <Link to="/" className={styles.logo}>
              <motion.span
                className={styles.logoHeart}
                whileHover={{ scale: 1.25, rotate: -10 }}
                transition={spring.bouncy}
              >
                ♡
              </motion.span>
              love vouchers
            </Link>
            <nav className={styles.nav} aria-label="Điều hướng chính">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={styles.navLink}>
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span layoutId="public-nav-pill" className={styles.navPill} transition={spring.snappy} />
                      )}
                      <span className={styles.navLabel}>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <SessionControl />
          </div>
        </motion.header>

        <OccasionLayer play={introDone} />

        <main className={styles.main}>
          <AnimatedOutlet />
        </main>

        {/* Phones get app-style tabs at the bottom, within thumb reach; the top nav is hidden there. */}
        <motion.nav
          className={styles.tabBar}
          aria-label="Điều hướng chính"
          initial={{ y: 100 }}
          animate={introDone ? { y: 0 } : undefined}
          transition={{ ...spring.soft, delay: 0.3 }}
        >
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={styles.tab}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span layoutId="public-tab-pill" className={styles.tabPill} transition={spring.snappy} />
                  )}
                  <motion.span
                    className={styles.tabIcon}
                    animate={isActive ? { y: -2, scale: 1.15 } : { y: 0, scale: 1 }}
                    whileTap={{ scale: 0.85 }}
                    transition={spring.bouncy}
                  >
                    {item.icon}
                  </motion.span>
                  <span className={styles.tabLabel}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </motion.nav>

        <motion.footer
          className={styles.footer}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          làm bằng ♡, chỉ dành cho em <span className={styles.flower}>✿</span>
          <Link to="/admin" className={styles.adminLink}>
            ·
          </Link>
        </motion.footer>
      </div>
    </IntroContext.Provider>
  );
}

/** Top-right corner: her logout, or a reminder that the admin is only previewing her page. */
function SessionControl() {
  const viewer = useViewer();
  const logout = useUserLogout();
  const navigate = useNavigate();

  if (viewer.data?.role === "admin") {
    return (
      <Link to="/admin" className={styles.adminChip}>
        👀 <span className={styles.adminChipText}>Đang xem với quyền admin</span>
      </Link>
    );
  }
  return (
    <motion.button
      type="button"
      className={styles.logout}
      onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/dang-nhap", { replace: true }) })}
      disabled={logout.isPending}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.94 }}
      aria-label="Đăng xuất"
    >
      <span aria-hidden>↪</span>
      <span className={styles.logoutText}>Đăng xuất</span>
    </motion.button>
  );
}
