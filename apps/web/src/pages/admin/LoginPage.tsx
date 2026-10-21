import { motion } from "framer-motion";
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { loginSchema } from "@love/shared";
import { useLogin, useMe } from "../../api/hooks";
import { Button } from "../../components/Button";
import { Field, FormError, Input, PasswordInput } from "../../components/Field";
import { apiFieldErrors, apiFormError, validate } from "../../lib/forms";
import type { FieldErrors } from "../../lib/forms";
import { spring } from "../../lib/motion";
import styles from "./LoginPage.module.css";

export function LoginPage() {
  const me = useMe();
  const login = useLogin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  // Only follow relative admin paths, never an absolute URL smuggled into ?next=.
  const nextParam = searchParams.get("next");
  const next = nextParam?.startsWith("/admin") ? nextParam : "/admin";

  if (me.data) return <Navigate to={next} replace />;

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = validate(loginSchema, { email, password });
    if (!result.ok) {
      setClientErrors(result.errors);
      return;
    }
    setClientErrors({});
    login.mutate(result.data, { onSuccess: () => navigate(next, { replace: true }) });
  }

  const errors = { ...apiFieldErrors(login.error), ...clientErrors };

  return (
    <div className={styles.screen}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={spring.soft}
      >
        <motion.span
          className={styles.logo}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.25, 1] }}
          transition={{ delay: 0.2, duration: 0.6 }}
          aria-hidden
        >
          ♥
        </motion.span>
        <h1 className={styles.title}>Đăng nhập</h1>
        <p className={styles.subtitle}>
          để quản lý <strong>Love Vouchers</strong>
        </p>

        <form className={styles.form} onSubmit={submit} noValidate>
          <Field label="Email" error={errors.email}>
            {(id) => (
              <Input
                id={id}
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(errors.email)}
                autoFocus
              />
            )}
          </Field>
          <Field label="Mật khẩu" error={errors.password}>
            {(id) => (
              <PasswordInput
                id={id}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(errors.password)}
              />
            )}
          </Field>
          <FormError message={apiFormError(login.error)} />
          <Button type="submit" size="lg" loading={login.isPending}>
            Đăng nhập
          </Button>
        </form>
        <p className={styles.footnote}>Chỉ dành cho người tặng voucher 😉</p>
      </motion.div>
    </div>
  );
}
