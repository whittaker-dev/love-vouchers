import styles from "./Avatar.module.css";

interface AvatarProps {
  emoji: string;
  name: string;
  size?: number;
  className?: string;
}

/** Round avatar showing her chosen emoji on a blush background. */
export function Avatar({ emoji, name, size = 56, className }: AvatarProps) {
  return (
    <span
      className={[styles.avatar, className].filter(Boolean).join(" ")}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      role="img"
      aria-label={name}
    >
      {emoji}
    </span>
  );
}
