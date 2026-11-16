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
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
          DEFAULT: '#0A0A0A',
          body: '#525252',
          muted: '#6B6B6B',
        },
        primary: {
          DEFAULT: '#0E9F6E',
          strong: '#0B7F58',
          hover: '#096B4A',
          soft: '#E8F6F0',
          bright: '#34D399',
        },
        accent: {
          DEFAULT: '#F5A524',
          soft: '#FEF3DC',
          strong: '#8A5A00',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
        display: ['"Plus Jakarta Sans"', ...defaultTheme.fontFamily.sans],
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
