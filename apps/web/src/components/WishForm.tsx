import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import type { Variants } from "framer-motion";
import { forwardRef, useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { VoucherDto, WishQuotaDto } from "@love/shared";
import { duration, easeOut, spring } from "../lib/motion";
import { Button } from "./Button";
import { FormError } from "./Field";
import fieldStyles from "./Field.module.css";
import styles from "./WishForm.module.css";

const MESSAGE_LIMIT = 1000;

// The card slides up first, then its parts follow one by one.
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 60, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: duration.slow, ease: easeOut, staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const partVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.base, ease: easeOut } },
};

interface WishFormProps {
  selected: VoucherDto[];
  message: string;
  onMessageChange: (message: string) => void;
  onRemove: (voucherId: string) => void;
  onSubmit: () => void;
  sending: boolean;
  error: string | null;
  /** This month's allowance; shown as a pill and enforced by disabling the button at 0. */
  quota: WishQuotaDto | undefined;
  /** When set, sending is not possible (e.g. the admin is only previewing); shown instead. */
  blockedReason: string | null;
}

/** "Danh sách ước": the picked vouchers as chips, an optional note, and the send button. */
export const WishForm = forwardRef<HTMLElement, WishFormProps>(function WishForm(
  { selected, message, onMessageChange, onRemove, onSubmit, sending, error, quota, blockedReason },
  ref,
) {
  const chipBoxControls = useAnimationControls();
  const heartControls = useAnimationControls();
  const [emptyHint, setEmptyHint] = useState(false);

  // The heart icon gives a little beat every time the list changes.
  useEffect(() => {
    void heartControls.start({ scale: [1, 1.3, 0.95, 1], transition: { duration: 0.45 } });
    if (selected.length > 0) setEmptyHint(false);
  }, [selected.length, heartControls]);

  const outOfSends = quota !== undefined && quota.remaining === 0;
  const notice = blockedReason ?? (outOfSends ? outOfSendsMessage(quota) : null);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (notice) return;
    if (selected.length === 0) {
      setEmptyHint(true);
      void chipBoxControls.start({ x: [0, -8, 8, -5, 4, 0], transition: { duration: 0.4 } });
      return;
    }
    onSubmit();
  }

  const nearLimit = message.length > MESSAGE_LIMIT * 0.9;

  return (
    <motion.section
      ref={ref}
      id="wish"
      className={styles.card}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
    >
      <motion.div className={styles.head} variants={partVariants}>
        <motion.span className={styles.icon} animate={heartControls} aria-hidden>
          ♡
        </motion.span>
        <div>
          <p className="eyebrow">Danh sách ước</p>
          <h2 className={styles.title}>Gửi một điều ước nhỏ</h2>
        </div>
        {quota && <QuotaPill quota={quota} />}
      </motion.div>

      <form className={styles.form} onSubmit={submit} noValidate>
        <motion.div variants={partVariants}>
          <motion.div className={styles.chipBox} animate={chipBoxControls} data-warn={emptyHint || undefined}>
            <AnimatePresence mode="popLayout" initial={false}>
              {selected.length === 0 ? (
                <motion.p
                  key="empty"
                  className={styles.empty}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {emptyHint ? "Chọn ít nhất một voucher ở trên nha 👆" : "Những voucher em chọn sẽ hiện ở đây ✨"}
                </motion.p>
              ) : (
                selected.map((voucher) => (
                  <motion.span
                    key={voucher.id}
                    layout
                    className={styles.chip}
                    initial={{ opacity: 0, scale: 0.4, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.15 } }}
                    transition={spring.bouncy}
                  >
                    <span aria-hidden>{voucher.emoji}</span>
                    {voucher.title}
                    <motion.button
                      type="button"
                      className={styles.chipRemove}
                      onClick={() => onRemove(voucher.id)}
                      aria-label={`Bỏ ${voucher.title}`}
                      whileHover={{ rotate: 90, scale: 1.15 }}
                      whileTap={{ scale: 0.8 }}
                    >
                      ✕
                    </motion.button>
                  </motion.span>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        <motion.div className={styles.field} variants={partVariants}>
          <label htmlFor="wish-message" className={styles.label}>
            Nhắn gì cho anh không <span>(không bắt buộc, nhưng anh thích lắm)</span>
          </label>
          <textarea
            id="wish-message"
            className={`${fieldStyles.control} ${fieldStyles.textarea}`}
            placeholder="Em muốn anh biết điều gì nè… ♡"
            maxLength={MESSAGE_LIMIT}
            value={message}
            onChange={(event) => onMessageChange(event.target.value)}
          />
          <div className={styles.fieldFoot}>
            <motion.span
              className={styles.counter}
              animate={{ color: nearLimit ? "#c73650" : "#9a7a86", scale: nearLimit ? 1.05 : 1 }}
            >
              {message.length} / {MESSAGE_LIMIT}
            </motion.span>
            <span>Ước gì cũng được hết 💗</span>
          </div>
        </motion.div>

        <FormError message={error} />

        <AnimatePresence initial={false}>
          {notice && (
            <motion.p
              className={styles.notice}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: duration.base, ease: easeOut }}
            >
              {notice}
            </motion.p>
          )}
        </AnimatePresence>

        <motion.div variants={partVariants}>
          <Button type="submit" size="lg" block loading={sending} disabled={notice !== null}>
            Gửi điều ước <span aria-hidden>♡</span>
          </Button>
        </motion.div>
        <motion.p className={styles.footnote} variants={partVariants}>
          Một lời nhắn riêng tư, gửi bằng cả trái tim 🔒
        </motion.p>
      </form>
    </motion.section>
  );
});

function outOfSendsMessage(quota: WishQuotaDto): string {
  const [year, month, day] = quota.resetsOn.split("-").map(Number);
  return `Tháng này em gửi đủ ${quota.limit} lần rồi. Quay lại vào ${day}/${month}/${year} nha 💕`;
}

/** "Còn 2/3 lượt tháng 10": the number flips when it changes. */
function QuotaPill({ quota }: { quota: WishQuotaDto }) {
  const month = Number(quota.month.slice(5));
  return (
    <span className={styles.quota} data-empty={quota.remaining === 0 || undefined}>
      Còn{" "}
      <span className={styles.quotaNumber}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={quota.remaining}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -12, opacity: 0 }}
            transition={spring.snappy}
          >
            {quota.remaining}
          </motion.span>
        </AnimatePresence>
      </span>
      /{quota.limit} lượt tháng {month}
    </span>
  );
}
