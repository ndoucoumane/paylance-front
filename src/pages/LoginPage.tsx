import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/account/AuthLayout';
import { LoginForm } from '../components/account/LoginForm';
import { account as t } from '../content/account.fr';
import { usePageTitle } from '../lib/hooks/usePageTitle';
import { ROUTES } from '../lib/session/routing';

export default function LoginPage() {
  usePageTitle(t.meta.login);
  return (
    <AuthLayout
      title={t.login.title}
      subtitle={t.login.subtitle}
      topLink={
        <>
          <span className="hidden sm:inline">{t.login.noAccount} </span>
          <Link
            to={ROUTES.register}
            className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
          >
            {t.login.register}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
