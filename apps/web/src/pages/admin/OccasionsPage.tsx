import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import { OCCASION_THEMES, occasionInputSchema } from "@love/shared";
import type { OccasionDto, OccasionInput, OccasionKind, OccasionTheme } from "@love/shared";
import { useAdminOccasions, useDeleteOccasion, useSaveOccasion } from "../../api/hooks";
import { Button, buttonClassName } from "../../components/Button";
import { DayMonthPicker } from "../../components/DayMonthPicker";
import { EmojiPicker } from "../../components/EmojiPicker";
import { Field, FormError, Input, Textarea } from "../../components/Field";
import { EmptyState, ErrorState, Skeleton } from "../../components/StateViews";
import { Switch } from "../../components/Switch";
import { formatDate } from "../../lib/format";
import { apiFieldErrors, apiFormError, validate } from "../../lib/forms";
import type { FieldErrors } from "../../lib/forms";
import { duration, easeOut, spring } from "../../lib/motion";
import { OCCASION_THEME_STYLES } from "../../lib/occasionThemes";
import shared from "./admin.module.css";
import styles from "./OccasionsPage.module.css";

const KIND_LABELS: Record<OccasionKind, string> = {
  solar: "Dương lịch",
  lunar: "Âm lịch",
  birthday: "Sinh nhật em",
  anniversary: "Kỷ niệm yêu nhau",
};

const EMOJI_PRESETS = ["🎂", "💞", "🎆", "💘", "🧧", "💐", "🤍", "🌌", "🏮", "🌷", "🎃", "🎄", "🎁", "⭐", "🌸", "💖"];

const EMPTY: OccasionInput = {
  name: "",
  emoji: "🎁",
  theme: "hearts",
  kind: "solar",
  day: null,
  month: null,
  daysBefore: 0,
  daysAfter: 0,
  message: "",
  isEnabled: true,
};

function inputFrom(occasion: OccasionDto): OccasionInput {
  const { name, emoji, theme, kind, day, month, daysBefore, daysAfter, message, isEnabled } = occasion;
  return { name, emoji, theme, kind, day, month, daysBefore, daysAfter, message, isEnabled };
}

function dateLabel(occasion: OccasionDto): string {
  if (occasion.kind === "birthday" || occasion.kind === "anniversary") return `Theo ${occasion.kind === "birthday" ? "sinh nhật" : "ngày yêu"} trong Hồ sơ em`;
  return `${occasion.day}/${occasion.month} ${occasion.kind === "lunar" ? "âm lịch" : "dương lịch"}`;
}

export function OccasionsPage() {
  const occasions = useAdminOccasions();
  // "new" while adding, an occasion id while editing it, null otherwise. One editor at a time.
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <>
      <div className={shared.pageHead}>
        <div>
          <p className="eyebrow">Ngày đặc biệt</p>
          <h1 className={shared.pageTitle}>Dịp lễ</h1>
          <p className={shared.pageSubtitle}>
            Đến dịp, trang của em tự đổi giao diện: hiệu ứng bay khắp màn hình và một lời chúc. Ngày âm lịch được tự đổi
            sang dương lịch mỗi năm.
          </p>
        </div>
        <Button onClick={() => setEditing("new")} disabled={editing === "new"}>
          + Thêm dịp
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {editing === "new" && (
          <OccasionEditor key="new" initial={EMPTY} onDone={() => setEditing(null)} />
        )}
      </AnimatePresence>

      {occasions.isPending ? (
        <div className={styles.list}>
          {[0, 1, 2].map((key) => (
            <Skeleton key={key} height={84} radius={19} />
          ))}
        </div>
      ) : occasions.isError ? (
        <ErrorState error={occasions.error} />
      ) : occasions.data.length === 0 ? (
        <EmptyState emoji="🎈" title="Chưa có dịp nào">
          <p>Thêm sinh nhật, Valentine, Tết… để trang của em đổi giao diện vào những ngày đó.</p>
        </EmptyState>
      ) : (
        <motion.ul className={styles.list} layout>
          <AnimatePresence initial={false}>
            {occasions.data.map((occasion, index) =>
              editing === occasion.id ? (
                <motion.li key={occasion.id} layout>
                  <OccasionEditor id={occasion.id} initial={inputFrom(occasion)} onDone={() => setEditing(null)} />
                </motion.li>
              ) : (
                <OccasionRow key={occasion.id} occasion={occasion} index={index} onEdit={() => setEditing(occasion.id)} />
              ),
            )}
          </AnimatePresence>
        </motion.ul>
      )}
    </>
  );
}

function OccasionRow({ occasion, index, onEdit }: { occasion: OccasionDto; index: number; onEdit: () => void }) {
  const save = useSaveOccasion();
  const remove = useDeleteOccasion();
  const [confirming, setConfirming] = useState(false);
  const needsProfileDate = (occasion.kind === "birthday" || occasion.kind === "anniversary") && !occasion.nextDate;

  return (
    <motion.li
      layout
      className={styles.row}
      data-off={!occasion.isEnabled || undefined}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.03, duration: duration.base, ease: easeOut } }}
      exit={{ opacity: 0, x: -40, transition: { duration: duration.fast } }}
      transition={spring.soft}
    >
      <span className={styles.emoji}>{occasion.emoji}</span>
      <div className={styles.info}>
        <strong className={styles.name}>{occasion.name}</strong>
        <span className={styles.meta}>
          {dateLabel(occasion)} · {OCCASION_THEME_STYLES[occasion.theme].label}
        </span>
        {needsProfileDate ? (
          <Link to="/admin/profile" className={styles.missing}>
            Chưa có ngày, đặt trong Hồ sơ em →
          </Link>
        ) : (
          occasion.nextDate && (
            <span className={styles.next} data-today={occasion.daysUntil === 0 || undefined}>
              {occasion.daysUntil === 0 ? "Hôm nay 🎉" : `${formatDate(occasion.nextDate)} · còn ${occasion.daysUntil} ngày`}
            </span>
          )
        )}
      </div>
      <div className={styles.actions}>
        <Switch
          checked={occasion.isEnabled}
          onChange={(isEnabled) => save.mutate({ id: occasion.id, input: { ...inputFrom(occasion), isEnabled } })}
          disabled={save.isPending}
          label={occasion.isEnabled ? "Đang bật, bấm để tắt" : "Đang tắt, bấm để bật"}
        />
        <a href={`/?preview=${occasion.id}`} target="_blank" rel="noreferrer" className={buttonClassName("secondary", "sm")}>
          Xem thử
        </a>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Sửa
        </Button>
        <AnimatePresence mode="wait" initial={false}>
          {confirming ? (
            <motion.span
              key="confirm"
              className={styles.confirm}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={spring.snappy}
            >
              <Button size="sm" variant="danger" onClick={() => remove.mutate(occasion.id)} loading={remove.isPending}>
                Xoá
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Thôi
              </Button>
            </motion.span>
          ) : (
            <motion.span key="delete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Button size="sm" variant="ghost" className={styles.deleteButton} onClick={() => setConfirming(true)}>
                Xoá
              </Button>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}

interface OccasionEditorProps {
  id?: string;
  initial: OccasionInput;
  onDone: () => void;
}

function OccasionEditor({ id, initial, onDone }: OccasionEditorProps) {
  const save = useSaveOccasion();
  const [form, setForm] = useState(initial);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const set = <K extends keyof OccasionInput>(key: K, value: OccasionInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const hasOwnDate = form.kind === "solar" || form.kind === "lunar";

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = validate(occasionInputSchema, form);
    if (!result.ok) {
      setClientErrors(result.errors);
      return;
    }
    setClientErrors({});
    save.mutate({ id, input: form }, { onSuccess: onDone });
  }

  const errors = { ...apiFieldErrors(save.error), ...clientErrors };

  return (
    <motion.form
      className={`${shared.panel} ${shared.form} ${styles.editor}`}
      onSubmit={submit}
      noValidate
      initial={{ opacity: 0, height: 0, y: -10 }}
      animate={{ opacity: 1, height: "auto", y: 0 }}
      exit={{ opacity: 0, height: 0, y: -10 }}
      transition={{ duration: duration.base, ease: easeOut }}
    >
      <h2 className={styles.editorTitle}>{id ? "Sửa dịp" : "Dịp mới"}</h2>

      <div className={shared.formRow}>
        <Field label="Tên dịp" error={errors.name}>
          {(fieldId) => (
            <Input id={fieldId} value={form.name} placeholder="Ví dụ: Ngày đầu tiên gặp nhau" onChange={(event) => set("name", event.target.value)} aria-invalid={Boolean(errors.name)} />
          )}
        </Field>
      </div>

      <EmojiPicker label="Biểu tượng" value={form.emoji} onChange={(emoji) => set("emoji", emoji)} presets={EMOJI_PRESETS} error={errors.emoji} />

      <div className={styles.group}>
        <span className={styles.groupLabel}>Ngày</span>
        <div className={styles.segments} role="radiogroup" aria-label="Loại ngày">
          {(Object.keys(KIND_LABELS) as OccasionKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              role="radio"
              aria-checked={form.kind === kind}
              className={styles.segment}
              onClick={() => set("kind", kind)}
            >
              {form.kind === kind && <motion.span layoutId={`kind-${id ?? "new"}`} className={styles.segmentPill} transition={spring.snappy} />}
              <span className={styles.segmentLabel}>{KIND_LABELS[kind]}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {hasOwnDate ? (
            <motion.div key="date" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <DayMonthPicker
                day={form.day}
                month={form.month}
                calendar={form.kind === "lunar" ? "lunar" : "solar"}
                onChange={({ day, month }) => setForm((current) => ({ ...current, day, month }))}
              />
            </motion.div>
          ) : (
            <motion.p key="profile" className={styles.profileNote} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Ngày lấy từ <Link to="/admin/profile">Hồ sơ em</Link> ({form.kind === "birthday" ? "Sinh nhật" : "Ngày yêu nhau"}).
            </motion.p>
          )}
        </AnimatePresence>
        {errors.day && <p className={styles.error}>{errors.day}</p>}
      </div>

      <div className={styles.group}>
        <span className={styles.groupLabel}>Hiệu ứng</span>
        <div className={styles.themes} role="radiogroup" aria-label="Hiệu ứng">
          {OCCASION_THEMES.map((theme: OccasionTheme) => (
            <motion.button
              key={theme}
              type="button"
              role="radio"
              aria-checked={form.theme === theme}
              className={styles.theme}
              onClick={() => set("theme", theme)}
              whileHover="hover"
              whileTap={{ scale: 0.95 }}
            >
              {form.theme === theme && <motion.span layoutId={`theme-${id ?? "new"}`} className={styles.themeRing} transition={spring.snappy} />}
              <span className={styles.themeEmojis}>
                {OCCASION_THEME_STYLES[theme].particles.slice(0, 3).map((glyph, index) => (
                  <motion.span
                    key={index}
                    variants={{ hover: { y: [0, -8, 0], transition: { duration: 0.5, delay: index * 0.08 } } }}
                  >
                    {glyph}
                  </motion.span>
                ))}
              </span>
              <span className={styles.themeLabel}>{OCCASION_THEME_STYLES[theme].label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className={shared.formRow}>
        <Stepper label="Hiện trước" value={form.daysBefore} onChange={(value) => set("daysBefore", value)} />
        <Stepper label="Hiện sau" value={form.daysAfter} onChange={(value) => set("daysAfter", value)} />
      </div>

      <Field label="Lời chúc trên banner" hint="Viết {name} để chèn biệt danh của em" error={errors.message}>
        {(fieldId) => (
          <Textarea id={fieldId} value={form.message} onChange={(event) => set("message", event.target.value)} aria-invalid={Boolean(errors.message)} />
        )}
      </Field>

      <label className={shared.inlineToggle}>
        <Switch checked={form.isEnabled} onChange={(isEnabled) => set("isEnabled", isEnabled)} label="Bật dịp này" />
        Bật dịp này
      </label>

      <FormError message={apiFormError(save.error)} />
      <div className={shared.formActions}>
        <Button type="submit" loading={save.isPending}>
          {id ? "Lưu thay đổi" : "Thêm dịp"}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Huỷ
        </Button>
      </div>
    </motion.form>
  );
}

/** − 2 + : how many days before/after the date the theme stays on. */
function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel}>{label}</span>
      <div className={styles.stepper}>
        <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0} aria-label={`Giảm ${label}`}>
          −
        </motion.button>
        <span className={styles.stepperValue}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={value} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={spring.snappy}>
              {value}
            </motion.span>
          </AnimatePresence>{" "}
          ngày
        </span>
        <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => onChange(Math.min(14, value + 1))} disabled={value === 14} aria-label={`Tăng ${label}`}>
          +
        </motion.button>
      </div>
    </div>
  );
}
