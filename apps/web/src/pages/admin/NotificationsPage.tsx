import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { RedemptionDto, WishDto } from "@love/shared";
import { useAdminWishes, useCancelRedemption, useCompleteRedemption, useCompleteWish } from "../../api/hooks";
import { Button } from "../../components/Button";
import { EmptyState, ErrorState, Skeleton } from "../../components/StateViews";
import { formatDateTime } from "../../lib/format";
import { duration, easeOut, spring } from "../../lib/motion";
import shared from "./admin.module.css";
import styles from "./NotificationsPage.module.css";

/**
 * The admin's daily to-do list: every wish she sent is a notification. Handling an item deletes
 * it on the server, so this page only ever shows what is still waiting.
 */
export function NotificationsPage() {
  const wishes = useAdminWishes();
  const pending = wishes.data?.reduce((total, wish) => total + wish.items.length, 0) ?? 0;

  return (
    <>
      <div className={shared.pageHead}>
        <div>
          <p className="eyebrow">Việc cần làm</p>
          <h1 className={shared.pageTitle}>Thông báo</h1>
          <p className={shared.pageSubtitle}>
            Mỗi điều ước em gửi là một thông báo. Làm xong voucher nào thì bấm <strong>Xong</strong>, thông báo sẽ
            được xoá khi xử lý hết.
          </p>
        </div>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={pending}
            className={styles.counter}
            data-empty={pending === 0 || undefined}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={spring.bouncy}
          >
            {pending === 0 ? "Không còn việc nào 🌿" : `${pending} việc đang chờ`}
          </motion.span>
        </AnimatePresence>
      </div>

      {wishes.isPending ? (
        <div className={styles.list}>
          {[0, 1].map((key) => (
            <Skeleton key={key} height={160} radius={19} />
          ))}
        </div>
      ) : wishes.isError ? (
        <ErrorState error={wishes.error} />
      ) : wishes.data.length === 0 ? (
        <EmptyState emoji="🌿" title="Không có thông báo nào">
          <p>Em chưa gửi điều ước mới. Thảnh thơi đi anh.</p>
        </EmptyState>
      ) : (
        <motion.ul className={styles.list} layout>
          <AnimatePresence initial={false} mode="popLayout">
            {wishes.data.map((wish) => (
              <WishCard key={wish.id} wish={wish} />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </>
  );
}

function WishCard({ wish }: { wish: WishDto }) {
  const completeWish = useCompleteWish();
  return (
    <motion.li
      layout
      className={styles.wish}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { duration: duration.base, ease: easeOut } }}
      exit={{ opacity: 0, scale: 0.92, y: -10, transition: { duration: duration.fast } }}
      transition={spring.soft}
    >
      <div className={styles.wishHead}>
        <div>
          <span className={styles.date}>{formatDateTime(wish.createdAt)}</span>
          <span className={styles.count}>{wish.items.length} voucher</span>
        </div>
        {wish.items.length > 1 && (
          <Button size="sm" variant="secondary" onClick={() => completeWish.mutate(wish.id)} loading={completeWish.isPending}>
            Xong hết ✓
          </Button>
        )}
      </div>
      {wish.message && <p className={styles.message}>“{wish.message}”</p>}
      {completeWish.error && <p className={styles.error}>{completeWish.error.message}</p>}
      <ul className={styles.items}>
        <AnimatePresence initial={false} mode="popLayout">
          {wish.items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </AnimatePresence>
      </ul>
    </motion.li>
  );
}

function ItemRow({ item }: { item: RedemptionDto }) {
  const complete = useCompleteRedemption();
  const cancel = useCancelRedemption();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const busy = complete.isPending || cancel.isPending;
  const error = complete.error ?? cancel.error;

  return (
    <motion.li
      layout
      className={styles.item}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      // Done items fly off to the right in green; cancelled ones just fade.
      exit={
        complete.isSuccess
          ? { opacity: 0, x: 80, backgroundColor: "#e1f3e7", transition: { duration: duration.base } }
          : { opacity: 0, scale: 0.9, transition: { duration: duration.fast } }
      }
      transition={spring.soft}
    >
      <span className={styles.emoji}>{item.voucherEmoji}</span>
      <div className={styles.itemInfo}>
        <strong>{item.voucherTitle}</strong>
        {error && <span className={styles.error}>{error.message}</span>}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {confirmingCancel ? (
          <motion.div
            key="confirm"
            className={styles.actions}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: duration.fast }}
          >
            <span className={styles.confirmText}>Huỷ và trả lại lượt?</span>
            <Button size="sm" variant="danger" onClick={() => cancel.mutate(item.id)} loading={cancel.isPending}>
              Huỷ
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmingCancel(false)} disabled={busy}>
              Thôi
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            className={styles.actions}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: duration.fast }}
          >
            <Button size="sm" onClick={() => complete.mutate(item.id)} loading={complete.isPending} disabled={busy}>
              Xong ✓
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmingCancel(true)} disabled={busy}>
              Huỷ
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
