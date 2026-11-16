import { Link } from 'react-router-dom';
import type { AvailableLink } from '../../lib/nav';
import { icons } from '../ui/icons';

type Props = {
  item: AvailableLink;
  /** `panel` = méga-menu et menu mobile (fond clair), `footer` = pied de page (fond sombre). */
  variant: 'panel' | 'footer';
};

/** Lien de navigation (les éléments sans `href` sont filtrés en amont, voir lib/nav). */
export function NavLinkItem({ item, variant }: Props) {
  if (variant === 'footer') {
    return (
      <Link
        to={item.href}
        className="rounded text-sm text-neutral-400 transition-colors hover:text-white"
      >
        {item.label}
      </Link>
    );
  }

  const Icon = item.icon ? icons[item.icon] : null;
  return (
    <Link
      to={item.href}
      className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-surface"
    >
      {Icon && (
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-strong">
          <Icon aria-hidden="true" className="h-[1.125rem] w-[1.125rem]" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-content">{item.label}</span>
        {item.description && (
          <span className="mt-0.5 block text-[0.8125rem] leading-snug text-content-muted">
            {item.description}
          </span>
        )}
      </span>
    </Link>
  );
}
