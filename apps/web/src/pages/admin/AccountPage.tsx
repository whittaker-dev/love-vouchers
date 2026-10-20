import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { FormEvent } from "react";
import { changePasswordSchema } from "@love/shared";
import { useChangePassword, useMe } from "../../api/hooks";
import { Button } from "../../components/Button";
import { Field, FormError, Input } from "../../components/Field";
import { apiFieldErrors, apiFormError, validate } from "../../lib/forms";
import type { FieldErrors } from "../../lib/forms";
import shared from "./admin.module.css";

export function AccountPage() {
  const me = useMe();
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
    <>
      <div className={shared.pageHead}>
        <div>
          <h1 className={shared.pageTitle}>Tài khoản</h1>
          <p className={shared.pageSubtitle}>
            Đăng nhập bằng <strong>{me.data?.email}</strong>.
          </p>
        </div>
      </div>

      <form className={`${shared.panel} ${shared.form}`} style={{ maxWidth: 480 }} onSubmit={submit} noValidate>
        <h2 style={{ fontSize: "var(--text-xl)" }}>Đổi mật khẩu</h2>
        <Field label="Mật khẩu hiện tại" error={errors.currentPassword}>
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              aria-invalid={Boolean(errors.currentPassword)}
            />
          )}
        </Field>
        <Field label="Mật khẩu mới" hint="Ít nhất 8 ký tự" error={errors.newPassword}>
          {(id) => (
            <Input
              id={id}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              aria-invalid={Boolean(errors.newPassword)}
            />
          )}
        </Field>
        <FormError message={apiFormError(changePassword.error)} />
        <div className={shared.formActions}>
          <Button type="submit" loading={changePassword.isPending}>
            Đổi mật khẩu
          </Button>
          <AnimatePresence>
            {changePassword.isSuccess && (
              <motion.span
                className={shared.saved}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                ✓ Đã đổi mật khẩu
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </form>
    </>
  );
}
