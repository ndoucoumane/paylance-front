import { ChevronDown } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';

type Item = { title: string; content: ReactNode };

type Props = {
  items: Item[];
  /** Niveau de titre des en-têtes (h3 par défaut). */
  headingLevel?: 'h3' | 'h4';
  className?: string;
};

/** Accordéon accessible (motif « disclosure » : bouton + aria-expanded/aria-controls). */
export function Accordion({ items, headingLevel: Heading = 'h3', className = '' }: Props) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={`divide-y divide-surface-line border-y border-surface-line ${className}`}>
      {items.map((item, index) => {
        const open = openIndex === index;
        const buttonId = `${baseId}-bouton-${index}`;
        const panelId = `${baseId}-panneau-${index}`;
        return (
          <div key={item.title}>
            <Heading className="m-0">
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left font-display text-base font-semibold text-content hover:text-primary-strong sm:text-lg"
              >
                {item.title}
                <ChevronDown
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 text-content-muted transition-transform duration-200 ${
                    open ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </Heading>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="pb-5 pr-9 leading-relaxed text-content-body"
            >
              {item.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
