import { fr } from '../../content/fr';
import { Section, SectionHeading } from '../ui/Section';

/**
 * Emplacement prêt pour une preuve sociale réelle (témoignages autorisés).
 * Désactivé par défaut : rien n'est affiché tant que `fr.socialProof.enabled` est false
 * ou qu'aucun témoignage n'est renseigné. Ne jamais y mettre de contenu inventé.
 */
export function SocialProof() {
  const { socialProof } = fr;
  if (!socialProof.enabled || socialProof.items.length === 0) return null;

  return (
    <Section id="temoignages" tone="white">
      <SectionHeading
        id="temoignages"
        eyebrow={socialProof.eyebrow}
        title={socialProof.title}
        align="center"
      />
      <ul className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {socialProof.items.map((item) => (
          <li key={`${item.author}-${item.company}`}>
            <figure className="h-full rounded-xl bg-surface p-6 ring-1 ring-surface-line">
              <blockquote className="leading-relaxed text-content">« {item.quote} »</blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold text-content">{item.author}</span>
                <span className="text-content-muted">
                  {' '}
                  · {item.role}, {item.company}
                </span>
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </Section>
  );
}
