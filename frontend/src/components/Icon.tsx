/** Material Symbols Outlined wrapper — keeps icon usage typo-checked and
 * consistent (fill/weight handled by the shared .material-symbols-outlined
 * rule in index.css). Icon names: https://fonts.google.com/icons */
export function Icon({
  name,
  className = "",
  filled = false,
  size,
  color,
}: {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
  color?: string;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        fontSize: size,
        color,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
