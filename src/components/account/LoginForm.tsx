import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getResetPasswordUrl } from '../../config/env';
import { account as t } from '../../content/account.fr';
import { useSession } from '../../lib/session/sessionContext';
import { loginSchema, type LoginValues } from '../../services/account/schemas';
import { ApiError, errorMessage } from '../../services/api/errors';
import { Field, inputClass } from '../ui/form/Field';
import { PasswordInput } from '../ui/form/PasswordInput';
import { FormAlert } from './FormAlert';
import { SubmitButton } from './SubmitButton';

/**
 * Connexion. En mode réel, l'authentification est déléguée à Keycloak :
 * seule l'adresse e-mail est demandée ici, puis l'utilisateur est redirigé.
 */
export function LoginForm() {
  const { api, refresh } = useSession();
  const [error, setError] = useState<string | null>(null);
  const redirect = api.redirectLogin;
  const hints = api.demo?.hints();
  const resetUrl = redirect ? getResetPasswordUrl() : null;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(redirect ? loginSchema.pick({ email: true }) : loginSchema) as never,
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await api.login(values.email, values.password);
      await refresh();
    } catch (cause) {
      // Ici, un 401 signifie « identifiants refusés », pas « session expirée ».
      const invalidCredentials = cause instanceof ApiError && cause.status === 401;
      setError(invalidCredentials ? t.login.invalidCredentials : errorMessage(cause));
    }
  });

  return (
    <>
      <form noValidate onSubmit={onSubmit} className="space-y-5">
        <FormAlert title={t.login.errorTitle} message={error} />
        <Field id="login-email" label={t.login.email} required error={errors.email?.message}>
          {(control) => (
            <input
              {...control}
              {...register('email')}
              type="email"
              autoComplete="email"
              className={inputClass}
            />
          )}
        </Field>
        {!redirect && (
          <Field
            id="login-password"
            label={t.login.password}
            required
            error={errors.password?.message}
          >
            {(control) => (
              <PasswordInput
                {...control}
                {...register('password')}
                autoComplete="current-password"
              />
            )}
          </Field>
        )}
        {redirect && <p className="text-sm text-neutral-500">{t.login.redirectHint}</p>}
        <SubmitButton loading={isSubmitting} className="w-full">
          {redirect ? t.login.submitRedirect : t.login.submit}
        </SubmitButton>
        {resetUrl && (
          <p className="text-center text-sm">
            <a
              href={resetUrl}
              className="font-medium text-neutral-700 underline-offset-4 hover:underline"
            >
              {t.login.forgot}
            </a>
          </p>
        )}
      </form>

      {hints && (
        <div className="mt-8 rounded-xl bg-neutral-50 p-4 text-sm ring-1 ring-neutral-200">
          <p className="font-semibold text-neutral-900">{t.demo.accountTitle}</p>
          <p className="mt-1 text-neutral-600">{t.demo.accountText}</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.8125rem]">
            <dt className="text-neutral-500">E-mail</dt>
            <dd className="font-medium text-neutral-900">{hints.email}</dd>
            <dt className="text-neutral-500">Mot de passe</dt>
            <dd className="font-medium text-neutral-900">{hints.password}</dd>
          </dl>
          <button
            type="button"
            onClick={() => {
              setValue('email', hints.email, { shouldValidate: true });
              setValue('password', hints.password, { shouldValidate: true });
            }}
            className="mt-3 font-semibold text-primary-strong underline-offset-4 hover:underline"
          >
            {t.demo.useAccount}
          </button>
        </div>
      )}
    </>
  );
}
