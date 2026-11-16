import type { IconName } from '../components/ui/icons';

/**
 * Tout le texte de l'interface, en français.
 * Pour ajouter l'anglais : créer en.ts avec la même forme (type `Content`)
 * et choisir le fichier selon la langue.
 */

export type NavLink = {
  label: string;
  description?: string;
  icon?: IconName;
  /** Lien interne (route ou ancre `/#...`). Absent = pas encore disponible (élément masqué). */
  href?: string;
};

export type NavColumn = { title?: string; items: NavLink[] };

/** Menu déroulant (`columns`) ou lien direct (`href`, sans colonnes). */
export type NavMenu = { id: string; label: string; href?: string; columns: NavColumn[] };

/** Annotation stricte des menus (vérifie chaque élément contre `NavMenu`). */
const defineMenus = (menus: NavMenu[]): NavMenu[] => menus;

const CONTACT_PARTNER_HREF = '/?sujet=partenariat#contact';

export const fr = {
  meta: {
    landingTitle: 'Paylance · Orchestration de paiements Wave et Orange Money',
    notFoundTitle: 'Page introuvable · Paylance',
  },

  common: {
    skipToContent: 'Aller au contenu principal',
    brand: 'Paylance',
    brandHome: 'Paylance, retour à l’accueil',
    currency: 'FCFA',
    illustrativeData: 'Données d’illustration',
    copy: 'Copier',
    copied: 'Copié',
    copyFailed: 'Copie impossible',
  },

  header: {
    navLabel: 'Navigation principale',
    login: 'Se connecter',
    register: 'Créer un compte',
    openMenu: 'Ouvrir le menu',
    closeMenu: 'Fermer le menu',
    menus: defineMenus([
      {
        id: 'produit',
        label: 'Produit',
        columns: [
          {
            items: [
              {
                label: 'Encaissements et liens de paiement',
                description: 'Par API ou par lien partagé',
                icon: 'wallet',
                href: '/#encaissements',
              },
              {
                label: 'Remboursements',
                description: 'Instantanés ou programmés',
                icon: 'undo',
                href: '/#remboursements',
              },
              {
                label: 'Rapprochement',
                description: 'Chaque paiement relié à sa commande',
                icon: 'link',
                href: '/#rapprochement',
              },
            ],
          },
          {
            items: [
              {
                label: 'Tableau de bord et rapports',
                description: 'Vision consolidée et exports',
                icon: 'chart',
                href: '/#tableau-de-bord',
              },
              {
                label: 'API et webhooks',
                description: 'Idempotence, signatures HMAC',
                icon: 'code',
                href: '/#developpeurs',
              },
              {
                label: 'Automatisations',
                description: 'Règles et déclencheurs',
                icon: 'zap',
              },
            ],
          },
        ],
      },
      {
        id: 'ressources',
        label: 'Ressources',
        columns: [
          {
            items: [
              { label: 'Documentation API', description: 'Référence complète', icon: 'book' },
              { label: 'Guides d’intégration', description: 'Pas à pas', icon: 'compass' },
              {
                label: 'FAQ',
                description: 'Les questions fréquentes',
                icon: 'help',
                href: '/#faq',
              },
              {
                label: 'Sécurité',
                description: 'Notre modèle et nos garanties',
                icon: 'shield',
                href: '/#securite',
              },
            ],
          },
        ],
      },
      {
        id: 'partenaires-solutions',
        label: 'Partenaires et Solutions',
        columns: [
          {
            title: 'Solutions',
            items: [
              { label: 'E-commerce', icon: 'cart', href: '/#solution-ecommerce' },
              { label: 'Plateformes SaaS', icon: 'layers', href: '/#solution-saas' },
              { label: 'PME et commerces', icon: 'store', href: '/#solution-pme' },
              { label: 'Agences et prestataires', icon: 'briefcase', href: '/#solution-agences' },
            ],
          },
          {
            title: 'Partenaires',
            items: [
              {
                label: 'Intégrations prestataires',
                description: 'Wave, Orange Money et à venir',
                icon: 'plug',
                href: '/#partenaires',
              },
              {
                label: 'Devenir partenaire',
                description: 'Construisons ensemble',
                icon: 'handshake',
                href: CONTACT_PARTNER_HREF,
              },
            ],
          },
        ],
      },
      {
        id: 'tarifs',
        label: 'Tarifs',
        href: '/#tarifs',
        columns: [],
      },
      {
        id: 'entreprise',
        label: 'Entreprise',
        columns: [
          {
            items: [
              {
                label: 'À propos',
                description: 'Pourquoi Paylance existe',
                icon: 'info',
                href: '/#probleme',
              },
              {
                label: 'Sécurité et conformité',
                description: 'Fonds, données, traçabilité',
                icon: 'lock',
                href: '/#securite',
              },
              {
                label: 'Contact',
                description: 'Écrivez-nous',
                icon: 'mail',
                href: '/#contact',
              },
            ],
          },
        ],
      },
    ]),
  },

  hero: {
    eyebrow: 'Orchestration de paiements · Sénégal',
    title: 'Tous vos paiements mobiles.',
    titleMuted: 'Une seule plateforme.',
    subtitle:
      'Paylance centralise vos encaissements, vos remboursements et votre rapprochement dans une seule interface et une seule API, branchées sur vos propres comptes marchands.',
    primaryCta: 'Demander un accès anticipé',
    secondaryCta: 'Voir comment ça marche',
    scopeTitle: 'Ce que couvre Paylance',
    scope: [
      'Encaissements Wave et Orange Money',
      'Remboursements en quelques clics',
      'Rapprochement automatique',
      'Une API unique pour vos équipes',
      'Tableau de bord en temps réel',
    ],
    previewCaption: 'Aperçu — tableau de bord marchand',
    previewNote: 'Données fictives de démonstration',
    fundsNote: 'Vos fonds restent sur vos comptes marchands.',
  },

  mockup: {
    label:
      'Aperçu illustratif du tableau de bord marchand Paylance : encaissements de novembre en FCFA, évolution quotidienne par opérateur, répartition Wave et Orange Money, et tableau des dernières transactions avec leur statut et leur rapprochement. Données fictives.',
    merchant: 'Boutique Teranga',
    merchantMode: 'Compte marchand',
    nav: [
      { label: 'Vue d’ensemble', icon: 'overview', active: true },
      { label: 'Transactions', icon: 'transactions' },
      { label: 'Remboursements', icon: 'refunds' },
      { label: 'Rapprochement', icon: 'reconciliation' },
      { label: 'Clients', icon: 'customers' },
      { label: 'Développeurs', icon: 'developers' },
    ] satisfies {
      label: string;
      icon: 'overview' | 'transactions' | 'refunds' | 'reconciliation' | 'customers' | 'developers';
      active?: boolean;
    }[],
    title: 'Vue d’ensemble',
    period: 'Novembre 2026',
    search: 'Rechercher une transaction',
    export: 'Exporter',
    kpis: [
      {
        label: 'Encaissé',
        value: '18\u00A0450\u00A0000',
        unit: 'FCFA',
        delta: '+12,4 %',
        note: 'vs octobre',
      },
      { label: 'Transactions', value: '1\u00A0284', delta: '+8,1 %', note: 'vs octobre' },
      { label: 'Taux de réussite', value: '98,2', unit: '%', delta: '+0,6 pt', note: 'vs octobre' },
      {
        label: 'Rapprochées auto.',
        value: '96',
        unit: '%',
        delta: '1\u00A0231',
        note: 'sur 1\u00A0284',
      },
    ] satisfies { label: string; value: string; unit?: string; delta: string; note: string }[],
    chartTitle: 'Encaissements quotidiens',
    chartSubtitle: '14 derniers jours, en FCFA',
    /** Graduations de l'axe vertical (en milliers de FCFA) et leur libellé. */
    chartTicks: [
      { value: 1600, label: '1,6 M' },
      { value: 1200, label: '1,2 M' },
      { value: 800, label: '800 k' },
      { value: 400, label: '400 k' },
      { value: 0, label: '0' },
    ],
    /** Montants quotidiens fictifs, en milliers de FCFA. */
    chartDays: [
      { day: '03', wave: 520, orange: 310 },
      { day: '04', wave: 610, orange: 340 },
      { day: '05', wave: 580, orange: 300 },
      { day: '06', wave: 700, orange: 380 },
      { day: '07', wave: 640, orange: 360 },
      { day: '08', wave: 760, orange: 410 },
      { day: '09', wave: 690, orange: 390 },
      { day: '10', wave: 810, orange: 430 },
      { day: '11', wave: 740, orange: 400 },
      { day: '12', wave: 880, orange: 470 },
      { day: '13', wave: 830, orange: 450 },
      { day: '14', wave: 950, orange: 500 },
      { day: '15', wave: 900, orange: 480 },
      { day: '16', wave: 1010, orange: 540 },
    ],
    chartMonth: 'nov.',
    providers: {
      wave: 'Wave',
      orange: 'Orange Money',
    },
    splitTitle: 'Répartition par opérateur',
    split: [
      { provider: 'wave', amount: '11\u00A0439\u00A0000', share: 62, count: '812 paiements' },
      { provider: 'orange', amount: '7\u00A0011\u00A0000', share: 38, count: '472 paiements' },
    ] satisfies { provider: 'wave' | 'orange'; amount: string; share: number; count: string }[],
    splitTotal: 'Total encaissé',
    splitTotalValue: '18\u00A0450\u00A0000',
    transactionsTitle: 'Dernières transactions',
    transactionsLink: 'Tout voir',
    columns: {
      ref: 'Référence',
      customer: 'Client',
      provider: 'Opérateur',
      date: 'Date',
      amount: 'Montant',
      status: 'Statut',
      reconciled: 'Rapproché',
    },
    transactions: [
      {
        ref: 'PAY-10482',
        customer: 'Aminata Diallo',
        provider: 'wave',
        date: '16 nov. · 10:42',
        amount: 25_000,
        status: 'success',
        reconciled: true,
      },
      {
        ref: 'PAY-10481',
        customer: 'Keur Yaay SARL',
        provider: 'orange',
        date: '16 nov. · 10:31',
        amount: 12_500,
        status: 'pending',
        reconciled: false,
      },
      {
        ref: 'PAY-10479',
        customer: 'Moussa Ndiaye',
        provider: 'wave',
        date: '16 nov. · 09:58',
        amount: 8_000,
        status: 'refunded',
        reconciled: true,
      },
      {
        ref: 'PAY-10476',
        customer: 'Fatou Sarr',
        provider: 'orange',
        date: '16 nov. · 09:14',
        amount: 47_000,
        status: 'success',
        reconciled: true,
      },
      {
        ref: 'PAY-10473',
        customer: 'Cheikh Fall',
        provider: 'wave',
        date: '15 nov. · 18:20',
        amount: 15_000,
        status: 'success',
        reconciled: true,
      },
    ] satisfies {
      ref: string;
      customer: string;
      provider: 'wave' | 'orange';
      date: string;
      amount: number;
      status: 'success' | 'pending' | 'refunded';
      reconciled: boolean;
    }[],
    statuses: {
      success: 'Réussie',
      pending: 'En attente',
      refunded: 'Remboursée',
    },
    reconciledYes: 'Oui',
    reconciledNo: 'En cours',
  },

  problem: {
    eyebrow: 'Le problème',
    title: 'Encaisser est simple. Tout suivre l’est beaucoup moins.',
    intro:
      'Dès qu’une entreprise accepte plusieurs moyens de paiement mobile, le suivi se disperse et le travail manuel s’installe.',
    items: [
      {
        icon: 'windows',
        title: 'Une interface par prestataire',
        text: 'Vos paiements Wave et Orange Money vivent dans des espaces séparés, avec des exports et des formats différents.',
      },
      {
        icon: 'sheet',
        title: 'Un rapprochement à la main',
        text: 'Relier chaque paiement à sa commande se fait dans un tableur, ligne par ligne, avec un vrai risque d’erreur.',
      },
      {
        icon: 'undo',
        title: 'Des remboursements mal suivis',
        text: 'Qui a été remboursé, de combien, et quand ? La réponse demande souvent de fouiller plusieurs historiques.',
      },
      {
        icon: 'eyeOff',
        title: 'Aucune vision consolidée',
        text: 'Pas de chiffre fiable sur ce que vous avez réellement encaissé, toutes sources et toutes applications confondues.',
      },
    ] satisfies { icon: IconName; title: string; text: string }[],
  },

  howItWorks: {
    eyebrow: 'Comment ça marche',
    title: 'Opérationnel en trois étapes',
    steps: [
      {
        title: 'Créez votre organisation et vos applications',
        text: 'Déclarez votre entreprise, puis une application par site, boutique ou service. Chacune dispose de ses clés API test et live.',
      },
      {
        title: 'Connectez vos propres comptes marchands',
        text: 'Renseignez les identifiants de vos comptes Wave et Orange Money. L’argent continue d’arriver directement chez vous.',
      },
      {
        title: 'Encaissez, suivez, remboursez',
        text: 'Créez des paiements par API ou par lien, suivez leur statut en temps réel et remboursez depuis la même interface.',
      },
    ],
    stepLabel: 'Étape',
  },

  features: {
    eyebrow: 'Fonctionnalités',
    title: 'Tout le cycle du paiement, au même endroit',
    items: [
      {
        id: 'encaissements',
        icon: 'wallet',
        title: 'Encaissements et liens de paiement',
        text: 'Créez un paiement par API ou partagez un lien par WhatsApp, SMS ou email. Votre client paie avec le moyen qu’il préfère.',
      },
      {
        id: 'remboursements',
        icon: 'undo',
        title: 'Remboursements total, partiel ou programmé',
        text: 'Remboursez tout ou partie d’un paiement, immédiatement ou à la date choisie, avec un historique clair.',
      },
      {
        id: 'rapprochement',
        icon: 'link',
        title: 'Rapprochement automatique',
        text: 'Chaque paiement est relié à votre référence de commande. Les écarts sont signalés au lieu d’être découverts en fin de mois.',
      },
      {
        id: 'tableau-de-bord',
        icon: 'chart',
        title: 'Tableau de bord et exports',
        text: 'Encaissements, remboursements et frais consolidés par prestataire et par application. Exports CSV pour votre comptabilité.',
      },
      {
        id: 'notifications',
        icon: 'bell',
        title: 'Notifications',
        text: 'Webhooks pour vos systèmes, alertes email pour vos équipes : vous êtes prévenu à chaque changement de statut.',
      },
      {
        id: 'audit',
        icon: 'history',
        title: 'Journal d’audit',
        text: 'Qui a fait quoi, et quand : chaque action sensible est horodatée et attribuée à un utilisateur.',
      },
    ] satisfies { id: string; icon: IconName; title: string; text: string }[],
  },

  developers: {
    eyebrow: 'Pour les développeurs',
    title: 'Une API claire, des webhooks fiables',
    intro:
      'Un appel pour créer un paiement, un webhook signé pour en connaître l’issue. Le même contrat quel que soit le prestataire.',
    tabsLabel: 'Exemple de création de paiement',
    requestTitle: 'Créer un paiement',
    webhookTitle: 'Webhook signé reçu',
    note: 'Exemples indicatifs : la documentation complète de l’API arrive bientôt.',
    points: [
      {
        icon: 'repeat',
        title: 'Idempotence',
        text: 'Envoyez un en-tête Idempotency-Key : une requête rejouée ne crée jamais un second paiement.',
      },
      {
        icon: 'signature',
        title: 'Webhooks signés HMAC',
        text: 'Chaque notification est signée en HMAC-SHA256. Vérifiez la signature avant de traiter l’événement.',
      },
      {
        icon: 'flask',
        title: 'Environnements test et live',
        text: 'Des clés séparées pour tester sans risque, puis passer en production sans changer de code.',
      },
    ] satisfies { icon: IconName; title: string; text: string }[],
  },

  security: {
    eyebrow: 'Sécurité et modèle',
    title: 'Paylance ne détient pas vos fonds',
    intro:
      'Paylance orchestre vos paiements, il ne les encaisse pas à votre place. Chaque franc va directement de votre client à votre compte marchand.',
    items: [
      {
        icon: 'banknote',
        title: 'Vos fonds restent chez vous',
        text: 'Les paiements sont versés directement sur vos comptes marchands Wave et Orange Money, jamais sur un compte Paylance.',
      },
      {
        icon: 'key',
        title: 'Identifiants prestataires chiffrés',
        text: 'Vos clés prestataires sont chiffrées au repos et ne sont plus jamais affichées en clair après leur enregistrement.',
      },
      {
        icon: 'building',
        title: 'Isolation stricte par entreprise',
        text: 'Les données de chaque organisation sont cloisonnées : aucune entreprise ne peut accéder à celles d’une autre.',
      },
      {
        icon: 'history',
        title: 'Traçabilité complète',
        text: 'Paiements, remboursements, changements de paramètres : chaque opération est journalisée et consultable.',
      },
    ] satisfies { icon: IconName; title: string; text: string }[],
  },

  solutions: {
    eyebrow: 'Solutions',
    title: 'Pensé pour votre façon de vendre',
    useCaseLabel: 'Cas d’usage',
    items: [
      {
        id: 'solution-ecommerce',
        icon: 'cart',
        title: 'E-commerce',
        text: 'Une boutique en ligne reçoit une commande de 35 000 FCFA. Le paiement Wave est relié automatiquement à la commande, puis un retour partiel de 12 000 FCFA est remboursé depuis le tableau de bord.',
      },
      {
        id: 'solution-saas',
        icon: 'layers',
        title: 'Plateformes SaaS',
        text: 'Un logiciel de gestion facture 15 000 FCFA par mois à ses abonnés. Chaque paiement réussi déclenche un webhook qui active l’abonnement, sans vérification manuelle.',
      },
      {
        id: 'solution-pme',
        icon: 'store',
        title: 'PME et commerces',
        text: 'Un commerce envoie un lien de paiement de 50 000 FCFA par WhatsApp. Il voit le paiement passer à « Réussie » et l’exporte pour sa comptabilité en fin de mois.',
      },
      {
        id: 'solution-agences',
        icon: 'briefcase',
        title: 'Agences et prestataires',
        text: 'Une agence web encaisse un acompte de 250 000 FCFA sur le compte marchand de son client, dans une application dédiée, et suit le solde restant à percevoir.',
      },
    ] satisfies { id: string; icon: IconName; title: string; text: string }[],
  },

  /**
   * Preuve sociale : désactivée tant qu'il n'y a pas de vrais témoignages.
   * Pour l'activer : passer `enabled` à true et renseigner `items` avec du contenu réel et autorisé.
   */
  socialProof: {
    enabled: false,
    eyebrow: 'Ils utilisent Paylance',
    title: 'Ce qu’en disent nos clients',
    items: [] as { quote: string; author: string; role: string; company: string }[],
  },

  partners: {
    eyebrow: 'Partenaires',
    title: 'Vos prestataires, une seule intégration',
    intro:
      'Paylance se connecte à vos comptes marchands existants. Vous gardez vos contrats et vos conditions avec chaque prestataire.',
    integrations: [
      { name: 'Wave', text: 'Mobile money · Sénégal', upcoming: false },
      { name: 'Orange Money', text: 'Mobile money · Sénégal', upcoming: false },
      {
        name: 'D’autres prestataires à venir',
        text: 'Cartes, autres pays de la région',
        upcoming: true,
      },
    ],
    upcomingLabel: 'À venir',
    become: {
      title: 'Devenir partenaire',
      text: 'Vous êtes prestataire de paiement, intégrateur ou agence ? Parlons de ce que nous pouvons construire ensemble.',
      cta: 'Proposer un partenariat',
      href: CONTACT_PARTNER_HREF,
    },
  },

  pricing: {
    eyebrow: 'Tarifs',
    title: 'Tarification par paliers de volume, accès anticipé gratuit pendant la phase pilote',
    text: 'Le tarif dépendra de votre volume mensuel encaissé. Pendant la phase pilote, l’accès est gratuit pour les entreprises retenues. Les frais de vos prestataires restent ceux de votre contrat avec eux.',
    points: [
      'Aucun frais pendant la phase pilote',
      'Paliers fixés selon votre volume mensuel',
      'Sans engagement',
    ],
    cta: 'Demander un accès anticipé',
  },

  faq: {
    eyebrow: 'FAQ',
    title: 'Questions fréquentes',
    items: [
      {
        q: 'Paylance détient-il mes fonds ?',
        a: 'Non. Les paiements sont versés directement sur vos propres comptes marchands Wave et Orange Money. Paylance orchestre les opérations et vous en donne la visibilité, sans jamais encaisser l’argent à votre place.',
      },
      {
        q: 'Quels prestataires sont pris en charge ?',
        a: 'Wave et Orange Money au Sénégal pour commencer. D’autres prestataires et d’autres pays de la région sont prévus ; dites-nous lesquels vous intéressent via le formulaire de contact.',
      },
      {
        q: 'Dois-je ouvrir un nouveau compte marchand ?',
        a: 'Non. Vous connectez les comptes marchands que vous avez déjà. Vous conservez vos contrats et vos conditions avec chaque prestataire.',
      },
      {
        q: 'Combien de temps prend l’intégration ?',
        a: 'Cela dépend de votre système. Les liens de paiement s’utilisent sans aucun développement. Côté API, il suffit d’un appel pour créer un paiement et d’un webhook pour en recevoir le résultat. Pendant la phase pilote, notre équipe vous accompagne.',
      },
      {
        q: 'Comment mes données et identifiants sont-ils protégés ?',
        a: 'Vos identifiants prestataires sont chiffrés au repos, les données de chaque entreprise sont strictement isolées et chaque opération sensible est inscrite dans un journal d’audit.',
      },
      {
        q: 'Comment fonctionnent les remboursements ?',
        a: 'Vous pouvez rembourser un paiement en totalité ou en partie, immédiatement ou à une date programmée. Le remboursement est exécuté depuis votre compte marchand, selon les possibilités offertes par chaque prestataire.',
      },
      {
        q: 'Puis-je tester avant de passer en production ?',
        a: 'Oui. Chaque application dispose d’un environnement test et d’un environnement live, avec des clés séparées.',
      },
      {
        q: 'Combien coûte Paylance ?',
        a: 'La tarification se fera par paliers de volume mensuel. Pendant la phase pilote, l’accès anticipé est gratuit pour les entreprises retenues.',
      },
    ],
  },

  contact: {
    eyebrow: 'Contact',
    title: 'Demandez un accès anticipé',
    intro:
      'Parlez-nous de votre activité. Nous revenons vers vous pour organiser la mise en place pendant la phase pilote.',
    asideTitle: 'Ce qui se passe ensuite',
    asideSteps: [
      'Nous étudions votre demande',
      'Nous échangeons sur vos besoins et vos prestataires',
      'Nous ouvrons votre accès pilote',
    ],
    privacy: 'Vos informations servent uniquement à vous recontacter au sujet de votre demande.',
    requiredHint: 'Les champs marqués d’un astérisque sont obligatoires.',
    fields: {
      name: { label: 'Nom complet', placeholder: 'Awa Diop' },
      company: { label: 'Entreprise', placeholder: 'Nom de votre entreprise' },
      email: { label: 'Email professionnel', placeholder: 'vous@entreprise.sn' },
      phone: {
        label: 'Téléphone',
        placeholder: '+221 77 123 45 67',
        hint: 'Format : +221 suivi de 9 chiffres',
      },
      sector: { label: 'Secteur', placeholder: 'Choisissez un secteur' },
      volume: { label: 'Volume mensuel estimé', placeholder: 'Choisissez une tranche' },
      subject: { label: 'Sujet' },
      message: {
        label: 'Message',
        placeholder: 'Vos besoins, vos prestataires actuels, vos questions…',
        optional: 'facultatif',
      },
    },
    sectors: [
      { value: 'ecommerce', label: 'E-commerce' },
      { value: 'saas', label: 'Plateforme SaaS' },
      { value: 'pme', label: 'PME et commerce' },
      { value: 'agence', label: 'Agence ou prestataire' },
      { value: 'autre', label: 'Autre' },
    ],
    volumes: [
      { value: 'lt_1m', label: 'Moins de 1 million FCFA' },
      { value: '1m_10m', label: 'De 1 à 10 millions FCFA' },
      { value: '10m_50m', label: 'De 10 à 50 millions FCFA' },
      { value: '50m_200m', label: 'De 50 à 200 millions FCFA' },
      { value: 'gt_200m', label: 'Plus de 200 millions FCFA' },
    ],
    subjects: [
      { value: 'acces_anticipe', label: 'Accès anticipé' },
      { value: 'partenariat', label: 'Partenariat' },
      { value: 'autre', label: 'Autre' },
    ],
    errors: {
      nameRequired: 'Indiquez votre nom.',
      companyRequired: 'Indiquez le nom de votre entreprise.',
      emailInvalid: 'Saisissez une adresse email valide.',
      phoneInvalid: 'Saisissez un numéro sénégalais au format +221 77 123 45 67.',
      sectorRequired: 'Choisissez un secteur.',
      volumeRequired: 'Choisissez une tranche de volume.',
      subjectRequired: 'Choisissez un sujet.',
      tooLong: 'Ce champ est trop long.',
    },
    submit: 'Envoyer ma demande',
    submitting: 'Envoi en cours…',
    successTitle: 'Demande envoyée',
    successText: 'Merci ! Nous avons bien reçu votre demande et revenons vers vous rapidement.',
    successAgain: 'Envoyer une autre demande',
    errorTitle: 'L’envoi a échoué',
    errorText: 'Votre demande n’a pas pu être envoyée. Vérifiez votre connexion puis réessayez.',
  },

  footer: {
    tagline:
      'Orchestration de paiements pour les entreprises d’Afrique de l’Ouest. Vos fonds restent sur vos comptes marchands.',
    legalTitle: 'Informations légales',
    legal: [{ label: 'Mentions légales' }, { label: 'Politique de confidentialité' }] as NavLink[],
    copyright: (year: number) => `© ${year} Paylance. Tous droits réservés.`,
    compatibility: 'Compatible Wave et Orange Money',
  },

  errorPage: {
    title: 'Un problème est survenu',
    text: 'La page n’a pas pu s’afficher. Vérifiez votre connexion internet puis rechargez la page.',
    reload: 'Recharger la page',
  },

  notFound: {
    title: 'Page introuvable',
    text: 'La page que vous cherchez n’existe pas ou a été déplacée.',
    backHome: 'Retour à l’accueil',
  },
};

export type Content = typeof fr;
