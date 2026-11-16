import { Link } from 'react-router-dom';
import { fr } from '../../content/fr';

type Props = { tone?: 'dark' | 'light'; className?: string };

/** Logo texte Paylance. `tone="dark"` = sur fond encre. */
export function Logo({ tone = 'dark', className = '' }: Props) {
  return (
    <Link
      to="/"
      aria-label={fr.common.brandHome}
      className={`inline-flex items-center gap-2 rounded-md font-display text-xl font-bold tracking-tight ${
        tone === 'dark' ? 'text-white' : 'text-content'
      } ${className}`}
    >
      <svg aria-hidden="true" viewBox="0 0 32 32" className="h-7 w-7">
        <rect width="32" height="32" rx="7" fill={tone === 'dark' ? '#262626' : '#0A0A0A'} />
        <path
          fill="#0E9F6E"
          d="M10 7h7.5a6.5 6.5 0 0 1 0 13H14v5h-4V7zm4 4v5h3.3a2.5 2.5 0 0 0 0-5H14z"
        />
        <circle cx="23" cy="24" r="2.2" fill="#F5A524" />
      </svg>
      {fr.common.brand}
    </Link>
  );
}
