import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Circle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { account as t } from '../../content/account.fr';
import { useSession } from '../../lib/session/sessionContext';
import {
  PASSWORD_RULES,
  registerSchema,
  type RegisterValues,
} from '../../services/account/schemas';
import { ApiError, errorMessage } from '../../services/api/errors';
import { Checkbox } from '../ui/form/Checkbox';
import { Field, inputClass } from '../ui/form/Field';
import { PasswordInput } from '../ui/form/PasswordInput';
import { FormAlert } from './FormAlert';
import { SubmitButton } from './SubmitButton';

/** Création du compte utilisateur. La redirection vers /verify-email est faite par le garde de route. */
export function RegisterForm() {
  const { api, refresh } = useSession();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError: setFieldError,
    formState: { errors, isSubmitting, touchedFields },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });

  const password = watch('password');
  const showRules = Boolean(password) || Boolean(errors.password) || touchedFields.password;

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await api.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        acceptTerms: true,
      });
      await refresh();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        setFieldError('email', { message: cause.message }, { shouldFocus: true });
      } else {
        setError(errorMessage(cause));
      }
    }
  });

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-5">
      <FormAlert title={t.register.errorTitle} message={error} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id="reg-firstname"
          label={t.register.firstName}
          required
          error={errors.firstName?.message}
        >
          {(control) => (
            <input
              {...control}
              {...register('firstName')}
              autoComplete="given-name"
              className={inputClass}
            />
          )}
        </Field>
        <Field
          id="reg-lastname"
          label={t.register.lastName}
          required
          error={errors.lastName?.message}
        >
          {(control) => (
            <input
              {...control}
              {...register('lastName')}
              autoComplete="family-name"
              className={inputClass}
            />
          )}
        </Field>
      </div>

      <Field
        id="reg-email"
        label={t.register.email}
        required
        hint={t.register.emailHint}
        error={errors.email?.message}
      >
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

      <Field
        id="reg-password"
        label={t.register.password}
        required
        error={errors.password?.message}
      >
        {(control) => (
          <PasswordInput
            {...control}
            {...register('password')}
            autoComplete="new-password"
            aria-describedby={[control['aria-describedby'], 'reg-password-regles']
              .filter(Boolean)
              .join(' ')}
          />
        )}
      </Field>
      <div id="reg-password-regles" className={showRules ? '-mt-2' : 'sr-only'}>
        <p className="sr-only">{t.register.passwordRulesLabel}</p>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[0.8125rem]">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(password);
            return (
              <li
                key={rule.id}
                className={`flex items-center gap-1.5 ${ok ? 'text-primary-strong' : 'text-neutral-500'}`}
              >
                {ok ? (
                  <Check aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <Circle aria-hidden="true" className="h-3 w-3" />
                )}
                {rule.label}
                <span className="sr-only">{ok ? ' : respecté' : ' : non respecté'}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <Field
        id="reg-confirm"
        label={t.register.confirmPassword}
        required
        error={errors.confirmPassword?.message}
      >
        {(control) => (
          <PasswordInput
            {...control}
            {...register('confirmPassword')}
            autoComplete="new-password"
          />
        )}
      </Field>

      <Checkbox
        id="reg-terms"
        label={t.register.terms}
        error={errors.acceptTerms?.message}
        {...register('acceptTerms')}
      />

      <SubmitButton loading={isSubmitting} className="w-full">
        {t.register.submit}
      </SubmitButton>
    </form>
  );
}
