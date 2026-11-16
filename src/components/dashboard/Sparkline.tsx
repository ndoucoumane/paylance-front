import { useId } from 'react';

/** Mini-courbe décorative (la valeur est donnée en texte à côté). */
export function Sparkline({ values, className = '' }: { values: number[]; className?: string }) {
  const id = useId().replace(/:/g, '');
  if (values.length < 2) return null;
  const width = 120;
  const height = 36;
  const max = Math.max(...values, 1);
  const step = width / (values.length - 1);
  const points = values.map(
    (value, index) => [index * step, height - 3 - (value / max) * (height - 6)] as const,
  );
  const line = points
    .map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ');
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
    >
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0E9F6E" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0E9F6E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${line} L${width} ${height} L0 ${height} Z`} fill={`url(#spark-${id})`} />
      <path
        d={line}
        fill="none"
        stroke="#0E9F6E"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
