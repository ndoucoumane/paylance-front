import { Link } from 'react-router-dom';
import { fr } from '../../content/fr';
import logoFull from '../../assets/images/paylance-logo-full.png';
import logoFullWhite from '../../assets/images/paylance-logo-full-white.png';
import logoMark from '../../assets/images/paylance-mark.png';

type Tone = 'dark' | 'light';
type Size = 'sm' | 'md' | 'lg';

/** Hauteurs du logo complet (ratio ≈ 6,1:1) et du symbole carré. */
const FULL_HEIGHT: Record<Size, string> = {
  sm: 'h-5',
  md: 'h-6 sm:h-7',
  lg: 'h-8 sm:h-9',
};
const MARK_SIZE: Record<Size, string> = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
};

type MarkProps = { size?: Size; className?: string };

/** Symbole Paylance seul (trois barres), décoratif. */
export function LogoMark({ size = 'md', className = '' }: MarkProps) {
  return (
    <img
      src={logoMark}
      alt=""
      aria-hidden="true"
      width={256}
      height={256}
      draggable={false}
      className={`${MARK_SIZE[size]} shrink-0 select-none object-contain ${className}`}
    />
  );
}

type ImageProps = { tone?: Tone; size?: Size; className?: string };

/**
 * Logo complet sans lien. `tone="light"` (fond clair) bascule seul sur la version blanche
 * quand le thème sombre de l'espace pro est actif ; `tone="dark"` = toujours la version blanche.
 */
export function LogoImage({ tone = 'light', size = 'md', className = '' }: ImageProps) {
  const img = `${FULL_HEIGHT[size]} w-auto max-w-none select-none`;
  if (tone === 'dark') {
    return (
      <img
        src={logoFullWhite}
        alt={fr.common.brand}
        width={720}
        height={118}
        draggable={false}
        className={`${img} ${className}`}
      />
    );
  }
  return (
    <span className={`logo-auto inline-flex ${className}`}>
      <img
        src={logoFull}
        alt={fr.common.brand}
        width={720}
        height={118}
        draggable={false}
        className={`logo-on-light ${img}`}
      />
      <img
        src={logoFullWhite}
        alt=""
        aria-hidden="true"
        width={720}
        height={118}
        draggable={false}
        className={`logo-on-dark ${img}`}
      />
    </span>
  );
}

type Props = ImageProps & {
  /** `compact` = symbole seul sous 400 px de large (en-têtes chargés). */
  compact?: boolean;
  to?: string;
};

/** Logo Paylance cliquable (retour à l'accueil par défaut). */
export function Logo({
  tone = 'light',
  size = 'md',
  compact = false,
  to = '/',
  className = '',
}: Props) {
  return (
    <Link
      to={to}
      aria-label={fr.common.brandHome}
      className={`inline-flex shrink-0 items-center rounded-md ${className}`}
    >
      {compact && <LogoMark size={size} className="min-[400px]:hidden" />}
      <LogoImage
        tone={tone}
        size={size}
        className={compact ? 'hidden min-[400px]:inline-flex' : ''}
      />
    </Link>
  );
}
