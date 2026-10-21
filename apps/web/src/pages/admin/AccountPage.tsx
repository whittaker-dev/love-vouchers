import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { FormEvent } from "react";
import { changePasswordSchema, settingsInputSchema, userCreateSchema } from "@love/shared";
import type { SettingsDto, UserAccountDto } from "@love/shared";
import {
  useAdminUser,
  useChangePassword,
  useCreateUser,
  useDeleteUser,
  useMe,
  useSaveSettings,
  useSettings,
} from "../../api/hooks";
import { Button } from "../../components/Button";
import { Field, FormError, Input } from "../../components/Field";
import { ErrorState, Skeleton } from "../../components/StateViews";
import { formatDateTime } from "../../lib/format";
import { apiFieldErrors, apiFormError, validate } from "../../lib/forms";
import type { FieldErrors } from "../../lib/forms";
import { duration, easeOut, spring } from "../../lib/motion";
import shared from "./admin.module.css";
import styles from "./AccountPage.module.css";

export function AccountPage() {
  const me = useMe();
  return (
    <>
      <div className={shared.pageHead}>
        <div>
          <h1 className={shared.pageTitle}>Tài khoản</h1>
          <p className={shared.pageSubtitle}>
            Anh đăng nhập bằng <strong>{me.data?.email}</strong>.
          </p>
        </div>
      </div>
      <div className={styles.panels}>
        <HerAccountPanel />
        <QuotaPanel />
        <PasswordPanel />
      </div>
    </>
  );
}

const panelMotion = (index: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: index * 0.08, duration: duration.base, ease: easeOut },
});

// ── Her login: one account; to change it, delete and create a new one ────

function HerAccountPanel() {
  const user = useAdminUser();
  return (
    <motion.section className={`${shared.panel} ${styles.panel}`} {...panelMotion(0)}>
      <h2 className={styles.title}>Tài khoản của em</h2>
      <p className={styles.lead}>Em dùng tài khoản này để vào trang của em. Chỉ có một tài khoản: muốn đổi thì xoá rồi tạo mới.</p>
      {user.isPending ? (
        <Skeleton height={120} radius={14} />
      ) : user.isError ? (
        <ErrorState error={user.error} />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {user.data ? (
            <ExistingAccount key="existing" account={user.data} />
          ) : (
            <CreateAccountForm key="create" />
          )}
        </AnimatePresence>
      )}
    </motion.section>
  );
}

function ExistingAccount({ account }: { account: UserAccountDto }) {
  const remove = useDeleteUser();
  const [confirming, setConfirming] = useState(false);
  return (
    <motion.div
      className={styles.account}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={spring.soft}
    >
      <span className={styles.accountIcon} aria-hidden>
        💝
      </span>
      <div className={styles.accountInfo}>
        <strong>{account.email}</strong>
        <span>Tạo lúc {formatDateTime(account.createdAt)}</span>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {confirming ? (
          <motion.div
            key="confirm"
            className={styles.confirm}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <p>Xoá xong em sẽ bị đăng xuất ngay. Sau đó anh tạo tài khoản mới cho em nhé.</p>
            <div className={styles.confirmActions}>
              <Button size="sm" variant="danger" onClick={() => remove.mutate()} loading={remove.isPending}>
                Xoá tài khoản
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Thôi
              </Button>
            </div>
            <FormError message={apiFormError(remove.error)} />
          </motion.div>
        ) : (
          <motion.div key="delete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button size="sm" variant="danger" onClick={() => setConfirming(true)}>
              Xoá để tạo mới
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CreateAccountForm() {
  const create = useCreateUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = validate(userCreateSchema, { email, password });
    if (!result.ok) {
      setClientErrors(result.errors);
      return;
    }
    setClientErrors({});
    create.mutate(result.data);
  }

  const errors = { ...apiFieldErrors(create.error), ...clientErrors };

  return (
    <motion.form
      className={shared.form}
      onSubmit={submit}
      noValidate
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: duration.base, ease: easeOut }}
    >
      <p className={styles.empty}>Chưa có tài khoản nào. Tạo một cái rồi gửi email và mật khẩu cho em nha 💌</p>
      <Field label="Email của em" error={errors.email}>
        {(id) => (
          <Input id={id} type="email" autoComplete="off" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(errors.email)} />
        )}
      </Field>
      <Field label="Mật khẩu" hint="Ít nhất 6 ký tự" error={errors.password}>
        {(id) => (
          <Input id={id} type="text" autoComplete="off" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(errors.password)} />
        )}
      </Field>
      <FormError message={apiFormError(create.error)} />
      <div className={shared.formActions}>
        <Button type="submit" loading={create.isPending}>
          Tạo tài khoản cho em
        </Button>
      </div>
    </motion.form>
  );
}

// ── Monthly sending limit ───────────────────────────────────────────────

function QuotaPanel() {
  const settings = useSettings();
  return (
    <motion.section className={`${shared.panel} ${styles.panel}`} {...panelMotion(1)}>
      <h2 className={styles.title}>Giới hạn gửi mỗi tháng</h2>
      <p className={styles.lead}>Số lần em được bấm "Gửi điều ước" trong một tháng (giờ Việt Nam). Ngày 1 mỗi tháng tự làm mới.</p>
      {settings.isPending ? (
        <Skeleton height={90} radius={14} />
      ) : settings.isError ? (
        <ErrorState error={settings.error} />
      ) : (
        <QuotaForm key={settings.data.monthlyWishLimit} settings={settings.data} />
      )}
    </motion.section>
  );
}

function QuotaForm({ settings }: { settings: SettingsDto }) {
  const save = useSaveSettings();
  const [limit, setLimit] = useState(settings.monthlyWishLimit);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const { quota } = settings;
  const month = Number(quota.month.slice(5));

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = validate(settingsInputSchema, { monthlyWishLimit: limit });
    if (!result.ok) {
      setClientErrors(result.errors);
      return;
    }
    setClientErrors({});
    save.mutate(result.data);
  }

  const error = clientErrors.monthlyWishLimit ?? apiFieldErrors(save.error).monthlyWishLimit;

  return (
    <form className={styles.quotaForm} onSubmit={submit} noValidate>
      <div className={styles.stepper}>
        <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => setLimit(Math.max(1, limit - 1))} disabled={limit <= 1} aria-label="Giảm">
          −
        </motion.button>
        <span className={styles.stepperValue}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={limit} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={spring.snappy}>
              {limit}
            </motion.span>
          </AnimatePresence>
          <small>lần / tháng</small>
        </span>
        <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => setLimit(Math.min(100, limit + 1))} disabled={limit >= 100} aria-label="Tăng">
          +
        </motion.button>
      </div>
      <div className={styles.usage}>
        <div className={styles.usageBar}>
          <motion.span
            className={styles.usageFill}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (quota.used / Math.max(1, quota.limit)) * 100)}%` }}
            transition={{ duration: duration.slow, ease: easeOut }}
          />
        </div>
        <span>
          Tháng {month}: em đã gửi <strong>{quota.used}</strong>/{quota.limit} lần
        </span>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <div className={shared.formActions}>
        <Button type="submit" loading={save.isPending} disabled={limit === settings.monthlyWishLimit}>
          Lưu giới hạn
        </Button>
        <AnimatePresence>
          {save.isSuccess && (
            <motion.span className={shared.saved} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              ✓ Đã lưu
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}

// ── The admin's own password ─────────────────────────────────────────────

function PasswordPanel() {
  const changePassword = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = validate(changePasswordSchema, { currentPassword, newPassword });
    if (!result.ok) {
      setClientErrors(result.errors);
      return;
    }
    setClientErrors({});
    changePassword.mutate(result.data, {
      onSuccess: () => {
        setCurrentPassword("");
        setNewPassword("");
      },
    });
  }

  const errors = { ...apiFieldErrors(changePassword.error), ...clientErrors };

  return (
    <motion.form className={`${shared.panel} ${shared.form} ${styles.panel}`} onSubmit={submit} noValidate {...panelMotion(2)}>
      <h2 className={styles.title}>Đổi mật khẩu của anh</h2>
      <Field label="Mật khẩu hiện tại" error={errors.currentPassword}>
        {(id) => (
          <Input id={id} type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} aria-invalid={Boolean(errors.currentPassword)} />
        )}
      </Field>
      <Field label="Mật khẩu mới" hint="Ít nhất 8 ký tự" error={errors.newPassword}>
        {(id) => (
          <Input id={id} type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} aria-invalid={Boolean(errors.newPassword)} />
        )}
      </Field>
      <FormError message={apiFormError(changePassword.error)} />
      <div className={shared.formActions}>
        <Button type="submit" loading={changePassword.isPending}>
          Đổi mật khẩu
        </Button>
        <AnimatePresence>
          {changePassword.isSuccess && (
            <motion.span className={shared.saved} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              ✓ Đã đổi mật khẩu
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.form>
  );
}
