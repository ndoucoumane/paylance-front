import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

type Tab = { id: string; label: string; content: ReactNode };

type Props = { tabs: Tab[]; label: string; className?: string };

/** Onglets accessibles (motif ARIA tabs, navigation au clavier avec les flèches). */
export function Tabs({ tabs, label, className = '' }: Props) {
  const baseId = useId();
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = (index: number) => {
    const next = (index + tabs.length) % tabs.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, () => void> = {
      ArrowRight: () => focusTab(index + 1),
      ArrowLeft: () => focusTab(index - 1),
      Home: () => focusTab(0),
      End: () => focusTab(tabs.length - 1),
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        aria-label={label}
        className="flex gap-1 border-b border-white/10 px-2 pt-2"
      >
        {tabs.map((tab, index) => {
          const selected = index === active;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-onglet-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panneau-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`-mb-px rounded-t-md border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                selected
                  ? 'border-primary text-white'
                  : 'border-transparent text-ink-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab, index) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${baseId}-panneau-${tab.id}`}
          aria-labelledby={`${baseId}-onglet-${tab.id}`}
          hidden={index !== active}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
