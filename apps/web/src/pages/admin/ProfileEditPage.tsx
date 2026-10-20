import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { profileInputSchema } from "@love/shared";
import type { ProfileDto, ProfileInput } from "@love/shared";
import { useProfile, useUpdateProfile } from "../../api/hooks";
import { Button } from "../../components/Button";
import { Field, FormError, Input, Textarea } from "../../components/Field";
import { EmojiPicker } from "../../components/EmojiPicker";
import { ErrorState, LoadingText } from "../../components/StateViews";
import { apiFieldErrors, apiFormError, validate } from "../../lib/forms";
import type { FieldErrors } from "../../lib/forms";
import { spring } from "../../lib/motion";
import shared from "./admin.module.css";
import styles from "./ProfileEditPage.module.css";

const AVATAR_PRESETS = ["🐐", "🐰", "🐱", "🐻", "🐼", "🦊", "🐥", "🐹", "🦄", "🌸", "🌷", "🍓", "🍑", "🧁", "🌙", "⭐", "💖", "👸", "🎀"];

export function ProfileEditPage() {
  const profile = useProfile();
  if (profile.isPending) return <LoadingText />;
  if (profile.isError) return <ErrorState error={profile.error} />;
  return <ProfileForm initial={profile.data} />;
}

function toInput(profile: ProfileDto): ProfileInput {
  return {
    name: profile.name,
    nickname: profile.nickname ?? "",
    avatarEmoji: profile.avatarEmoji,
    bio: profile.bio ?? "",
    birthday: profile.birthday,
    anniversary: profile.anniversary,
    favorites: profile.favorites,
  };
}

function ProfileForm({ initial }: { initial: ProfileDto }) {
  const update = useUpdateProfile();
  const [form, setForm] = useState(() => toInput(initial));
  const [favoriteDraft, setFavoriteDraft] = useState("");
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => {
    update.reset(); // hides "Đã lưu" as soon as something changes again
    setForm((current) => ({ ...current, [key]: value }));
  };
  const { favorites } = form;

  function addFavorite() {
    const value = favoriteDraft.trim();
    if (!value || favorites.includes(value)) return;
    set("favorites", [...favorites, value]);
    setFavoriteDraft("");
  }

  function onFavoriteKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addFavorite();
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const result = validate(profileInputSchema, form);
    if (!result.ok) {
      setClientErrors(result.errors);
      return;
    }
    setClientErrors({});
    update.mutate(form);
  }

  const errors = { ...apiFieldErrors(update.error), ...clientErrors };

  return (
    <>
      <div className={shared.pageHead}>
        <div>
          <h1 className={shared.pageTitle}>Hồ sơ của em</h1>
          <p className={shared.pageSubtitle}>Hiện ở trang “Về em” và trên trang chủ của em.</p>
        </div>
      </div>

      <form className={`${shared.panel} ${shared.form} ${styles.form}`} onSubmit={submit} noValidate>
        <EmojiPicker
          label="Emoji đại diện của em"
          value={form.avatarEmoji}
          onChange={(emoji) => set("avatarEmoji", emoji)}
          presets={AVATAR_PRESETS}
          error={errors.avatarEmoji}
        />

        <div className={shared.formRow}>
          <Field label="Tên" error={errors.name}>
            {(id) => (
              <Input
                id={id}
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                aria-invalid={Boolean(errors.name)}
              />
            )}
          </Field>
          <Field label="Biệt danh" hint="Tên anh hay gọi em" error={errors.nickname}>
            {(id) => (
              <Input id={id} value={form.nickname ?? ""} onChange={(event) => set("nickname", event.target.value)} />
            )}
          </Field>
        </div>

        <Field label="Giới thiệu / lời nhắn" error={errors.bio}>
          {(id) => (
            <Textarea
              id={id}
              placeholder="Vài dòng về em, hoặc điều anh muốn nói với em"
              value={form.bio ?? ""}
              onChange={(event) => set("bio", event.target.value)}
            />
          )}
        </Field>

        <div className={shared.formRow}>
          <Field label="Sinh nhật" error={errors.birthday}>
            {(id) => (
              <Input
                id={id}
                type="date"
                value={form.birthday ?? ""}
                onChange={(event) => set("birthday", event.target.value || null)}
              />
            )}
          </Field>
          <Field label="Ngày yêu nhau" hint="Dùng để đếm số ngày bên nhau" error={errors.anniversary}>
            {(id) => (
              <Input
                id={id}
                type="date"
                value={form.anniversary ?? ""}
                onChange={(event) => set("anniversary", event.target.value || null)}
              />
            )}
          </Field>
        </div>

        <div className={styles.favorites}>
          <Field label="Những thứ em thích" hint="Gõ rồi nhấn Enter để thêm" error={errors.favorites ?? errors["favorites.0"]}>
            {(id) => (
              <div className={styles.favoriteInputRow}>
                <Input
                  id={id}
                  placeholder="Ví dụ: Trà sữa"
                  value={favoriteDraft}
                  onChange={(event) => setFavoriteDraft(event.target.value)}
                  onKeyDown={onFavoriteKey}
                />
                <Button variant="ghost" onClick={addFavorite} disabled={!favoriteDraft.trim()}>
                  Thêm
                </Button>
              </div>
            )}
          </Field>
          <motion.ul className={styles.chips} layout>
            <AnimatePresence initial={false}>
              {favorites.map((favorite) => (
                <motion.li
                  key={favorite}
                  layout
                  className={styles.chip}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={spring.bouncy}
                >
                  {favorite}
                  <button
                    type="button"
                    aria-label={`Xoá ${favorite}`}
                    onClick={() => set("favorites", favorites.filter((item) => item !== favorite))}
                  >
                    ✕
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>

        <FormError message={apiFormError(update.error)} />
        <div className={shared.formActions}>
          <Button type="submit" loading={update.isPending}>
            Lưu hồ sơ
          </Button>
          <AnimatePresence>
            {update.isSuccess && (
              <motion.span
                className={shared.saved}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
              >
                ✓ Đã lưu
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </form>
    </>
  );
}
