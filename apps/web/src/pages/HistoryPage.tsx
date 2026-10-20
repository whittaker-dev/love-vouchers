import { motion } from "framer-motion";
import { Link } from "react-router";
import { useProfile, useWishes } from "../api/hooks";
import { buttonClassName } from "../components/Button";
import { RevealText } from "../components/RevealText";
import { EmptyState, ErrorState, Skeleton } from "../components/StateViews";
import { formatDateTime } from "../lib/format";
import { useIntroDone } from "../lib/intro";
import { duration, easeOut } from "../lib/motion";
import styles from "./HistoryPage.module.css";

export function HistoryPage() {
  const play = useIntroDone();
  const wishes = useWishes();
  const partnerName = useProfile().data?.partnerName ?? "Anh";

  return (
    <section className={`container ${styles.page}`}>
      <p className="eyebrow">Lịch sử</p>
      <RevealText className={styles.title} text="Những điều ước đang chờ anh" play={play} />

      <div className={styles.list}>
        {wishes.isPending ? (
          [0, 1].map((key) => <Skeleton key={key} height={150} radius={19} />)
        ) : wishes.isError ? (
          <ErrorState error={wishes.error} />
        ) : wishes.data.length === 0 ? (
          <EmptyState emoji="💕" title="Không còn điều ước nào đang chờ">
            <p>{partnerName} làm hết rồi đó. Chọn thêm voucher mới nhé!</p>
            <Link to="/" className={buttonClassName("primary", "sm")}>
              Chọn voucher ngay
            </Link>
          </EmptyState>
        ) : (
          <ol className={styles.wishes}>
            {wishes.data.map((wish) => (
              <motion.li
                key={wish.id}
                className={styles.wish}
                initial={{ opacity: 0, y: 40, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: duration.slow, ease: easeOut }}
                whileHover={{ y: -3 }}
              >
                <p className={styles.date}>Gửi lúc {formatDateTime(wish.createdAt)}</p>
                <ul className={styles.items}>
                  {wish.items.map((item) => (
                    <li key={item.id} className={styles.item}>
                      <span className={styles.emoji}>{item.voucherEmoji}</span>
                      <span className={styles.itemTitle}>{item.voucherTitle}</span>
                    </li>
                  ))}
                </ul>
                {wish.message && <p className={styles.message}>“{wish.message}”</p>}
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
