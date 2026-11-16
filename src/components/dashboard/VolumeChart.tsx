import { useId, useState, type PointerEvent } from 'react';
import { dashboard as t } from '../../content/dashboard.fr';
import { formatMoney, formatShortDate } from '../../lib/format';

type Props = { volume: number[]; counts: number[]; currency: string; periodLabel: string };

const W = 640;
const H = 220;
const PAD_TOP = 12;
const PAD_BOTTOM = 4;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

/** Courbe du volume encaissé par jour, avec info-bulle au survol et au clavier. */
export function VolumeChart({ volume, counts, currency, periodLabel }: Props) {
  const gradient = `vol-${useId().replace(/:/g, '')}`;
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...volume));
  const step = W / Math.max(1, volume.length - 1);
  const y = (value: number) => PAD_TOP + (H - PAD_TOP - PAD_BOTTOM) * (1 - value / max);
  const points = volume.map((value, index) => [index * step, y(value)] as const);
  const line = points
    .map(([px, py], index) => `${index ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`)
    .join(' ');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayOf = (index: number) =>
    new Date(today.getTime() - (volume.length - 1 - index) * 86_400_000);
  const total = volume.reduce((sum, value) => sum + value, 0);
  const ticks = [1, 0.5, 0].map((ratio) => max * ratio);
  const labelEvery = Math.ceil(volume.length / 6);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    setActive(Math.max(0, Math.min(volume.length - 1, Math.round(ratio * (volume.length - 1)))));
  };

  const activePoint = active === null ? null : points[active];

  return (
    <section
      aria-labelledby="courbe-volume"
      className="rounded-2xl bg-white p-5 ring-1 ring-neutral-200 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="courbe-volume" className="text-base font-semibold text-neutral-950">
            {t.chart.title}
          </h2>
          <p className="mt-0.5 text-sm text-neutral-500">{t.chart.subtitle(periodLabel)}</p>
        </div>
        <p className="text-right">
          <span className="block text-xl font-semibold tabular-nums tracking-tight text-neutral-950">
            {formatMoney(total, currency)}
          </span>
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <div className="flex h-[220px] flex-col justify-between py-1 text-right text-[0.6875rem] tabular-nums text-neutral-400">
          {ticks.map((tick) => (
            <span key={tick}>
              {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(tick / 100)}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          {/* Survol à la souris uniquement : le total de la période est donné en texte ci-dessus. */}
          <div
            aria-hidden="true"
            className="relative h-[220px] touch-none"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setActive(null)}
          >
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <defs>
                <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0E9F6E" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#0E9F6E" stopOpacity="0" />
                </linearGradient>
              </defs>
              {ticks.map((tick) => (
                <line
                  key={tick}
                  x1="0"
                  x2={W}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke={tick === 0 ? '#E5E5E5' : '#F0F0F0'}
                  strokeDasharray={tick === 0 ? undefined : '3 4'}
                  vectorEffect="non-scaling-stroke"
                />
              ))}
              <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={`url(#${gradient})`} />
              <path
                d={line}
                fill="none"
                stroke="#0E9F6E"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {activePoint && (
                <line
                  x1={activePoint[0]}
                  x2={activePoint[0]}
                  y1={PAD_TOP}
                  y2={H}
                  stroke="#A3A3A3"
                  strokeDasharray="2 3"
                  vectorEffect="non-scaling-stroke"
                />
              )}
            </svg>
            {activePoint && active !== null && (
              <>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow"
                  style={{
                    left: `${(activePoint[0] / W) * 100}%`,
                    top: `${(activePoint[1] / H) * 100}%`,
                  }}
                />
                <div
                  className="pointer-events-none absolute top-0 z-10 w-max -translate-x-1/2 rounded-lg bg-neutral-950 px-3 py-2 text-xs text-white shadow-float"
                  style={{ left: `clamp(70px, ${(activePoint[0] / W) * 100}%, calc(100% - 70px))` }}
                >
                  <span className="block text-neutral-400">{formatShortDate(dayOf(active))}</span>
                  <span className="mt-0.5 block font-semibold tabular-nums">
                    {formatMoney(volume[active] ?? 0, currency)}
                  </span>
                  <span className="block text-neutral-400">
                    {t.chart.tooltipCount(counts[active] ?? 0)}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="mt-2 flex justify-between text-[0.6875rem] tabular-nums text-neutral-400">
            {volume.map((_, index) =>
              index % labelEvery === 0 || index === volume.length - 1 ? (
                <span
                  key={index}
                  className={index === volume.length - 1 ? 'font-medium text-neutral-600' : ''}
                >
                  {formatShortDate(dayOf(index))}
                </span>
              ) : null,
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
