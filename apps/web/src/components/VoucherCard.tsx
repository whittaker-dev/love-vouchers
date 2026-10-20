import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import type { VoucherDto } from "@love/shared";
import { formatDate } from "../lib/format";
import { duration, easeOut, spring } from "../lib/motion";
import styles from "./VoucherCard.module.css";

export type VoucherCardData = Pick<
  VoucherDto,
  "title" | "description" | "emoji" | "value" | "color" | "remaining" | "expiresAt"
>;

interface VoucherCardProps {
  voucher: VoucherCardData;
  selected?: boolean;
  /** Present on the girlfriend's page; absent for the static admin preview. */
  onToggle?: () => void;
  /**
   * Position in the grid. When set, the card animates in on its own as it scrolls into view
   * (alternating tilt, small per-column delay), instead of the whole grid firing at once.
   */
  revealIndex?: number;
}

export function voucherUsageLabel(remaining: number | null): string {
  if (remaining === null) return "Không giới hạn";
  if (remaining === 0) return "Hết lượt";
  return `Còn ${remaining} lượt`;
}

/**
 * Selectable voucher card. Tapping toggles it into the wish list: the card sinks into its
 * offset shadow, the check pops in, and the emoji does a little hop.
 */
export function VoucherCard({ voucher, selected = false, onToggle, revealIndex }: VoucherCardProps) {
  const soldOut = voucher.remaining === 0;
  const interactive = Boolean(onToggle) && !soldOut;
  const emojiControls = useAnimationControls();

  function handleClick() {
    if (!interactive) return;
    void emojiControls.start(
      selected
        ? { scale: [1, 0.8, 1], transition: { duration: 0.35 } }
        : { y: [0, -14, 0], rotate: [0, -12, 8, 0], scale: [1, 1.25, 1], transition: { duration: 0.5 } },
    );
    onToggle?.();
  }

  const Tag = onToggle ? motion.button : motion.div;

  return (
    <motion.div
      className={styles.wrapper}
      {...(revealIndex === undefined
        ? {}
        : {
            initial: { opacity: 0, y: 48, scale: 0.94, rotate: revealIndex % 2 === 0 ? -2 : 2 },
            whileInView: { opacity: 1, y: 0, scale: 1, rotate: 0 },
            viewport: { once: true, amount: 0.25 },
            transition: { duration: duration.slow, ease: easeOut, delay: (revealIndex % 3) * 0.08 },
          })}
    >
      <Tag
        type={onToggle ? "button" : undefined}
        className={styles.card}
        data-color={voucher.color}
        data-selected={selected || undefined}
        data-sold-out={soldOut || undefined}
        onClick={onToggle ? handleClick : undefined}
        disabled={onToggle ? soldOut : undefined}
        aria-pressed={onToggle ? selected : undefined}
        aria-label={onToggle ? `${selected ? "Bỏ chọn" : "Chọn"} ${voucher.title}` : undefined}
        whileHover={interactive ? { y: -3 } : undefined}
        whileTap={interactive ? { y: 4, scale: 0.99 } : undefined}
        transition={spring.snappy}
      >
        {onToggle && (
          <span className={styles.check} aria-hidden>
            <AnimatePresence>
              {selected && (
                <motion.span
                  className={styles.checkFill}
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 45 }}
                  transition={spring.bouncy}
                >
                  ✓
                </motion.span>
              )}
            </AnimatePresence>
          </span>
        )}

        <motion.span className={styles.emoji} animate={emojiControls}>
          {voucher.emoji}
        </motion.span>

        <strong className={styles.title}>{voucher.title || "Tên voucher"}</strong>
        <span className={styles.description}>{voucher.description || "Mô tả voucher…"}</span>

        <span className={styles.meta}>
          {voucher.value && <span className={styles.value}>{voucher.value}</span>}
          {/* Sold-out cards say so with their own badge below. */}
          {voucher.remaining !== null && !soldOut && <span>{voucherUsageLabel(voucher.remaining)}</span>}
          {voucher.expiresAt && <span>HSD {formatDate(voucher.expiresAt)}</span>}
        </span>

        {soldOut && <span className={styles.soldOut}>Hết lượt rồi 🥲</span>}
      </Tag>
    </motion.div>
  );
}
