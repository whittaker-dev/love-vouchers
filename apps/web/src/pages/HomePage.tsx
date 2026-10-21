import { AnimatePresence, motion, useInView, useScroll, useTransform } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { useProfile, useQuota, useSendWish, useViewer, useVouchers } from "../api/hooks";
import { CountUp } from "../components/CountUp";
import { FloatingHearts } from "../components/FloatingHearts";
import { HeroArt } from "../components/HeroArt";
import { RevealText } from "../components/RevealText";
import { ScratchCard } from "../components/ScratchCard";
import { SelectionBar } from "../components/SelectionBar";
import { EmptyState, ErrorState, Skeleton } from "../components/StateViews";
import { SuccessOverlay } from "../components/SuccessOverlay";
import { VoucherCard } from "../components/VoucherCard";
import { WishForm } from "../components/WishForm";
import { daysSince } from "../lib/format";
import { useIntroDone } from "../lib/intro";
import { duration, easeOut, spring } from "../lib/motion";
import { useParallax } from "../lib/parallax";
import styles from "./HomePage.module.css";

export function HomePage() {
  const play = useIntroDone();
  const profile = useProfile();
  const vouchers = useVouchers();
  const sendWish = useSendWish();
  const quota = useQuota();
  const viewer = useViewer();

  /** Picked voucher ids, in the order she tapped them (that is the chip order). */
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sentCount, setSentCount] = useState<number | null>(null);

  const wishRef = useRef<HTMLElement>(null);
  const wishInView = useInView(wishRef, { amount: 0.2 });
  // On the section, not the grid: useInView observes once at mount, when the grid may still be skeletons.
  const vouchersRef = useRef<HTMLElement>(null);
  const vouchersInView = useInView(vouchersRef, { amount: 0.05 });
  const sectionHeadRef = useRef<HTMLDivElement>(null);
  const sectionHeadInView = useInView(sectionHeadRef, { once: true, amount: 0.6 });

  // Hero parallax: text and illustration drift up at different speeds and fade as the hero leaves.
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroTextY = useParallax(heroProgress, -80);
  const heroArtY = useParallax(heroProgress, -180);
  const heroArtRotate = useTransform(heroProgress, [0, 1], [0, -8]);
  const heroOpacity = useTransform(heroProgress, [0, 0.85], [1, 0]);

  const toggle = useCallback((id: string) => {
    sendWish.reset();
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }, [sendWish]);

  const selected = selectedIds
    .map((id) => vouchers.data?.find((voucher) => voucher.id === id))
    .filter((voucher) => voucher !== undefined);

  function submitWish() {
    sendWish.mutate(
      { voucherIds: selectedIds, message },
      {
        onSuccess: (wish) => {
          setSentCount(wish.items.length);
          setSelectedIds([]);
          setMessage("");
        },
      },
    );
  }

  const closeSuccess = useCallback(() => {
    setSentCount(null);
    document.getElementById("vouchers")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const nickname = profile.data?.nickname || profile.data?.name || "em";
  const partnerName = profile.data?.partnerName ?? "Anh";
  const anniversary = profile.data?.anniversary;
  const days = anniversary ? daysSince(anniversary) : -1;

  const enter = (delay: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: play ? { opacity: 1, y: 0 } : undefined,
    transition: { delay, duration: duration.slow, ease: easeOut },
  });

  return (
    <>
      <section ref={heroRef} className={`container ${styles.hero}`}>
        <motion.div className={styles.heroText} style={{ y: heroTextY, opacity: heroOpacity }}>
          <motion.span
            className={styles.tag}
            initial={{ opacity: 0, rotate: -12, scale: 0.6 }}
            animate={play ? { opacity: 1, rotate: -3, scale: 1 } : undefined}
            whileHover={{ rotate: 2, scale: 1.05 }}
            transition={spring.bouncy}
          >
            Một lời nhắn nhỏ <span aria-hidden>✦</span>
          </motion.span>

          <RevealText
            className={styles.heroTitle}
            text={`Một chút ngọt ngào dành riêng cho ${nickname}`}
            play={play}
            delay={0.1}
            trailing={
              <motion.span
                className={styles.envelope}
                animate={{ rotate: [0, -10, 8, -4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
              >
                💌
              </motion.span>
            }
          />

          <motion.p className={styles.heroLead} {...enter(0.7)}>
            Một menu nho nhỏ toàn những điều đáng yêu, dành cho người anh thương nhất.{" "}
            <br />
            Chọn bất cứ thứ gì làm tim em vui nhé. Yêu thì không giới hạn ♡
          </motion.p>

          <motion.div className={styles.heroActions} {...enter(0.85)}>
            <motion.a
              href="#vouchers"
              className={styles.cta}
              whileHover={{ y: -2 }}
              whileTap={{ y: 3 }}
              transition={spring.snappy}
            >
              Chọn quà của em
              <motion.span
                aria-hidden
                animate={{ y: [0, 4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                ↓
              </motion.span>
            </motion.a>
            {days >= 0 && (
              <span className={styles.days}>
                💞 <CountUp value={days} className={styles.daysNumber} /> ngày bên nhau
              </span>
            )}
          </motion.div>
          <motion.p className={styles.heroNote} {...enter(1)}>
            em xứng đáng với mọi điều ngọt ngào
          </motion.p>
        </motion.div>

        <motion.div
          className={styles.heroArtLayer}
          style={{ y: heroArtY, rotate: heroArtRotate, opacity: heroOpacity }}
        >
          <HeroArt avatarEmoji={profile.data?.avatarEmoji ?? "💖"} play={play} />
        </motion.div>
      </section>

      <div className={`container ${styles.divider}`} />

      <ScratchCard />

      <section
        ref={vouchersRef}
        id="vouchers"
        className={`container ${styles.vouchers}`}
        aria-labelledby="vouchers-heading"
      >
        <FloatingHearts target={vouchersRef} />
        <div ref={sectionHeadRef} className={styles.sectionHead}>
          <div>
            <motion.p
              className="eyebrow"
              initial={{ opacity: 0, x: -16 }}
              animate={sectionHeadInView ? { opacity: 1, x: 0 } : undefined}
              transition={{ duration: duration.base, ease: easeOut }}
            >
              Những điều ngọt ngào
            </motion.p>
            <RevealText
              as="h2"
              className={styles.sectionTitle}
              text="Menu yêu thương của em"
              play={sectionHeadInView}
              delay={0.1}
            />
            <motion.p
              className={styles.sectionLead}
              initial={{ opacity: 0, y: 10 }}
              animate={sectionHeadInView ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.45, duration: duration.base, ease: easeOut }}
            >
              Chạm vào thẻ để thêm vào danh sách ước. Chọn bao nhiêu cũng được!
            </motion.p>
          </div>
          <motion.span className={styles.counter} data-active={selectedIds.length > 0 || undefined} layout>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={selectedIds.length}
                className={styles.counterNumber}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
              >
                {selectedIds.length}
              </motion.span>
            </AnimatePresence>{" "}
            đã chọn ♡
          </motion.span>
        </div>

        {vouchers.isPending ? (
          <div className={styles.grid}>
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <Skeleton key={key} height={190} radius={19} />
            ))}
          </div>
        ) : vouchers.isError ? (
          <ErrorState error={vouchers.error} />
        ) : vouchers.data.length === 0 ? (
          <EmptyState emoji="🎁" title="Chưa có voucher nào">
            <p>{partnerName} đang chuẩn bị bất ngờ, quay lại sau nhé.</p>
          </EmptyState>
        ) : (
          <div className={styles.grid}>
            {vouchers.data.map((voucher, index) => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                selected={selectedIds.includes(voucher.id)}
                onToggle={() => toggle(voucher.id)}
                revealIndex={index}
              />
            ))}
          </div>
        )}
      </section>

      <div className={`container ${styles.wishWrap}`}>
        <WishForm
          ref={wishRef}
          selected={selected}
          message={message}
          onMessageChange={setMessage}
          onRemove={toggle}
          onSubmit={submitWish}
          sending={sendWish.isPending}
          error={sendWish.error?.message ?? null}
          quota={quota.data}
          blockedReason={
            viewer.data?.role === "admin" ? "Anh đang xem thử trang của em, chỉ em mới gửi được điều ước nha 👀" : null
          }
        />
      </div>

      <SelectionBar
        count={selectedIds.length}
        visible={vouchersInView && !wishInView}
        onClick={() => wishRef.current?.scrollIntoView({ behavior: "smooth" })}
      />
      <SuccessOverlay
        open={sentCount !== null}
        count={sentCount ?? 0}
        onClose={closeSuccess}
      />
    </>
  );
}
