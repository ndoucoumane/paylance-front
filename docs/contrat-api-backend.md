# Contrat d'API attendu par le frontend Paylance

Ce document décrit ce que le frontend (`paylance-front`) envoie au backend, ce qu'il attend en
retour et les règles métier qu'il suppose. Il sert de cahier des charges pour rendre le backend
conforme à l'interface.

Le contrat est déjà écrit dans le code du front : toutes les données passent par deux interfaces.

- `AccountApi` ([src/services/account/accountApi.ts](../src/services/account/accountApi.ts)) :
  compte, inscription, onboarding, prestataires.
- `PaymentsApi` ([src/services/payments/types.ts](../src/services/payments/types.ts)) :
  transactions, remboursements, remboursements programmés.

Chacune a deux implémentations :

| Implémentation | Fichiers | Rôle |
|---|---|---|
| Démo | `demoAccountApi.ts`, `demoPaymentsApi.ts` | Données fictives dans le navigateur. **C'est la référence des règles métier** : le backend doit reproduire leur comportement. |
| Réelle | `liveAccountApi.ts`, `livePaymentsApi.ts` | Appels HTTP vers le backend. Les fonctions sans route backend lèvent une erreur « non disponible ». |

**Légende des statuts dans ce document**

- ✅ **Existant** : appelé aujourd'hui par le front réel. Le backend doit respecter le format décrit.
- 🆕 **À créer** : le front en a besoin, la route n'existe pas encore. Le chemin indiqué est une
  **proposition** : si vous en choisissez un autre, il suffit de l'adapter dans `liveAccountApi.ts`
  ou `livePaymentsApi.ts`.

---

## 1. Règles générales

### 1.1 Configuration du front

Variables d'environnement (voir [.env.example](../.env.example)) :

| Variable | Rôle |
|---|---|
| `VITE_API_URL` | URL de base de l'API, sans slash final, ex. `https://api.paylance.sn`. |
| `VITE_KEYCLOAK_URL` | URL du serveur Keycloak, sans `/realms/...`. |
| `VITE_KEYCLOAK_REALM` | Realm Keycloak. |
| `VITE_KEYCLOAK_CLIENT_ID` | Client **public** (Authorization Code + PKCE S256). |
| `VITE_DEMO_MODE` | `false` pour utiliser le backend réel. Par défaut, la démo est active si `VITE_API_URL` est vide. |

### 1.2 Authentification

**Choix retenu : l'utilisateur se connecte uniquement sur la page Paylance `/connexion`, avec son
e-mail et son mot de passe.** Il ne voit jamais la page de Keycloak. Keycloak reste le
fournisseur d'identité : il stocke les comptes, vérifie les mots de passe et émet les jetons. Mais
c'est le **backend** qui lui parle (détail au point 2.3 bis).

- Chaque appel API envoie `Authorization: Bearer <access_token>`. C'est un jeton émis par
  Keycloak et validé par le backend comme aujourd'hui (resource server JWT).
- Le front lit dans le jeton les claims `sub`, `given_name`, `family_name`, `email`,
  `email_verified`.
- Le front garde le jeton d'accès **en mémoire uniquement**, jamais dans `localStorage`. Il
  demande un nouveau jeton avant son expiration, et au chargement de la page.

> **État actuel du front, à modifier.** En mode réel, la page `/connexion` ne demande que
> l'e-mail, puis redirige vers la page hébergée par Keycloak (`keycloak-js`, PKCE). Une fois les
> routes du point 2.3 bis disponibles, le front affichera le champ mot de passe en mode réel et
> n'utilisera plus `keycloak-js`. Voir le point 8.

### 1.3 Organisation courante

- Toutes les routes `/api/v1/dashboard/**` reçoivent l'en-tête **`X-Organization-Id`**.
- Le front prend la **première** organisation renvoyée par `GET /api/v1/organizations`.
- Le backend doit vérifier que l'utilisateur est membre de cette organisation : `403` sinon.

### 1.4 CORS

Autoriser l'origine du front, les méthodes `GET, POST, PUT, PATCH, DELETE`, et les en-têtes
`Authorization`, `Content-Type`, `Accept`, `X-Organization-Id`.

Le jeton de renouvellement passe par un cookie (point 2.3 bis). Il faut donc aussi :

- `Access-Control-Allow-Credentials: true` ;
- une origine **explicite**, pas de `*` ;
- front et API sur le même site (par exemple `app.paylance.sn` et `api.paylance.sn`), pour que le
  cookie `SameSite=Strict` soit envoyé.

### 1.5 Formats de données

| Donnée | Format attendu |
|---|---|
| **Montants** | **Entiers en centimes** (unité mineure × 100), **y compris pour le XOF**. 15 000 F CFA = `1500000`. |
| **Devise** | Code ISO 4217 sur 3 lettres : `XOF`, `XAF`, `GNF`, `EUR`, `USD`. |
| **Dates renvoyées** | ISO 8601 **avec fuseau**, ex. `2026-11-18T09:00:00Z`. Le front utilise `Date.parse`. Une date sans fuseau serait lue comme heure locale du navigateur et décalée. Utilisez `Instant` ou `OffsetDateTime` côté Java. |
| **Dates envoyées en paramètre** (`from`, `to`) | ISO 8601 UTC **avec `Z`** (`toISOString()`), ex. `2026-11-18T08:00:00.000Z`. Le backend accepte aussi l'ancien format sans fuseau, lu en UTC. ✅ Voir le point 7.3. |
| **Téléphones** | E.164 sans espaces, ex. `+221771234567`. Le front se charge de l'affichage. |
| **Pays** | Code ISO 3166-1 alpha-2, ex. `SN`. |
| **Identifiants** | Chaînes opaques (UUID conseillé). |
| **Pagination** | Format `Page` de Spring (voir 4.1). |

### 1.6 Idempotence

Le front envoie l'en-tête `Idempotency-Key: <uuid>` sur `POST /dashboard/payments`,
`POST …/refunds` et `POST …/scheduled-refunds`. La clé est **la même** si l'utilisateur relance
la même demande après une coupure réseau ou un délai dépassé. Elle **change** dès que la saisie
change ou que le serveur a répondu.

### 1.7 Erreurs

Toute réponse non 2xx doit avoir le corps `ErrorResponse` :

```json
{
  "timestamp": "2026-11-18T10:15:00Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Le montant dépasse le solde remboursable.",
  "path": "/api/v1/dashboard/payments/…/refunds",
  "correlationId": "c0a8…",
  "details": ["amount: doit être positif"]
}
```

Comportement du front ([src/services/api/errors.ts](../src/services/api/errors.ts)) :

| Statut | Ce que le front affiche |
|---|---|
| Tous les statuts | **Le champ `message` tel quel** dès qu'il est présent. Il doit donc être rédigé **en français**, compréhensible par un commerçant. `details` n'est pas affiché. |
| `401` sans `message` | « Votre session a expiré. Reconnectez-vous. » |
| `403` sans `message` | « Vous n'avez pas les droits nécessaires pour cette action. » |
| `429` sans `message` | « Trop de tentatives. Réessayez dans N s. » (N = `Retry-After`) |
| `≥ 500` sans `message` | Message générique. |
| Pas de réponse en 15 s | « Le serveur met trop de temps à répondre. » |

Cas particulier : à l'inscription, un **`409`** est affiché **sous le champ e-mail** (« Un compte
existe déjà avec cette adresse e-mail. »).

---

## 2. Création de compte et onboarding

### 2.1 Parcours et redirections

Le front décide de la page à afficher uniquement à partir de l'état renvoyé par le serveur
([src/lib/session/routing.ts](../src/lib/session/routing.ts)) :

```
Inscription (/register)
   ↓
Vérification de l'e-mail (/verify-email)    ← tant que user.emailVerified = false
   ↓
Entreprise   (/onboarding/company)          ← tant que organization = null
   ↓
Préférences  (/onboarding/preferences)
   ↓
Formule      (/onboarding/plan)
   ↓
Prestataires (/onboarding/connect-providers)
   ↓
Espace pro   (/app)                         ← progress.currentStep = DONE
```

Règles appliquées par le front :

- non connecté → `/connexion` ;
- `emailVerified = false` → `/verify-email` ;
- `organization = null` → `/onboarding/company` ;
- sinon → la page de `progress.currentStep`.

L'utilisateur peut revenir sur une étape déjà terminée, jamais en sauter une.

### 2.2 🆕 État de la session : `GET /api/v1/me`

**C'est l'endpoint le plus important pour que l'onboarding fonctionne en mode réel.** Le front
l'appelle au chargement de chaque page protégée et après chaque étape. Aujourd'hui,
`getSnapshot()` lève « non disponible » en mode réel, ce qui bloque tout le parcours.

Réponse `200` (`AccountSnapshot`) :

```json
{
  "user": {
    "id": "8f2c…",
    "firstName": "Awa",
    "lastName": "Diop",
    "email": "awa.diop@exemple.sn",
    "emailVerified": true
  },
  "organization": {
    "id": "org_…",
    "name": "Boutique Teranga",
    "slug": "boutique-teranga",
    "country": "SN",
    "defaultCurrency": "XOF",
    "status": "ACTIVE",
    "role": "OWNER",
    "createdAt": "2026-11-17T08:00:00Z"
  },
  "progress": {
    "currentStep": "PREFERENCES",
    "completedSteps": ["COMPANY"],
    "providersSkipped": false
  }
}
```

- `organization` vaut `null` tant que l'entreprise n'est pas créée.
- `emailVerified` doit refléter l'état **en base**, pas le claim du jeton : après la vérification,
  le jeton Keycloak garde l'ancienne valeur jusqu'à son renouvellement.
- `MemberRole` : `OWNER | ADMIN | DEVELOPER | VIEWER`. `OrganizationStatus` : `ACTIVE | SUSPENDED`.

**Calcul de la progression** (à reproduire côté serveur, voir `withCompleted` dans
`demoAccountApi.ts`) :

- ordre : `COMPANY → PREFERENCES → PLAN → PROVIDERS → DONE` ;
- quand une étape est validée, elle est ajoutée à `completedSteps` ;
- `currentStep` = la première étape (hors `DONE`) pas encore terminée, sinon `DONE` ;
- quand tout est terminé, `DONE` est aussi ajouté à `completedSteps`.

Nouvel utilisateur : `{ "currentStep": "COMPANY", "completedSteps": [], "providersSkipped": false }`.

### 2.3 🆕 Inscription : `POST /api/v1/public/register`

Route **publique** (sans jeton). Le front a son propre formulaire d'inscription. Le backend
doit donc créer l'utilisateur dans Keycloak (API d'administration), avec `emailVerified = false`.

Requête (`RegisterRequest`) :

```json
{
  "firstName": "Awa",
  "lastName": "Diop",
  "email": "awa.diop@exemple.sn",
  "password": "Paylance2026!",
  "acceptTerms": true
}
```

Validations faites par le front, à refaire côté serveur :

| Champ | Règle |
|---|---|
| `firstName`, `lastName` | 1 à 80 caractères, espaces de début et de fin retirés. |
| `email` | Format e-mail, 200 caractères max. **À enregistrer en minuscules.** |
| `password` | 10 à 128 caractères, au moins une minuscule, une majuscule et un chiffre. Configurer la même politique dans Keycloak. |
| `acceptTerms` | Doit valoir `true`. Conserver la date d'acceptation. |

Réponses :

- `201` (ou `204`) sans corps obligatoire ;
- **`409`** si l'e-mail existe déjà, avec `message` = « Un compte existe déjà avec cette adresse e-mail. ».

**Après l'inscription.** L'inscription ne connecte pas l'utilisateur : le backend ne renvoie
aucun jeton. Le front redirige vers **la page Paylance `/connexion`**, avec l'e-mail déjà rempli
et le message « Compte créé, connectez-vous pour continuer ». Une fois connecté, l'utilisateur
arrive sur `/verify-email`, car `emailVerified = false`. Les routes de vérification du point 2.4
sont donc appelées avec un jeton.

Ce comportement demande un ajustement dans `RegisterForm.tsx`. En démo, l'utilisateur est
aujourd'hui connecté directement après l'inscription ; il passera lui aussi par `/connexion`.

### 2.3 bis 🆕 Connexion sur la page Paylance

Le backend sert d'intermédiaire entre la page `/connexion` et Keycloak. Le mot de passe ne
transite que par le backend, et le jeton de renouvellement n'est jamais lisible par JavaScript.

**Configuration Keycloak**

- Un client **confidentiel** dédié au backend (`client_secret` connu du backend seulement),
  avec **Direct Access Grants** activé : grant `password`.
- La politique de mot de passe identique à celle du front (point 2.3).
- La protection contre les attaques par force brute activée (*Brute Force Detection*).

**Routes**

| Méthode et chemin | Corps | Réponse |
|---|---|---|
| `POST /api/v1/public/auth/login` | `{ "email": "…", "password": "…" }` | `200` + jeton d'accès + cookie de renouvellement |
| `POST /api/v1/public/auth/refresh` | aucun (cookie envoyé automatiquement) | `200` + nouveau jeton d'accès + nouveau cookie |
| `POST /api/v1/public/auth/logout` | aucun | `204`, cookie effacé, session Keycloak fermée |

Réponse de `login` et de `refresh` :

```json
{ "accessToken": "eyJhbGciOi…", "expiresIn": 300, "tokenType": "Bearer" }
```

Cookie de renouvellement, posé par le backend :

```
Set-Cookie: paylance_rt=<refresh_token>; HttpOnly; Secure; SameSite=Strict;
            Path=/api/v1/public/auth; Max-Age=<durée de session Keycloak>
```

**Fonctionnement côté backend**

- `login` : appel au endpoint `token` de Keycloak avec `grant_type=password`, le `username`
  (l'e-mail en minuscules) et le `password`. Le backend renvoie l'`access_token` dans le corps
  et le `refresh_token` dans le cookie.
- `refresh` : appel `grant_type=refresh_token` avec la valeur du cookie, puis **rotation** :
  le nouveau `refresh_token` remplace l'ancien dans le cookie.
- `logout` : appel au endpoint `logout` de Keycloak avec le `refresh_token`, puis le cookie est
  effacé (`Max-Age=0`).

**Erreurs**

| Cas | Statut | Ce que voit l'utilisateur |
|---|---|---|
| E-mail ou mot de passe faux | **`401`** | « E-mail ou mot de passe incorrect. » Message affiché par le front. |
| Compte bloqué après trop d'essais | `423` ou `429` | Le `message` du serveur, ex. « Trop de tentatives. Réessayez dans 15 minutes. » |
| Compte désactivé | `403` | Message générique de droits. |
| `refresh` sans cookie ou cookie expiré | `401` | Le front renvoie vers `/connexion`. |

La même réponse `401` doit servir pour un e-mail inconnu et pour un mot de passe faux, afin de ne
pas révéler quels e-mails ont un compte.

Le CORS doit autoriser les cookies (point 1.4).

**Mot de passe oublié.** Le lien actuel ouvre la page Keycloak « reset credentials ». Pour rester
sur les pages Paylance, il faudra deux routes publiques, à prévoir plus tard :
`POST /api/v1/public/auth/forgot-password` (`{ email }`, toujours `204`) et
`POST /api/v1/public/auth/reset-password` (`{ token, password }`).

### 2.4 🆕 Vérification de l'e-mail par code

L'écran attend un **code à 6 chiffres** envoyé par e-mail. Routes authentifiées par le jeton de
l'utilisateur.

| Méthode et chemin | Rôle | Réponse |
|---|---|---|
| `GET /api/v1/me/email-verification` | État du code en cours. **S'il n'y en a pas, le serveur en émet un et l'envoie.** | `EmailVerificationStatus` |
| `POST /api/v1/me/email-verification/resend` | Émet et envoie un nouveau code. | `EmailVerificationStatus` |
| `POST /api/v1/me/email-verification/verify` | Corps `{ "code": "123456" }`. | `204` |

`EmailVerificationStatus` :

```json
{
  "expiresAt": "2026-11-18T10:25:00Z",
  "resendAvailableAt": "2026-11-18T10:15:30Z",
  "attemptsLeft": 5
}
```

Le front affiche un compte à rebours à partir de `expiresAt` et `resendAvailableAt`, et le nombre
de tentatives restantes.

Règles de la démo, à reproduire :

| Paramètre | Valeur |
|---|---|
| Durée de validité du code | 10 minutes |
| Délai avant un nouvel envoi | 30 secondes |
| Tentatives par code | 5 |

Erreurs attendues (le `message` est affiché) :

| Cas | Statut | Message |
|---|---|---|
| Nouvel envoi demandé trop tôt | `429` | « Patientez quelques secondes avant de demander un nouveau code. » |
| E-mail déjà vérifié (au renvoi) | `409` | « Adresse e-mail déjà vérifiée. » |
| Aucun code en cours | `409` | « Aucun code en cours. Demandez un nouveau code. » |
| Code expiré | `410` | « Ce code a expiré. Demandez un nouveau code. » |
| Plus de tentatives | `429` | « Trop de tentatives. Demandez un nouveau code. » |
| Code faux | `422` | « Code incorrect. Il vous reste N tentative(s). » (décrémenter `attemptsLeft`) |

`verify` sur un e-mail déjà vérifié répond `204` sans erreur. Après succès : passer
`emailVerified = true` **en base et dans Keycloak**.

### 2.5 Étape « Entreprise »

✅ **Existant** : `POST /api/v1/organizations` (`OrganizationCreateRequest`) → `OrganizationResponse`.
L'utilisateur devient `OWNER`.

Aujourd'hui, le front réel n'envoie que :

```json
{ "name": "Boutique Teranga", "country": "SN", "defaultCurrency": "XOF" }
```

Mais le formulaire collecte un profil complet (`CompanyProfile`), qui est aujourd'hui **perdu en
mode réel**. 🆕 Le backend doit l'accepter et le stocker.

```json
{
  "tradeName": "Boutique Teranga",
  "legalName": "Teranga Distribution SARL",
  "country": "SN",
  "sector": "E-commerce",
  "phone": "+221771234567",
  "website": "https://teranga.sn",
  "size": "11-50"
}
```

| Champ | Règle |
|---|---|
| `tradeName` | 2 à 150 caractères. Devient `organization.name`. |
| `legalName` | 2 à 150 caractères (raison sociale). |
| `country` | Un code parmi `SN, CI, ML, BF, BJ, TG, NE, GN, CM, FR`. |
| `sector` | Un libellé parmi la liste du point 2.10. |
| `phone` | E.164, `^\+\d{8,15}$`. |
| `website` | `null` ou une URL `https://…` (le front ajoute `https://` si besoin). |
| `size` | `1-10`, `11-50`, `51-200`, `201-500` ou `500+`. |

Routes proposées :

| Méthode et chemin | Rôle |
|---|---|
| 🆕 `PUT /api/v1/organizations/current/profile` | Crée l'organisation si elle n'existe pas, sinon met à jour le profil. Renvoie l'`Organization`. Marque l'étape `COMPANY` comme terminée. |
| 🆕 `GET /api/v1/organizations/current/profile` | Renvoie le `CompanyProfile`, ou `404` / `null` s'il n'existe pas. Sert à pré-remplir le formulaire quand on revient sur l'étape. |

À défaut, on peut étendre `OrganizationCreateRequest` avec ces champs, et ajouter un `PUT` pour la
mise à jour.

Comportement attendu :

- **devise par défaut** déduite du pays : `XOF` pour l'UEMOA, `XAF` pour `CM`, `GNF` pour `GN`, `EUR` pour `FR` ;
- **`slug`** généré à partir du nom ;
- si l'e-mail n'est pas vérifié : **`403`**.

### 2.6 🆕 Étape « Préférences »

| Méthode et chemin | Corps et réponse |
|---|---|
| `GET /api/v1/organizations/current/preferences` | `Preferences`, ou `null` s'il n'y en a pas encore. |
| `PUT /api/v1/organizations/current/preferences` | Corps `Preferences`, réponse `204`. Marque `PREFERENCES` comme terminée. **Met aussi à jour `organization.defaultCurrency`** avec `currency`. |

```json
{
  "currency": "XOF",
  "timezone": "Africa/Dakar",
  "language": "fr",
  "notifications": {
    "paymentSucceeded": true,
    "paymentFailed": true,
    "refunds": true,
    "providerIssues": true,
    "weeklySummary": false
  }
}
```

Valeurs autorisées :

- `currency` : `XOF`, `XAF`, `GNF`, `EUR`, `USD` ;
- `timezone` : `Africa/Dakar`, `Africa/Abidjan`, `Africa/Bamako`, `Africa/Ouagadougou`,
  `Africa/Porto-Novo`, `Africa/Lome`, `Africa/Niamey`, `Africa/Conakry`, `Africa/Douala`,
  `Europe/Paris`, `UTC` ;
- `language` : `fr` ou `en`.

Les cinq préférences de notification sont des booléens : le backend devra s'en servir pour
envoyer, ou non, les e-mails correspondants.

### 2.7 🆕 Étape « Formule »

| Méthode et chemin | Rôle |
|---|---|
| `GET /api/v1/plans` | Liste des formules (`Plan[]`). Peut être publique. |
| `GET /api/v1/organizations/current/plan` | `{ "planId": "STARTER" }`, ou `null`. |
| `PUT /api/v1/organizations/current/plan` | Corps `{ "planId": "STARTER" }`, réponse `204`. Marque `PLAN` comme terminée. |

`Plan` :

```json
{
  "id": "STARTER",
  "name": "Starter",
  "description": "Pour démarrer et connecter vos premiers comptes marchands.",
  "priceLabel": "Gratuit pendant la phase pilote",
  "features": ["Wave Business et Orange Money", "Plusieurs comptes par prestataire"],
  "selfServe": true,
  "recommended": true
}
```

- `id` : `STARTER`, `GROWTH` ou `BUSINESS`.
- `priceLabel` est un texte libre, aucun montant n'est calculé par le front.
- Choisir une formule où `selfServe = false` → **`422`** « La formule X s'active avec notre équipe
  commerciale. ».
- Formule inconnue → `404`.

Les textes des trois formules sont dans `demoAccountApi.ts` (constante `PLANS`) et peuvent être
repris tels quels.

### 2.8 Étape « Prestataires » (comptes Wave et Orange Money)

Mêmes routes pour l'onboarding et pour la page « Comptes prestataires » de l'espace pro. Toutes
avec `X-Organization-Id`.

| Méthode et chemin | Statut | Rôle |
|---|---|---|
| `GET /api/v1/dashboard/provider-accounts` | ✅ | Liste. **Exclure les comptes `DISABLED`.** |
| `POST /api/v1/dashboard/provider-accounts` | ✅ | Création, renvoie le compte au statut `PENDING_VERIFICATION`. |
| `POST /api/v1/dashboard/provider-accounts/{id}/test` | 🆕 | Teste la connexion chez l'opérateur (`ProviderAccountService.testConnection`). Renvoie le compte à jour. |
| `POST /api/v1/dashboard/provider-accounts/{id}/disable` | 🆕 | Désactive le compte (`DISABLED`). Renvoie le compte à jour. |
| `POST /api/v1/onboarding/providers/complete` | 🆕 | Termine l'étape `PROVIDERS`, avec ou sans compte connecté. Réponse `204`. |

Requête de création (`ProviderAccountCreateRequest`) :

```json
{
  "provider": "WAVE",
  "label": "Wave boutique principale",
  "environment": "TEST",
  "credentials": { "checkoutApiKey": "wave_sn_prod_…", "payoutApiKey": "…" },
  "webhookSecret": "…"
}
```

Clés de `credentials` envoyées par le front ([referenceData.ts](../src/services/account/referenceData.ts)) :

| Opérateur | Clé | Obligatoire | Secrète |
|---|---|---|---|
| `WAVE` | `checkoutApiKey` | oui | oui |
| `WAVE` | `payoutApiKey` | non (nécessaire pour rembourser) | oui |
| `WAVE` | `balanceApiKey` | non | oui |
| `ORANGE_MONEY` | `clientId` | oui | non |
| `ORANGE_MONEY` | `clientSecret` | oui | oui |
| `ORANGE_MONEY` | `merchantCode` | oui | non |
| `ORANGE_MONEY` | `merchantName` | non | non |

`webhookSecret` est facultatif : c'est la clé de signature des notifications.

Réponse (`ProviderAccountResponse`) :

```json
{
  "id": "pa_…",
  "provider": "WAVE",
  "label": "Wave boutique principale",
  "environment": "TEST",
  "status": "ACTIVE",
  "credentials": { "checkoutApiKey": "••••a1b2" },
  "webhookSecretConfigured": true,
  "webhookUrl": "https://api.paylance.sn/api/v1/webhooks/wave/pa_…",
  "lastVerifiedAt": "2026-11-18T10:00:00Z",
  "lastVerificationMessage": "Connexion vérifiée.",
  "createdAt": "2026-11-18T09:58:00Z",
  "updatedAt": "2026-11-18T10:00:00Z"
}
```

- **Ne jamais renvoyer un secret en clair.** Format de masquage utilisé par le front :
  `••••` suivi des 4 derniers caractères (`••••` seul si 4 caractères ou moins).
  `merchantCode` et `merchantName` peuvent rester en clair.
- `status` : `PENDING_VERIFICATION`, `ACTIVE` ou `DISABLED`. **Seuls les comptes `ACTIVE`**
  sont proposés dans le formulaire « Nouveau paiement ».
- `webhookUrl` : URL que le marchand déclare chez l'opérateur. Le front l'affiche avec un bouton
  de copie.
- `lastVerificationMessage` : affiché sous le compte. C'est le résultat du dernier test, en
  français, par exemple la raison d'un échec.
- `completeProvidersStep` : `providersSkipped = true` si aucun compte n'est `ACTIVE` au moment de
  terminer l'étape.

### 2.9 Formulaire de contact du site public

✅ `POST /api/v1/public/leads`, route publique sans jeton. Réponse 2xx attendue, le corps n'est
pas lu.

```json
{
  "name": "Awa Diop",
  "company": "Boutique Teranga",
  "email": "awa.diop@exemple.sn",
  "phone": "+221771234567",
  "sector": "…",
  "monthlyVolume": "…",
  "subject": "…",
  "message": "…",
  "locale": "fr",
  "source": "landing"
}
```

- `message` est facultatif.
- Les valeurs possibles de `sector`, `monthlyVolume` et `subject` sont dans
  [src/content/fr.ts](../src/content/fr.ts), section `contact`.

### 2.10 Listes de référence

Le front valide les champs contre ces listes. Le backend doit accepter exactement les mêmes
valeurs.

- **Secteurs** (`sector`, stocké tel quel) : `E-commerce`, `Logiciel et SaaS`,
  `Commerce de détail`, `Éducation`, `Santé`, `Transport et logistique`,
  `Restauration et hôtellerie`, `Services financiers`, `Association ou ONG`, `Autre`.
  Ce sont des libellés et non des codes. Si vous préférez des codes, il faudra une
  correspondance dans `referenceData.ts`.
- **Pays** : voir 2.5. L'indicatif téléphonique du pays de l'organisation est utilisé pour
  composer le numéro du client dans « Nouveau paiement » (`+221` pour `SN`).

---

## 3. Modèle de données des transactions

Référence : [src/services/payments/types.ts](../src/services/payments/types.ts).

### 3.1 `Payment` (PaymentStatusResponse) ✅

```json
{
  "paymentId": "3f1c…",
  "paymentNumber": "PL-261118-000180-8",
  "correlationId": null,
  "applicationId": null,
  "providerAccountId": "pa_…",
  "customerId": null,
  "environment": "LIVE",
  "provider": "WAVE",
  "status": "SUCCESS",
  "amount": 1500000,
  "currency": "XOF",
  "payerPhone": "+221771234567",
  "actualPayerPhone": "+221781112233",
  "externalReference": "CMD-10482",
  "failureReason": null,
  "paidAt": "2026-11-18T08:44:10Z",
  "expiresAt": "2026-11-18T09:44:00Z",
  "createdAt": "2026-11-18T08:44:00Z",
  "updatedAt": "2026-11-18T08:44:10Z"
}
```

Utilisation de chaque champ par le front :

| Champ | Usage |
|---|---|
| `paymentNumber` | Numéro lisible affiché partout, copiable, recherchable. |
| `provider` | `WAVE` ou `ORANGE_MONEY` : logo, nom, règles de remboursement. |
| `environment` | `TEST` ou `LIVE`. Badge « Test » dans la liste. |
| `status` | Voir 3.2. |
| `amount`, `currency` | Centimes et code ISO. |
| `payerPhone` | Téléphone du client, recherchable. |
| `actualPayerPhone` | Affiché seulement s'il diffère de `payerPhone` (« Payé depuis le »). |
| `externalReference` | Référence commande du marchand, recherchable. |
| `refundableAmount` | ✅ **Obligatoire, sur la liste et le détail.** Solde remboursable calculé par le serveur, en centimes : montant moins les remboursements `SUCCESS` et `PENDING`, `0` si le paiement n'est pas remboursable. Le formulaire l'affiche et s'en sert comme plafond ; les actions Rembourser et Programmer sont désactivées quand il vaut `0`. Le front ne fait **aucune estimation locale**. |
| `failureReason` | Texte affiché pour un paiement échoué. |
| `paidAt`, `expiresAt`, `createdAt` | Dates de la fiche détail. |

### 3.2 Statuts de paiement

`PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `EXPIRED`, `REFUNDED`, `PARTIALLY_REFUNDED`,
`CANCELLED`.

Règles utilisées par le front ([rules.ts](../src/services/payments/rules.ts)) :

- **remboursable** si `SUCCESS` ou `PARTIALLY_REFUNDED` ;
- **remboursement partiel impossible pour Wave** : le remboursement est forcément total ;
- **après un remboursement**, le statut du paiement doit passer à `PARTIALLY_REFUNDED` (solde
  restant > 0) ou à `REFUNDED` (solde = 0).

Indicateurs calculés par le front à partir de `byStatus` :

- volume encaissé = montant `SUCCESS` + `PARTIALLY_REFUNDED` ;
- taux de réussite = (`SUCCESS` + `REFUNDED` + `PARTIALLY_REFUNDED`) ÷ (ceux-là + `FAILED` + `EXPIRED` + `CANCELLED`) ;
- remboursé = montant `REFUNDED`.

### 3.3 `PaymentStatusChange` (historique) ✅

```json
{
  "id": "…",
  "fromStatus": "PENDING",
  "toStatus": "SUCCESS",
  "reason": "Paiement confirmé par Wave",
  "triggeredBy": "WEBHOOK",
  "createdAt": "2026-11-18T08:44:10Z"
}
```

- `triggeredBy` : `API`, `WEBHOOK`, `RECONCILIATION` ou `MANUAL`. Une autre valeur est affichée
  telle quelle.
- `fromStatus` vaut `null` pour la création.
- Ordre attendu : **chronologique croissant**. Le front l'inverse pour l'affichage.

### 3.4 `Refund` (RefundResponse) ✅

```json
{
  "refundId": "…",
  "paymentId": "…",
  "paymentNumber": "PL-261118-000179-6",
  "payerPhone": "+221759731110",
  "amount": 1500000,
  "status": "SUCCESS",
  "reason": "Commande annulée",
  "failureReason": null,
  "providerRefundId": "…",
  "requestedBy": "Awa Diop",
  "createdAt": "2026-11-18T11:18:00Z"
}
```

- `status` : `PENDING`, `SUCCESS` ou `FAILED`. La fenêtre de confirmation affiche
  « Remboursement effectué » si `SUCCESS`, « Remboursement envoyé » sinon.
- **`requestedBy` doit être le nom affichable** (« Prénom Nom ») de l'utilisateur, pas son `sub`
  Keycloak. Il est affiché tel quel (« par Awa Diop »).
- Seuls les remboursements `SUCCESS` sont déduits du solde remboursable.

---

## 4. Routes des transactions

Toutes avec `Authorization` et `X-Organization-Id`.

### 4.1 ✅ Liste : `GET /api/v1/dashboard/payments`

| Paramètre | Exemple | Règle |
|---|---|---|
| `page` | `0` | Commence à 0. |
| `size` | `12` | 12 dans la liste, 25 dans le choix de transaction, **jusqu'à 1000 pour l'export CSV** (voir 7.2). |
| `sort` | `createdAt,desc` | Champs `createdAt` ou `amount`, sens `asc` ou `desc` (format Pageable). |
| `from` | `2026-10-20T00:00:00` | Début de période (minuit local du premier jour, converti en UTC). Pas de `to` : jusqu'à maintenant. |
| `status` | `SUCCESS` | Facultatif, un seul statut. |
| `provider` | `WAVE` | Facultatif. |
| `q` | `771234567` | Facultatif. Voir ci-dessous. |

**Recherche `q`** : correspondance **partielle, insensible à la casse et aux espaces**, sur
`paymentNumber`, `payerPhone` et `externalReference`. Taper `77 123` doit trouver
`+221771234567`.

Réponse au format `Page` de Spring. Les deux sérialisations sont acceptées :

```json
{ "content": [ /* Payment */ ], "totalElements": 58, "number": 0, "size": 12 }
```

```json
{ "content": [ /* Payment */ ], "page": { "totalElements": 58, "number": 0, "size": 12 } }
```

Le choix de la transaction à rembourser appelle cette route deux fois, avec `status=SUCCESS` puis
`status=PARTIALLY_REFUNDED`, sur 90 jours.

### 4.2 ✅ Statistiques : `GET /api/v1/dashboard/payments/stats?from=…&to=…`

Appelée deux fois par chargement : la période choisie (7, 30 ou 90 jours), puis la période
précédente de même durée, pour les comparaisons.

```json
{
  "totalCount": 58,
  "totalAmount": 412500000,
  "byStatus": [
    { "key": "SUCCESS", "count": 44, "totalAmount": 330000000 },
    { "key": "REFUNDED", "count": 3, "totalAmount": 4500000 }
  ],
  "byProvider": [
    { "key": "WAVE", "count": 40, "totalAmount": 300000000 },
    { "key": "ORANGE_MONEY", "count": 18, "totalAmount": 112500000 }
  ]
}
```

`byStatus` sert aussi aux compteurs des onglets Toutes, Réussies, En attente, Échouées et
Remboursées.

### 4.3 ✅ Détail : `GET /api/v1/dashboard/payments/{paymentId}`

Renvoie un `Payment`. Appelée après un remboursement pour rafraîchir la fiche.

### 4.4 ✅ Historique : `GET /api/v1/dashboard/payments/{paymentId}/history`

Renvoie `PaymentStatusChange[]`.

### 4.5 ✅ Remboursements d'un paiement : `GET /api/v1/dashboard/payments/{paymentId}/refunds`

Renvoie `Refund[]`, du plus récent au plus ancien. Le front s'en sert aussi pour calculer
« Encaissé / Remboursé / Net » et le solde remboursable.

### 4.6 ✅ Rembourser : `POST /api/v1/dashboard/payments/{paymentId}/refunds`

```json
{ "amount": 500000, "reason": "Commande annulée" }
```

- **`amount` absent = remboursement total du solde restant.**
- `reason` est obligatoire, texte libre (le front propose des motifs rapides).

Réponse : le `Refund` créé. Règles et erreurs :

| Cas | Statut | Message |
|---|---|---|
| Statut non remboursable | `409` | « Impossible de rembourser un paiement au statut X. » |
| Remboursement partiel demandé sur Wave | `422` | « Wave ne permet que le remboursement total d'un paiement. » |
| `amount` ≤ 0 ou > solde restant | `422` | « Le montant dépasse le solde remboursable. » |

Effet attendu : le statut du paiement est mis à jour (voir 3.2) et une ligne est ajoutée à
l'historique.

### 4.7 🆕 Nouveau paiement : `POST /api/v1/dashboard/payments`

Le marchand envoie une demande de paiement sur le téléphone du client.

Requête (`PaymentCreateRequest`) :

```json
{
  "providerAccountId": "pa_…",
  "amount": 1500000,
  "payerPhone": "+221771234567",
  "externalReference": "CMD-10482",
  "description": "Commande de 3 articles, livraison incluse",
  "expiresInMinutes": 60
}
```

| Champ | Règle |
|---|---|
| `providerAccountId` | Un compte `ACTIVE` de l'organisation. |
| `amount` | En centimes, entre **100 et 2 000 000 F CFA** (`10000` à `200000000`). Ce sont les bornes du front ; ajustez-les au besoin, le front les affiche. |
| `payerPhone` | E.164 : indicatif du pays + 8 à 10 chiffres. |
| `externalReference` | Facultative. |
| `description` | Facultative, 140 caractères max, montrée au client sur la demande de paiement. |
| `expiresInMinutes` | `15`, `60` ou `1440`. |

Réponse `201` : le `Payment` créé, avec `status = PENDING`, son `paymentNumber` et
`expiresAt = createdAt + expiresInMinutes`. Il s'affiche aussitôt dans la fenêtre « Paiement créé
avec succès ».

Erreurs :

| Cas | Statut | Message |
|---|---|---|
| Compte prestataire inactif | `422` | « Ce compte prestataire n'est pas actif. » |
| Montant hors bornes | `422` | « Le montant minimum est de 100. » (ou le maximum) |
| Téléphone invalide | `422` | « Numéro de téléphone invalide. » |

Ensuite, le statut évolue par webhook (`SUCCESS`, `FAILED` ou `EXPIRED` à échéance) ; le front
recharge la liste.

---

## 5. 🆕 Remboursements programmés

Fonction entièrement nouvelle côté backend. Un remboursement est exécuté automatiquement à une
date choisie, et reste annulable jusque-là.

### 5.1 Modèle `ScheduledRefund`

```json
{
  "id": "sch_…",
  "paymentId": "…",
  "paymentNumber": "PL-261118-000176-3",
  "provider": "WAVE",
  "payerPhone": "+221782355399",
  "amount": null,
  "effectiveAmount": 1650000,
  "paymentAmount": 1650000,
  "currency": "XOF",
  "reason": "Geste commercial",
  "scheduledAt": "2026-11-19T09:00:00Z",
  "status": "SCHEDULED",
  "refundId": null,
  "failureReason": null,
  "createdBy": "Awa Diop",
  "createdAt": "2026-11-18T11:28:00Z"
}
```

| Champ | Description |
|---|---|
| `amount` | Montant demandé en centimes. **`null` = rembourser le solde restant au moment de l'exécution.** |
| `effectiveAmount` | Montant à afficher : le montant remboursé si `EXECUTED`, sinon le solde remboursable actuel (estimation pour un « solde total »). Si ce champ manque, l'écran affiche seulement « Solde total » sans somme. |
| `paymentAmount` | Montant initial du paiement. Sert à afficher « Partiel · sur X ». |
| `status` | `SCHEDULED`, `EXECUTED`, `CANCELLED` ou `FAILED`. |
| `refundId` | Le `Refund` créé à l'exécution. |
| `failureReason` | Raison de l'échec à l'exécution, en français. |
| `createdBy` | **Nom affichable** de l'auteur (colonne « Programmé par »). |

`effectiveAmount` et `paymentAmount` sont facultatifs dans le type du front, mais **nécessaires**
pour afficher la somme dans la liste et dans la fiche.

### 5.2 Routes

| Méthode et chemin | Rôle |
|---|---|
| `GET /api/v1/dashboard/scheduled-refunds` | Toutes les programmations de l'organisation. |
| `POST /api/v1/dashboard/payments/{paymentId}/scheduled-refunds` | Programmer un remboursement. |
| `POST /api/v1/dashboard/scheduled-refunds/{id}/cancel` | Annuler. Renvoie la programmation, passée en `CANCELLED`. |

**Ordre de la liste** : d'abord les `SCHEDULED` par `scheduledAt` croissant (la prochaine en
premier), puis les autres par `scheduledAt` décroissant. Pas de pagination aujourd'hui ; à prévoir
si les volumes grandissent.

Requête de programmation :

```json
{ "amount": 500000, "reason": "Retour de marchandise", "scheduledAt": "2026-11-19T09:00:00.000Z" }
```

`amount` absent = solde total. `scheduledAt` est envoyé en ISO UTC avec `Z`.

Règles et erreurs :

| Cas | Statut | Message |
|---|---|---|
| Paiement non remboursable | `409` | « Seul un paiement réussi peut être remboursé. » |
| `scheduledAt` passé ou dans moins d'1 minute (le front impose déjà au moins 5 minutes, et 90 jours au plus) | `422` | « La date d'exécution doit être dans le futur. » |
| Une programmation `SCHEDULED` existe déjà pour ce paiement | `409` | « Un remboursement est déjà programmé pour ce paiement. » |
| Partiel sur Wave | `422` | « Wave ne permet que le remboursement total d'un paiement. » |
| Montant > solde | `422` | « Le montant dépasse le solde remboursable. » |
| Annulation d'une programmation qui n'est plus `SCHEDULED` | `409` | « Ce remboursement n'est plus modifiable. » |
| Programmation introuvable | `404` | « Programmation introuvable. » |

### 5.3 Exécution, à faire tourner côté serveur

Une tâche planifiée (par exemple chaque minute) traite les programmations `SCHEDULED` dont
`scheduledAt` ≤ maintenant :

1. Revérifier le solde remboursable au moment de l'exécution.
2. Créer le remboursement avec les **mêmes règles qu'en 4.6**. `requestedBy` = `createdBy`.
3. Si ça réussit : `status = EXECUTED`, `refundId` renseigné.
4. Si ça échoue : `status = FAILED`, avec `failureReason`. **Aucun débit.**

L'écran l'annonce au marchand : « Si le paiement a été remboursé entre-temps, la programmation
échoue sans débit. »

---

## 6. Récapitulatif des routes

| Domaine | Méthode et chemin | Statut |
|---|---|---|
| Session | `GET /api/v1/me` | 🆕 **bloquant** |
| Connexion | `POST /api/v1/public/auth/login` | 🆕 **bloquant** |
| Connexion | `POST /api/v1/public/auth/refresh` | 🆕 **bloquant** |
| Connexion | `POST /api/v1/public/auth/logout` | 🆕 |
| Inscription | `POST /api/v1/public/register` | 🆕 |
| E-mail | `GET /api/v1/me/email-verification` | 🆕 |
| E-mail | `POST /api/v1/me/email-verification/resend` | 🆕 |
| E-mail | `POST /api/v1/me/email-verification/verify` | 🆕 |
| Organisation | `GET /api/v1/organizations` | ✅ |
| Organisation | `POST /api/v1/organizations` | ✅ (profil complet à ajouter) |
| Entreprise | `GET` et `PUT /api/v1/organizations/current/profile` | 🆕 |
| Préférences | `GET` et `PUT /api/v1/organizations/current/preferences` | 🆕 |
| Formules | `GET /api/v1/plans` | 🆕 |
| Formules | `GET` et `PUT /api/v1/organizations/current/plan` | 🆕 |
| Prestataires | `GET` et `POST /api/v1/dashboard/provider-accounts` | ✅ |
| Prestataires | `POST /api/v1/dashboard/provider-accounts/{id}/test` | 🆕 |
| Prestataires | `POST /api/v1/dashboard/provider-accounts/{id}/disable` | 🆕 |
| Onboarding | `POST /api/v1/onboarding/providers/complete` | 🆕 |
| Paiements | `GET /api/v1/dashboard/payments` | ✅ |
| Paiements | `GET /api/v1/dashboard/payments/stats` | ✅ (série quotidienne à ajouter) |
| Paiements | `GET /api/v1/dashboard/payments/{id}` | ✅ |
| Paiements | `GET /api/v1/dashboard/payments/{id}/history` | ✅ |
| Paiements | `GET` et `POST /api/v1/dashboard/payments/{id}/refunds` | ✅ |
| Paiements | `POST /api/v1/dashboard/payments` | 🆕 |
| Programmés | `GET /api/v1/dashboard/scheduled-refunds` | 🆕 |
| Programmés | `POST /api/v1/dashboard/payments/{id}/scheduled-refunds` | 🆕 |
| Programmés | `POST /api/v1/dashboard/scheduled-refunds/{id}/cancel` | 🆕 |
| Site public | `POST /api/v1/public/leads` | ✅ |

---

## 7. Données supplémentaires demandées

Ces ajouts ne sont pas indispensables au démarrage, mais l'interface est déjà prête à les
afficher.

### 7.1 Série quotidienne pour la courbe et les mini-graphiques

Aujourd'hui, le front réel affiche « La courbe quotidienne sera disponible lorsque le serveur
exposera une série par jour. ». Il suffit d'ajouter à la réponse de `/payments/stats` :

```json
{
  "daily": [
    { "date": "2026-11-17", "count": 12, "totalAmount": 84000000 },
    { "date": "2026-11-18", "count": 9, "totalAmount": 61000000 }
  ]
}
```

Règles :

- **un élément par jour** de la période, **y compris les jours à zéro** ;
- jours calculés dans le **fuseau de l'organisation** (préférence `timezone`) ;
- montants = paiements encaissés (`SUCCESS` + `PARTIALLY_REFUNDED`).

Le front alimentera alors `dailyVolume`, `dailyCount` et `previousDailyVolume`.

### 7.2 Export CSV

L'export appelle aujourd'hui la liste avec `size=1000` et construit le fichier dans le navigateur.
Au-delà de 1000 transactions, il sera tronqué. Deux options : autoriser `size` jusqu'à 1000
(minimum requis), ou ajouter une route
`GET /api/v1/dashboard/payments/export?format=csv&…` qui reprend les mêmes filtres que la liste.

### 7.3 Paramètres de date ✅ réglé

`from` et `to` sont envoyés avec `Z` (`toISOString()`, fonction `isoUtc` de
`livePaymentsApi.ts`). Le backend accepte les deux formats ; une date illisible renvoie `400`.

### 7.4 Rôles et droits

`organization.role` masque les actions : seuls `OWNER` et `ADMIN` voient Rembourser, Programmer,
Nouveau paiement, Annuler une programmation et la gestion des comptes prestataires
(`src/lib/session/permissions.ts`). C'est du confort d'affichage : le serveur reste juge et
répond `403`, dont le `message` est affiché tel quel.

---

## 8. Ce qui changera côté front quand le backend sera prêt

Pour chaque route 🆕, le travail côté front consiste à remplacer l'appel à `notAvailable(…)` ou
`ApiError.notAvailable(…)` par un `apiRequest` dans :

- [src/services/account/liveAccountApi.ts](../src/services/account/liveAccountApi.ts) : session,
  inscription, e-mail, entreprise, préférences, formules, test et désactivation des prestataires,
  fin d'onboarding ;
- [src/services/payments/livePaymentsApi.ts](../src/services/payments/livePaymentsApi.ts) :
  création de paiement, remboursements programmés, série quotidienne.

Les écrans ne changent presque pas : ils passent déjà par ces interfaces. Ajustements prévus :

- **Connexion** : `liveAccountApi.login` appellera `POST /public/auth/login` au lieu de rediriger
  vers Keycloak. `redirectLogin` passera à `false`, et la page `/connexion` affichera donc le champ
  mot de passe en mode réel. La fonction `token()` gardera le jeton en mémoire et appellera
  `/public/auth/refresh` (avec `credentials: 'include'`) au chargement et avant expiration.
  `keycloak-js` et `silent-check-sso.html` seront retirés.
- **Inscription** : après le `201`, redirection vers `/connexion` avec l'e-mail rempli (point 2.3).

## 9. Vérifier la conformité

1. Lancer le front en mode démo (`VITE_DEMO_MODE=true`) et parcourir l'inscription, l'onboarding
   et les transactions. C'est le comportement de référence.
2. Configurer `VITE_API_URL` et Keycloak, avec `VITE_DEMO_MODE=false`, puis refaire le même
   parcours.
3. Tout écran qui affiche « … n'est pas encore disponible sur le serveur Paylance » indique une
   route 🆕 qui n'a pas encore été branchée.
