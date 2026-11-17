import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

/**
 * Tokens Paylance.
 * Contrastes vérifiés (WCAG AA) :
 * - blanc sur primary.strong (#0B7F58) ≈ 5,0:1 → boutons et liens sur fond clair
 * - primary (#0E9F6E) sur ink (#0A0A0A) ≈ 5,5:1 → accents sur fond sombre
 * - primary (#0E9F6E) avec texte blanc ≈ 3,4:1 → réservé aux grandes surfaces / icônes
 * - accent (#F5A524) : uniquement sur fond ink ; sur fond clair, utiliser accent.strong
 */
const SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
/** Couleur lue dans une variable CSS (voir index.css) : permet le mode sombre de l'espace pro. */
const v = (name: string) => `rgb(var(--c-${name}) / <alpha-value>)`;
const palette = (name: string) =>
  Object.fromEntries(SHADES.map((shade) => [shade, v(`${name}-${shade}`)]));

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        white: v('white'),
        neutral: palette('neutral'),
        emerald: palette('emerald'),
        violet: palette('violet'),
        sky: palette('sky'),
        red: palette('red'),
        amber: palette('amber'),
        // Gris neutres (sans teinte bleue) : structure, texte et zones sombres.
        ink: {
          DEFAULT: '#0A0A0A',
          800: '#171717',
          700: '#262626',
          600: '#404040',
          muted: '#A3A3A3',
        },
        surface: {
          DEFAULT: '#F6F6F4',
          card: '#FFFFFF',
          line: '#E5E5E5',
          'line-strong': '#A3A3A3',
        },
        content: {
          DEFAULT: v('content'),
          body: v('content-body'),
          muted: v('content-muted'),
        },
        primary: {
          DEFAULT: v('primary'),
          strong: v('primary-strong'),
          hover: v('primary-hover'),
          soft: v('primary-soft'),
          bright: v('primary-bright'),
        },
        accent: {
          DEFAULT: '#F5A524',
          soft: v('accent-soft'),
          strong: v('accent-strong'),
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
        display: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
        // Numéros de transaction, références : chiffres bien distincts (0/O, 1/l).
        mono: ['"JetBrains Mono"', ...defaultTheme.fontFamily.mono],
      },
      maxWidth: {
        content: '72rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)',
        float: '0 16px 40px -12px rgba(10, 10, 10, 0.18), 0 0 0 1px rgba(10, 10, 10, 0.05)',
      },
    },
  },
  plugins: [],
} satisfies Config;
