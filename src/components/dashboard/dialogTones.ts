export type DialogTone = 'emerald' | 'violet' | 'sky';

/** Chaque formulaire a sa couleur : encaisser (vert), rembourser (violet), programmer (bleu). */
export const toneStyles: Record<
  DialogTone,
  {
    chip: string;
    row: string;
    selected: string;
    soft: string;
    accent: string;
    text: string;
    button: string;
  }
> = {
  emerald: {
    row: 'bg-emerald-50/70',
    chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    selected: 'ring-2 ring-emerald-600 bg-emerald-50/40',
    soft: 'bg-emerald-50/70 ring-emerald-600/15',
    accent: 'accent-emerald-700',
    text: 'text-emerald-900',
    button: 'bg-emerald-700 text-white ring-emerald-700',
  },
  violet: {
    row: 'bg-violet-50/70',
    chip: 'bg-violet-50 text-violet-700 ring-violet-600/15',
    selected: 'ring-2 ring-violet-600 bg-violet-50/40',
    soft: 'bg-violet-50/70 ring-violet-600/15',
    accent: 'accent-violet-700',
    text: 'text-violet-900',
    button: 'bg-violet-700 text-white ring-violet-700',
  },
  sky: {
    row: 'bg-sky-50/70',
    chip: 'bg-sky-50 text-sky-700 ring-sky-600/15',
    selected: 'ring-2 ring-sky-600 bg-sky-50/40',
    soft: 'bg-sky-50/70 ring-sky-600/15',
    accent: 'accent-sky-700',
    text: 'text-sky-900',
    button: 'bg-sky-700 text-white ring-sky-700',
  },
};
