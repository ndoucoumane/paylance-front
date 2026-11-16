import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fr } from '../../content/fr';

type Props = { code: string; label: string };

type CopyState = 'idle' | 'copied' | 'failed';

/** Bloc de code défilant, avec bouton « Copier ». */
export function CodeBlock({ code, label }: Props) {
  const [copyState, setCopyState] = useState<CopyState>('idle');

  useEffect(() => {
    if (copyState === 'idle') return;
    const timer = window.setTimeout(() => setCopyState('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  const feedback =
    copyState === 'copied'
      ? fr.common.copied
      : copyState === 'failed'
        ? fr.common.copyFailed
        : fr.common.copy;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs font-medium text-white hover:bg-white/20"
      >
        {copyState === 'copied' ? (
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <Copy aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        <span aria-live="polite">{feedback}</span>
      </button>
      <pre
        // La zone défilante doit être atteignable au clavier.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        aria-label={label}
        className="code-scroll overflow-x-auto p-4 pt-11 text-[0.8125rem] leading-relaxed text-slate-100"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
