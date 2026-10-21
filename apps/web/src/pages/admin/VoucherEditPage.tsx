import { motion } from "framer-motion";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { VOUCHER_COLORS, voucherInputSchema } from "@love/shared";
import type { VoucherColor, VoucherDto, VoucherInput } from "@love/shared";
import { useAdminVoucher, useSaveVoucher } from "../../api/hooks";
import { Button } from "../../components/Button";
import { Field, FormError, Input, Textarea } from "../../components/Field";
import { DatePicker } from "../../components/DatePicker";
import { EmojiPicker } from "../../components/EmojiPicker";
import { todayDateOnly } from "../../lib/format";
import { ErrorState, LoadingText } from "../../components/StateViews";
import { Switch } from "../../components/Switch";
import { VoucherCard } from "../../components/VoucherCard";
import { apiFieldErrors, apiFormError, validate } from "../../lib/forms";
import type { FieldErrors } from "../../lib/forms";
import { spring } from "../../lib/motion";
import shared from "./admin.module.css";
import styles from "./VoucherEditPage.module.css";

const EMOJI_PRESETS = ["🎬", "💆‍♀️", "🧋", "🍝", "🛵", "🏳️", "💐", "🍰", "☕", "🍜", "🎤", "🛍️", "🎮", "🧸", "✈️", "💋", "🌙", "🎁"];

const COLOR_LABELS: Record<VoucherColor, string> = {
  blush: "Hồng phấn",
  cream: "Trắng kem",
  mauve: "Hồng tím",
  peach: "Hồng đào",
  lilac: "Tím nhạt",
};

/** Form values as typed. Numbers stay strings until submit so a half-typed field is not coerced. */
interface FormState {
  title: string;
  description: string;
  emoji: string;
  value: string;
  terms: string;
  color: VoucherColor;
  unlimited: boolean;
  quantity: string;
  expiresAt: string;
  isActive: boolean;
  sortOrder: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  emoji: "🎁",
  value: "",
  terms: "",
  color: "blush",
  unlimited: true,
  quantity: "1",
  expiresAt: "",
  isActive: true,
  sortOrder: "0",
};

function formFromVoucher(voucher: VoucherDto): FormState {
  return {
    title: voucher.title,
    description: voucher.description,
    emoji: voucher.emoji,
    value: voucher.value ?? "",
    terms: voucher.terms ?? "",
    color: voucher.color,
    unlimited: voucher.quantity === null,
    quantity: String(voucher.quantity ?? 1),
    expiresAt: voucher.expiresAt ?? "",
    isActive: voucher.isActive,
    sortOrder: String(voucher.sortOrder),
  };
}

function inputFromForm(form: FormState): VoucherInput {
  return {
    title: form.title,
    description: form.description,
    emoji: form.emoji,
    value: form.value,
    terms: form.terms,
    color: form.color,
    quantity: form.unlimited ? null : Number(form.quantity || Number.NaN),
    expiresAt: form.expiresAt || null,
    isActive: form.isActive,
    sortOrder: Number(form.sortOrder || 0),
  };
}

export function VoucherEditPage() {
  const { id } = useParams();
  const existing = useAdminVoucher(id);

  if (!id) return <VoucherEditor key="new" initial={EMPTY_FORM} />;
  if (existing.isPending) return <LoadingText />;
  if (existing.isError) return <ErrorState error={existing.error} />;
  return (
    <VoucherEditor key={id} id={id} initial={formFromVoucher(existing.data)} used={existing.data.used} />
  );
}

interface VoucherEditorProps {
  id?: string;
  initial: FormState;
  /** Past redemptions, so the preview's "còn N lượt" matches what she will see. */
  used?: number;
}

function VoucherEditor({ id, initial, used = 0 }: VoucherEditorProps) {
  const navigate = useNavigate();
  const save = useSaveVoucher();
  const [form, setForm] = useState(initial);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    const input = inputFromForm(form);
    const result = validate(voucherInputSchema, input);
    if (!result.ok) {
      setClientErrors(result.errors);
      return;
    }
    setClientErrors({});
    save.mutate({ id, input }, { onSuccess: () => navigate("/admin") });
  }

  const errors = { ...apiFieldErrors(save.error), ...clientErrors };
  const previewRemaining = form.unlimited ? null : Math.max(0, (Number(form.quantity) || 0) - used);

  return (
    <>
      <div className={shared.pageHead}>
        <div>
          <Link to="/admin" className={styles.back}>
            ← Danh sách voucher
          </Link>
          <h1 className={shared.pageTitle}>{id ? "Sửa voucher" : "Voucher mới"}</h1>
        </div>
      </div>

      <div className={styles.layout}>
        <form className={`${shared.panel} ${shared.form}`} onSubmit={submit} noValidate>
          <EmojiPicker
            label="Biểu tượng"
            value={form.emoji}
            onChange={(emoji) => set("emoji", emoji)}
            presets={EMOJI_PRESETS}
            error={errors.emoji}
          />

          <Field label="Tên voucher" error={errors.title}>
            {(fieldId) => (
              <Input
                id={fieldId}
                placeholder="Ví dụ: Một buổi xem phim"
                value={form.title}
                onChange={(event) => set("title", event.target.value)}
                aria-invalid={Boolean(errors.title)}
              />
            )}
          </Field>

          <Field label="Mô tả" error={errors.description}>
            {(fieldId) => (
              <Textarea
                id={fieldId}
                placeholder="Em được gì khi dùng voucher này?"
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                aria-invalid={Boolean(errors.description)}
              />
            )}
          </Field>

          <div className={shared.formRow}>
            <Field label="Giá trị" hint="Ví dụ: 50.000đ, 30 phút" error={errors.value}>
              {(fieldId) => (
                <Input id={fieldId} value={form.value} onChange={(event) => set("value", event.target.value)} />
              )}
            </Field>
            <Field label="Hạn sử dụng" hint="Để trống = không hết hạn" error={errors.expiresAt}>
              {(fieldId) => (
                <DatePicker
                  id={fieldId}
                  value={form.expiresAt || null}
                  onChange={(date) => set("expiresAt", date ?? "")}
                  placeholder="Không hết hạn"
                  min={todayDateOnly()}
                />
              )}
            </Field>
          </div>

          <Field label="Điều kiện" hint="Không bắt buộc" error={errors.terms}>
            {(fieldId) => (
              <Input
                id={fieldId}
                placeholder="Ví dụ: báo trước 1 ngày"
                value={form.terms}
                onChange={(event) => set("terms", event.target.value)}
              />
            )}
          </Field>

          <div className={styles.colorField}>
            <span className={styles.fieldLabel}>Màu thẻ</span>
            <div className={styles.swatches} role="radiogroup" aria-label="Màu thẻ">
              {VOUCHER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={form.color === color}
                  aria-label={COLOR_LABELS[color]}
                  title={COLOR_LABELS[color]}
                  className={styles.swatch}
                  style={{ background: `var(--card-${color})` }}
                  onClick={() => set("color", color)}
                >
                  {form.color === color && (
                    <motion.span layoutId="swatch-ring" className={styles.swatchRing} transition={spring.snappy} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className={shared.formRow}>
            <div className={styles.quantityField}>
              <span className={styles.fieldLabel}>Số lượt dùng</span>
              <label className={shared.inlineToggle}>
                <Switch
                  checked={form.unlimited}
                  onChange={(unlimited) => set("unlimited", unlimited)}
                  label="Không giới hạn số lượt"
                />
                Không giới hạn
              </label>
              {!form.unlimited && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  <Input
                    aria-label="Số lượt"
                    type="number"
                    min={1}
                    max={999}
                    value={form.quantity}
                    onChange={(event) => set("quantity", event.target.value)}
                    aria-invalid={Boolean(errors.quantity)}
                  />
                </motion.div>
              )}
              {errors.quantity && <p className={styles.error}>{errors.quantity}</p>}
            </div>
            <Field label="Thứ tự hiển thị" hint="Số nhỏ hiện trước" error={errors.sortOrder}>
              {(fieldId) => (
                <Input
                  id={fieldId}
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(event) => set("sortOrder", event.target.value)}
                />
              )}
            </Field>
          </div>


          <label className={shared.inlineToggle}>
            <Switch checked={form.isActive} onChange={(isActive) => set("isActive", isActive)} label="Hiện cho em thấy" />
            Hiện voucher này trên trang của em
          </label>

          <FormError message={apiFormError(save.error)} />
          <div className={shared.formActions}>
            <Button type="submit" loading={save.isPending}>
              {id ? "Lưu thay đổi" : "Tạo voucher"}
            </Button>
            <Link to="/admin">Huỷ</Link>
          </div>
        </form>

        <aside className={styles.preview}>
          <p className="eyebrow">Xem trước</p>
          <motion.div layout transition={spring.soft}>
            <VoucherCard
              voucher={{
                title: form.title,
                description: form.description,
                emoji: form.emoji,
                value: form.value || null,
                color: form.color,
                remaining: previewRemaining,
                expiresAt: form.expiresAt || null,
              }}
            />
          </motion.div>
        </aside>
      </div>
    </>
  );
}
