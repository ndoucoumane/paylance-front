import type { PaymentStatus } from '../services/payments/types';

/** Textes de la vue d'ensemble (transactions), en français. */
export const dashboard = {
  periods: { 7: '7 jours', 30: '30 jours', 90: '90 jours' } as Record<7 | 30 | 90, string>,
  periodsShort: { 7: '7 j', 30: '30 j', 90: '90 j' } as Record<7 | 30 | 90, string>,
  periodLabel: 'Période',
  export: 'Exporter',
  exporting: 'Export…',
  vsPrevious: 'vs période précédente',
  noComparison: 'Pas de période précédente',

  kpis: {
    volume: 'Volume encaissé',
    count: 'Transactions',
    successRate: 'Taux de réussite',
    successRateHint: 'Paiements aboutis parmi les paiements terminés',
    refunded: 'Remboursé',
    refundedCount: (count: number) => `${count} remboursement${count > 1 ? 's' : ''}`,
  },

  chart: {
    title: 'Volume encaissé',
    subtitle: (period: string) => `Par jour, sur ${period}`,
    unavailable:
      'La courbe quotidienne sera disponible lorsque le serveur exposera une série par jour.',
    tooltipCount: (count: number) => `${count} transaction${count > 1 ? 's' : ''}`,
  },

  breakdown: {
    title: 'Répartition',
    byProvider: 'Par opérateur (nombre de transactions)',
    byStatus: 'Par statut',
    empty: 'Aucune donnée sur la période.',
  },

  table: {
    title: 'Transactions',
    subtitle: (count: number) =>
      `${new Intl.NumberFormat('fr-FR').format(count)} transaction${count > 1 ? 's' : ''} sur la période`,
    search: 'N° de transaction, téléphone, référence',
    searchLabel: 'Rechercher une transaction',
    providerAll: 'Tous les opérateurs',
    providerLabel: 'Opérateur',
    tabsLabel: 'Filtrer par statut',
    tabs: {
      ALL: 'Toutes',
      SUCCESS: 'Réussies',
      PENDING: 'En attente',
      FAILED: 'Échouées',
      REFUNDED: 'Remboursées',
    },
    columns: {
      transaction: 'Transaction',
      customer: 'Client',
      provider: 'Opérateur',
      amount: 'Montant',
      status: 'Statut',
      actions: 'Actions',
    },
    test: 'Test',
    partiallyRefunded: (amount: string) => `${amount} remboursé`,
    emptyTitle: 'Aucune transaction',
    emptyFiltered: 'Aucune transaction ne correspond à ces filtres.',
    emptyPeriod: 'Aucune transaction sur cette période.',
    resetFilters: 'Effacer les filtres',
    range: (from: number, to: number, total: number) =>
      `${from}–${to} sur ${new Intl.NumberFormat('fr-FR').format(total)}`,
    previous: 'Page précédente',
    next: 'Page suivante',
    openDetail: (number: string) => `Voir le détail de la transaction ${number}`,
  },

  actions: {
    label: (number: string) => `Actions pour la transaction ${number}`,
    view: 'Voir le détail',
    copyNumber: 'Copier le numéro',
    copyPhone: 'Copier le téléphone',
    refund: 'Rembourser',
    refundUnavailable: 'Seul un paiement réussi peut être remboursé',
    copied: 'Copié dans le presse-papiers',
  },

  drawer: {
    close: 'Fermer',
    amount: 'Montant',
    details: 'Détails',
    fields: {
      number: 'N° de transaction',
      reference: 'Référence commande',
      provider: 'Opérateur',
      environment: 'Environnement',
      phone: 'Téléphone du client',
      createdAt: 'Créée le',
      paidAt: 'Payée le',
      failure: 'Motif de l’échec',
      id: 'Identifiant technique',
    },
    environments: { TEST: 'Test', LIVE: 'Production' },
    timeline: 'Chronologie',
    refunds: 'Remboursements',
    noRefunds: 'Aucun remboursement.',
    refundBy: (who: string) => `par ${who}`,
    triggeredBy: {
      API: 'API',
      WEBHOOK: 'Prestataire',
      RECONCILIATION: 'Rapprochement',
      MANUAL: 'Action manuelle',
    } as Record<string, string>,
    refund: 'Rembourser',
    refundable: (amount: string) => `${amount} remboursable`,
  },

  refund: {
    title: 'Rembourser le paiement',
    summary: (number: string) => `Transaction ${number}`,
    remaining: 'Montant remboursable',
    mode: 'Montant à rembourser',
    full: 'Remboursement total',
    partial: 'Remboursement partiel',
    partialUnavailable: 'Wave ne permet que le remboursement total d’un paiement.',
    amount: 'Montant',
    amountInvalid: (max: string) => `Saisissez un montant entre 1 et ${max}.`,
    reason: 'Motif',
    reasonHint: 'Visible dans l’historique du paiement.',
    reasonRequired: 'Indiquez le motif du remboursement.',
    reasons: ['Commande annulée', 'Produit indisponible', 'Erreur de montant', 'Geste commercial'],
    warning:
      'Le remboursement est exécuté depuis votre compte marchand et ne peut pas être annulé.',
    cancel: 'Annuler',
    submit: (amount: string) => `Rembourser ${amount}`,
    success: 'Remboursement effectué',
    errorTitle: 'Remboursement impossible',
  },

  statuses: {
    PENDING: 'En attente',
    PROCESSING: 'En cours',
    SUCCESS: 'Réussi',
    FAILED: 'Échoué',
    EXPIRED: 'Expiré',
    REFUNDED: 'Remboursé',
    PARTIALLY_REFUNDED: 'Remb. partiel',
    CANCELLED: 'Annulé',
  } satisfies Record<PaymentStatus, string>,

  refundStatuses: { PENDING: 'En cours', SUCCESS: 'Effectué', FAILED: 'Échoué' },
};
