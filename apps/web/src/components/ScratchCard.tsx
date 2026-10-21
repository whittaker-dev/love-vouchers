import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { GreetingDto } from "@love/shared";
import { useGreeting } from "../api/hooks";
import { formatDate } from "../lib/format";
import { duration, easeOut, spring } from "../lib/motion";
import { HeartBurst } from "./HeartBurst";
import { Skeleton } from "./StateViews";
import styles from "./ScratchCard.module.css";

/** Share of the foil that must be scratched off before the card reveals itself. */
const REVEAL_AT = 0.5;
const BRUSH_RADIUS = 24;

const scratchedKey = (date: string) => `lv-scratched:${date}`;

function wasScratched(date: string): boolean {
  try {
    return localStorage.getItem(scratchedKey(date)) === "1";
  } catch {
    return false;
  }
}

/** "Thẻ cào may mắn": today's greeting under a pink foil she scratches off with a finger. */
export function ScratchCard() {
  const greeting = useGreeting();
  return (
    <section className={`container ${styles.section}`} aria-labelledby="scratch-heading">
      <motion.div
        className={styles.head}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: duration.slow, ease: easeOut }}
      >
        <p className="eyebrow">Thẻ cào may mắn</p>
        <h2 id="scratch-heading" className={styles.title}>
          Lời chúc hôm nay
        </h2>
      </motion.div>
      {greeting.data ? (
        // Keyed by date: a new day gets a fresh, unscratched card.
        <Card key={greeting.data.date} greeting={greeting.data} />
      ) : (
        <Skeleton height={200} radius={24} />
      )}
    </section>
  );
}

function Card({ greeting }: { greeting: GreetingDto }) {
  const [revealed, setRevealed] = useState(() => wasScratched(greeting.date));
  const [justRevealed, setJustRevealed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const strokes = useRef(0);

  const reveal = useCallback(() => {
    setRevealed(true);
    setJustRevealed(true);
    try {
      localStorage.setItem(scratchedKey(greeting.date), "1");
    } catch {
      // Private mode: she can scratch it again next time, no harm done.
    }
  }, [greeting.date]);

  // Paint the foil at the canvas' real pixel size.
  useEffect(() => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const paint = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, "#f7a8c0");
      gradient.addColorStop(0.5, "#e85d80");
      gradient.addColorStop(1, "#f4a3bd");
      context.fillStyle = gradient;
      context.fillRect(0, 0, rect.width, rect.height);
      // Scattered sparkles so it reads as a scratch-off foil, not a plain button.
      context.fillStyle = "rgba(255, 255, 255, 0.35)";
      context.font = "14px sans-serif";
      for (let i = 0; i < 40; i++) {
        context.fillText(i % 3 === 0 ? "♥" : "✦", Math.random() * rect.width, Math.random() * rect.height);
      }
      context.fillStyle = "#fff";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = '800 18px "Be Vietnam Pro", sans-serif';
      context.fillText("Cào nhẹ để nhận lời chúc ✨", rect.width / 2, rect.height / 2);
    };
    paint();
    // Fonts may finish loading after the first paint; repaint once while untouched.
    void document.fonts?.ready.then(() => strokes.current === 0 && paint());
  }, [revealed]);

  function pointFrom(event: ReactPointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function scratch(event: ReactPointerEvent<HTMLCanvasElement>) {
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const point = pointFrom(event);
    context.globalCompositeOperation = "destination-out";
    context.lineWidth = BRUSH_RADIUS * 2;
    context.lineCap = "round";
    context.beginPath();
    const from = lastPoint.current ?? point;
    context.moveTo(from.x, from.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPoint.current = point;

    // Measuring every pixel on every move is wasteful; sample every few strokes.
    strokes.current++;
    if (strokes.current % 6 === 0 && clearedShare(event.currentTarget) >= REVEAL_AT) reveal();
  }

  return (
    <motion.div
      className={styles.card}
      initial={{ opacity: 0, y: 30, rotate: -1.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={spring.soft}
    >
      <div className={styles.content}>
        {justRevealed && <HeartBurst />}
        <motion.span
          className={styles.emoji}
          animate={revealed ? { scale: [0.4, 1.3, 1], rotate: [0, -15, 0] } : { scale: 1 }}
          transition={{ duration: 0.6 }}
          aria-hidden
        >
          {greeting.emoji}
        </motion.span>
        <motion.p
          className={styles.text}
          initial={false}
          animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: duration.base, ease: easeOut, delay: revealed ? 0.15 : 0 }}
        >
          {greeting.text}
        </motion.p>
        <motion.span
          className={styles.date}
          initial={false}
          animate={{ opacity: revealed ? 1 : 0 }}
          transition={{ delay: revealed ? 0.3 : 0 }}
        >
          {formatDate(greeting.date)} · mai quay lại nhận lời chúc mới nha 💌
        </motion.span>
      </div>

      <AnimatePresence>
        {!revealed && (
          <motion.canvas
            key="foil"
            ref={canvasRef}
            className={styles.foil}
            onPointerDown={(event) => {
              drawing.current = true;
              lastPoint.current = null;
              event.currentTarget.setPointerCapture(event.pointerId);
              scratch(event);
            }}
            onPointerMove={(event) => drawing.current && scratch(event)}
            onPointerUp={() => {
              drawing.current = false;
            }}
            onPointerCancel={() => {
              drawing.current = false;
            }}
            exit={{ opacity: 0, scale: 1.08, filter: "blur(6px)", transition: { duration: 0.5 } }}
            aria-label="Thẻ cào: cào để xem lời chúc hôm nay"
            role="img"
          />
        )}
      </AnimatePresence>

      {!revealed && (
        <button type="button" className={styles.skip} onClick={reveal}>
          Mở luôn
        </button>
      )}
    </motion.div>
  );
}

/** Fraction of the foil already scratched away, sampled on a coarse grid. */
function clearedShare(canvas: HTMLCanvasElement): number {
  const context = canvas.getContext("2d");
  if (!context || canvas.width === 0 || canvas.height === 0) return 0;
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const step = 16;
  let cleared = 0;
  let total = 0;
  for (let index = 3; index < data.length; index += 4 * step) {
    total++;
    if (data[index]! < 128) cleared++;
  }
  return total ? cleared / total : 0;
}
