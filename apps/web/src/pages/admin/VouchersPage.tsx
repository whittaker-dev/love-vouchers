import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router";
import type { VoucherDto } from "@love/shared";
import { useAdminVouchers, useDeleteVoucher, useSaveVoucher } from "../../api/hooks";
import { Button, buttonClassName } from "../../components/Button";
import { EmptyState, ErrorState, Skeleton } from "../../components/StateViews";
import { Switch } from "../../components/Switch";
import { voucherUsageLabel } from "../../components/VoucherCard";
import { formatDate } from "../../lib/format";
import { duration, easeOut, spring } from "../../lib/motion";
import { voucherToInput } from "../../lib/voucherForm";
import shared from "./admin.module.css";
import styles from "./VouchersPage.module.css";

export function VouchersPage() {
  const vouchers = useAdminVouchers();

  return (
    <>
      <div className={shared.pageHead}>
        <div>
          <h1 className={shared.pageTitle}>Voucher</h1>
          <p className={shared.pageSubtitle}>
            Voucher đang bật sẽ hiện trên trang của em. Tắt đi để ẩn mà không mất lịch sử.
          </p>
        </div>
        <Link to="/admin/vouchers/new" className={buttonClassName()}>
          + Thêm voucher
        </Link>
      </div>

      {vouchers.isPending ? (
        <div className={styles.list}>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} height={84} radius={12} />
          ))}
        </div>
      ) : vouchers.isError ? (
        <ErrorState error={vouchers.error} />
      ) : vouchers.data.length === 0 ? (
        <EmptyState emoji="🎟️" title="Chưa có voucher nào">
          <p>Thêm voucher đầu tiên: xem phim, massage, một ly trà sữa…</p>
        </EmptyState>
      ) : (
        <motion.ul className={styles.list} layout>
          <AnimatePresence initial={false}>
            {vouchers.data.map((voucher, index) => (
              <VoucherRow key={voucher.id} voucher={voucher} index={index} />
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </>
  );
}

function VoucherRow({ voucher, index }: { voucher: VoucherDto; index: number }) {
  const save = useSaveVoucher();
  const remove = useDeleteVoucher();
  const [confirming, setConfirming] = useState(false);

  function toggleActive(isActive: boolean) {
    save.mutate({ id: voucher.id, input: { ...voucherToInput(voucher), isActive } });
  }

  return (
    <motion.li
      layout
      className={styles.row}
      data-color={voucher.color}
      data-inactive={!voucher.isActive || undefined}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.04, duration: duration.base, ease: easeOut } }}
      exit={{ opacity: 0, x: -40, transition: { duration: duration.fast } }}
      transition={spring.soft}
    >
      <span className={styles.emoji}>{voucher.emoji}</span>
      <div className={styles.info}>
        <Link to={`/admin/vouchers/${voucher.id}`} className={styles.title}>
          {voucher.title}
        </Link>
        <p className={styles.meta}>
          {voucher.value && <span>{voucher.value}</span>}
          <span>{voucherUsageLabel(voucher.remaining)}</span>
          <span>đã dùng {voucher.used} lần</span>
          {voucher.expiresAt && <span>HSD {formatDate(voucher.expiresAt)}</span>}
        </p>
      </div>

      <div className={styles.actions}>
        <label className={styles.toggle}>
          <Switch
            checked={voucher.isActive}
            onChange={toggleActive}
            disabled={save.isPending}
            label={voucher.isActive ? "Đang hiện, bấm để ẩn" : "Đang ẩn, bấm để hiện"}
          />
          <span>{voucher.isActive ? "Đang hiện" : "Đang ẩn"}</span>
        </label>
        <Link to={`/admin/vouchers/${voucher.id}`} className={styles.edit}>
          Sửa
        </Link>
        <AnimatePresence mode="wait" initial={false}>
          {confirming ? (
            <motion.div
              key="confirm"
              className={styles.confirm}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={spring.snappy}
            >
              <span>Xoá thật?</span>
              <Button size="sm" variant="danger" loading={remove.isPending} onClick={() => remove.mutate(voucher.id)}>
                Xoá
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Thôi
              </Button>
            </motion.div>
          ) : (
            <motion.button
              key="delete"
              className={styles.delete}
              onClick={() => setConfirming(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Xoá
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {remove.error && <p className={styles.error}>{remove.error.message}</p>}
    </motion.li>
  );
}
