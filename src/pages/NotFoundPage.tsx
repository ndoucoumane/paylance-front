import { SiteLayout } from '../components/layout/SiteLayout';
import { ButtonLink } from '../components/ui/Button';
import { Container } from '../components/ui/Container';
import { fr } from '../content/fr';
import { usePageTitle } from '../lib/hooks/usePageTitle';

export default function NotFoundPage() {
  usePageTitle(fr.meta.notFoundTitle);
  return (
    <SiteLayout>
      <Container className="flex min-h-[60vh] flex-col items-start justify-center py-20">
        <p className="font-display text-sm font-semibold text-primary-strong">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-content sm:text-4xl">
          {fr.notFound.title}
        </h1>
        <p className="mt-4 text-lg text-content-body">{fr.notFound.text}</p>
        <ButtonLink to="/" className="mt-8">
          {fr.notFound.backHome}
        </ButtonLink>
      </Container>
    </SiteLayout>
  );
}
