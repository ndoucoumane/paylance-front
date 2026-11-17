# Images du site

Déposez ici les images à intégrer dans les pages (PNG, JPG, WebP, SVG, AVIF).

## Utilisation dans un composant

```tsx
import hero from '../assets/images/hero.webp';

<img src={hero} alt="Description de l’image" width={1200} height={800} />;
```

Vite optimise et renomme le fichier au build (ex. `hero-3f9a2c.webp`) : le cache
navigateur est donc toujours à jour.

## Conseils

- Noms en minuscules, sans espaces ni accents : `equipe-dakar.webp`.
- Préférez le **WebP** (ou l’AVIF) pour les photos, le **SVG** pour les logos et icônes.
- Visez moins de 200 Ko par image ; redimensionnez à la taille d’affichage réelle.
- Renseignez toujours `alt` (vide `alt=""` si l’image est purement décorative).

## Et le dossier `public/` ?

Réservé aux fichiers dont l’URL doit rester fixe (favicon, `robots.txt`, image de
partage Open Graph…). Ils sont copiés tels quels et référencés par `/nom-du-fichier`.
