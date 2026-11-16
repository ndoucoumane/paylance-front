import type { NavLink, NavMenu } from '../content/fr';

/** Élément cliquable : un lien sans `href` (pas encore disponible) n'est pas affiché. */
export type AvailableLink = NavLink & { href: string };

export function availableLinks(items: NavLink[]): AvailableLink[] {
  return items.filter((item): item is AvailableLink => Boolean(item.href));
}

/** Liens d'un menu déroulant, toutes colonnes confondues, sans les éléments indisponibles. */
export function menuLinks(menu: NavMenu): AvailableLink[] {
  return availableLinks(menu.columns.flatMap((column) => column.items));
}
