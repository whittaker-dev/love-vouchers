import { motion } from "framer-motion";
import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { loginSchema } from "@love/shared";
import { useUserLogin, useViewer } from "../api/hooks";
import { Button } from "../components/Button";
import { Field, FormError, Input } from "../components/Field";
import { apiFieldErrors, apiFormError, validate } from "../lib/forms";
import type { FieldErrors } from "../lib/forms";
import { spring } from "../lib/motion";
import styles from "./UserLoginPage.module.css";

const FLOATING = ["💗", "💌", "✨", "🌸", "💕", "🎀"];

/** Her login. The account is created by the admin (/admin/account). */
export function UserLoginPage() {
  const viewer = useViewer();
  const login = useUserLogin();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  // Only follow relative paths on her side, never an absolute URL or the admin area.
  const nextParam = searchParams.get("next");
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") && !nextParam.startsWith("/admin") ? nextParam : "/";

  if (viewer.data?.role === "user") return <Navigate to={next} replace />;

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
      {FLOATING.map((emoji, index) => (
        <motion.span
          key={index}
          className={styles.floating}
          style={{ left: `${8 + index * 16}%` }}
          initial={{ y: "110vh", opacity: 0 }}
          animate={{ y: "-20vh", opacity: [0, 0.8, 0.8, 0], rotate: [0, 20, -20, 0] }}
          transition={{ duration: 9 + index, repeat: Infinity, delay: index * 1.3, ease: "linear" }}
          aria-hidden
        >
          {emoji}
        </motion.span>
      ))}

      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={spring.soft}
      >
        <motion.span
          className={styles.lock}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ ...spring.bouncy, delay: 0.15 }}
          aria-hidden
        >
          💝
        </motion.span>
        <h1 className={styles.title}>Chào em 💕</h1>
        <p className={styles.subtitle}>Đăng nhập bằng tài khoản anh đưa cho em nha</p>

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
              />
            )}
          </Field>
          <Field label="Mật khẩu" error={errors.password}>
            {(id) => (
              <Input
                id={id}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(errors.password)}
              />
            )}
          </Field>
          <FormError message={apiFormError(login.error)} />
          <Button type="submit" size="lg" block loading={login.isPending}>
            Vào thôi ♡
          </Button>
        </form>
        <p className={styles.footnote}>Quên mật khẩu thì hỏi anh nha 🤭</p>
      </motion.div>
    </div>
  );
}
