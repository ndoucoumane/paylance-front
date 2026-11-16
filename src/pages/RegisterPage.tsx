import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/account/AuthLayout';
import { RegisterForm } from '../components/account/RegisterForm';
import { account as t } from '../content/account.fr';
import { usePageTitle } from '../lib/hooks/usePageTitle';
import { ROUTES } from '../lib/session/routing';

export default function RegisterPage() {
  usePageTitle(t.meta.register);
  return (
    <AuthLayout
      title={t.register.title}
      subtitle={t.register.subtitle}
      topLink={
        <>
          <span className="hidden sm:inline">{t.register.hasAccount} </span>
          <Link
            to={ROUTES.login}
            className="font-semibold text-neutral-950 underline-offset-4 hover:underline"
          >
            {t.register.login}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
