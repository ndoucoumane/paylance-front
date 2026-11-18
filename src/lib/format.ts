const numberFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/**
 * Intl sépare les milliers par une espace fine insécable (U+202F). Plusieurs polices, dont
 * Plus Jakarta Sans, la dessinent quasi nulle : « 120500FCFA ». On la remplace par une
 * espace insécable classique (U+00A0), toujours visible et qui ne coupe pas le montant.
 */
const readable = (value: string) => value.replace(/\u202f/g, '\u00a0');

/** 18450000 → « 18 450 000 » (espaces insécables). */
export function formatNumber(value: number): string {
  return readable(numberFormat.format(value));
}

/** 25000 → « 25 000 FCFA ». */
export function formatFCFA(value: number): string {
  return `${formatNumber(value)}\u00A0FCFA`;
}

const moneyFormats = new Map<string, Intl.NumberFormat>();

/** Montant en centimes (convention du backend) → « 25 000 F CFA ». */
export function formatMoney(cents: number, currency = 'XOF'): string {
  let format = moneyFormats.get(currency);
  if (!format) {
    format = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'XOF' || currency === 'XAF' || currency === 'GNF' ? 0 : 2,
    });
    moneyFormats.set(currency, format);
  }
  return readable(format.format(cents / 100));
}

/** Montant sans devise, pour les colonnes alignées : « 25 000 ». */
export function formatAmount(cents: number): string {
  return formatNumber(Math.round(cents / 100));
}

/** Symbole court de la devise : XOF → « F CFA ». */
export function currencyLabel(currency: string): string {
  return currency === 'XOF' || currency === 'XAF' ? 'F CFA' : currency;
}

const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const longDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

/** « 16 nov. · 10:42 » */
export function formatShortDateTime(iso: string): string {
  const date = new Date(iso);
  return `${shortDate.format(date)} · ${time.format(date)}`;
}

/** « 16 novembre 2026 à 10:42 » */
export function formatLongDateTime(iso: string): string {
  return longDate.format(new Date(iso));
}

export function formatShortDate(date: Date): string {
  return shortDate.format(date);
}

/** « +221771234567 » → « +221 77 123 45 67 » (numéros à 9 chiffres locaux). */
export function formatPhone(phone: string | null): string {
  if (!phone) return '—';
  const match = /^(\+\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return match ? match.slice(1).join(' ') : phone;
}

/** « 0,124 » → « +12,4 % » */
export function formatPercent(ratio: number, signed = false): string {
  const value = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(Math.abs(ratio) * 100);
  return readable(`${sign(ratio, signed)}${value}\u00a0%`);
}

function sign(ratio: number, signed: boolean): string {
  return signed ? (ratio > 0 ? '+' : ratio < 0 ? '−' : '') : ratio < 0 ? '−' : '';
}
