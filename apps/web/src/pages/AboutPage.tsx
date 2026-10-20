import { motion } from "framer-motion";
import { useProfile } from "../api/hooks";
import { Avatar } from "../components/Avatar";
import { CountUp } from "../components/CountUp";
import { RevealText } from "../components/RevealText";
import { ErrorState, LoadingText } from "../components/StateViews";
import { daysSince, daysUntilNextOccurrence, formatDate } from "../lib/format";
import { useIntroDone } from "../lib/intro";
import { fadeUp, spring, staggerChildren } from "../lib/motion";
import styles from "./AboutPage.module.css";

export function AboutPage() {
  const play = useIntroDone();
  const profile = useProfile();

  if (profile.isPending) return <LoadingText />;
  if (profile.isError) {
    return (
      <div className="container">
        <ErrorState error={profile.error} />
      </div>
    );
  }

  const { name, nickname, avatarEmoji, bio, birthday, anniversary, favorites, partnerName } = profile.data;

  return (
    <section className={`container ${styles.page}`}>
      <div className={styles.intro}>
        <motion.div
          className={styles.avatarWrap}
          initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
          animate={play ? { scale: 1, opacity: 1, rotate: -3 } : undefined}
          whileHover={{ rotate: 3, scale: 1.04 }}
          transition={spring.bouncy}
        >
          <Avatar emoji={avatarEmoji} name={name} size={180} className={styles.avatar} />
          <motion.span
            className={styles.avatarHeart}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 1 }}
            aria-hidden
          >
            ♥
          </motion.span>
        </motion.div>
        <div>
          <p className="eyebrow">Hồ sơ của người đặc biệt nhất</p>
          <RevealText className={styles.name} text={name} play={play} delay={0.1} />
          {nickname && (
            <motion.p
              className={styles.nickname}
              initial={{ opacity: 0, y: 8 }}
              animate={play ? { opacity: 1, y: 0 } : undefined}
              transition={{ delay: 0.5 }}
            >
              {partnerName} hay gọi là <strong>“{nickname}”</strong>
            </motion.p>
          )}
        </div>
      </div>

      {bio && (
        <motion.blockquote
          className={styles.bio}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <span className={styles.quoteMark} aria-hidden>
            “
          </span>
          {bio}
        </motion.blockquote>
      )}

      <motion.dl
        className={styles.facts}
        variants={staggerChildren(0.1)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {birthday && (
          <motion.div className={styles.fact} variants={fadeUp} whileHover={{ y: -4 }}>
            <dt className="eyebrow">🎂 Sinh nhật</dt>
            <dd className={styles.factValue}>{formatDate(birthday)}</dd>
            <dd className={styles.factNote}>{countdownLabel(daysUntilNextOccurrence(birthday), "sinh nhật")}</dd>
          </motion.div>
        )}
        {anniversary && (
          <motion.div className={styles.fact} variants={fadeUp} whileHover={{ y: -4 }}>
            <dt className="eyebrow">💞 Ngày yêu nhau</dt>
            <dd className={styles.factValue}>
              <CountUp value={Math.max(0, daysSince(anniversary))} /> ngày
            </dd>
            <dd className={styles.factNote}>
              Từ {formatDate(anniversary)} · {countdownLabel(daysUntilNextOccurrence(anniversary), "kỷ niệm")}
            </dd>
          </motion.div>
        )}
      </motion.dl>

      {favorites.length > 0 && (
        <div className={styles.favorites}>
          <p className="eyebrow">Ghi nhớ</p>
          <h2 className={styles.favoritesTitle}>Những thứ em thích</h2>
          <motion.ul
            className={styles.chips}
            variants={staggerChildren(0.05)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {favorites.map((favorite) => (
              <motion.li
                key={favorite}
                className={styles.chip}
                variants={{
                  hidden: { opacity: 0, scale: 0.6, y: 10 },
                  visible: { opacity: 1, scale: 1, y: 0, transition: spring.bouncy },
                }}
                whileHover={{ rotate: -4, scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {favorite}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      )}
    </section>
  );
}

function countdownLabel(days: number, occasion: string): string {
  return days === 0 ? `Hôm nay là ${occasion}! 🎉` : `còn ${days} ngày nữa đến ${occasion}`;
}
