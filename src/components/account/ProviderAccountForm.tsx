import { zodResolver } from '@hookform/resolvers/zod';
import { Lock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { account as t } from '../../content/account.fr';
import { useSession } from '../../lib/session/sessionContext';
import type { ProviderDefinition } from '../../services/account/referenceData';
import type { EnvironmentType, ProviderAccount } from '../../services/account/types';
import { errorMessage } from '../../services/api/errors';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/form/Field';
import { PasswordInput } from '../ui/form/PasswordInput';
import { FormAlert } from './FormAlert';
import { SubmitButton } from './SubmitButton';

const f = t.providers.form;

function buildSchema(provider: ProviderDefinition) {
  const credentials = Object.fromEntries(
    provider.credentialFields.map((field) => [
      field.key,
      field.required ? z.string().trim().min(1, f.required).max(500) : z.string().trim().max(500),
    ]),
  );
  return z.object({
    label: z.string().trim().min(1, f.labelRequired).max(150),
    environment: z.enum(['TEST', 'LIVE']),
    credentials: z.object(credentials),
    webhookSecret: z.string().trim().max(500),
  });
}

type Values = {
  label: string;
  environment: EnvironmentType;
  credentials: Record<string, string>;
  webhookSecret: string;
};

type Props = {
  provider: ProviderDefinition;
  /** Compte créé (le test de connexion est lancé ensuite par le parent). */
  onCreated: (account: ProviderAccount) => void;
  onCancel: () => void;
};

/** Configuration API assistée : guide, environnement, identifiants chiffrés côté serveur. */
export function ProviderAccountForm({ provider, onCreated, onCancel }: Props) {
  const { api } = useSession();
  const [error, setError] = useState<string | null>(null);
  const schema = useMemo(() => buildSchema(provider), [provider]);
  const idPrefix = `pa-${provider.id.toLowerCase()}`;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: '',
      environment: 'TEST',
      credentials: Object.fromEntries(provider.credentialFields.map((field) => [field.key, ''])),
      webhookSecret: '',
    },
  });
  const environment = watch('environment');

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const credentials = Object.fromEntries(
        Object.entries(values.credentials).filter(([, value]) => value.trim() !== ''),
      );
      const account = await api.createProviderAccount({
        provider: provider.id,
        label: values.label,
        environment: values.environment,
        credentials,
        webhookSecret: values.webhookSecret || undefined,
      });
      onCreated(account);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  });

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="rounded-xl bg-neutral-50 p-4 ring-1 ring-neutral-200 sm:p-6"
    >
      <h3 className="text-base font-semibold text-neutral-950">{f.title(provider.name)}</h3>

      <details className="group mt-4 rounded-lg bg-white ring-1 ring-neutral-200">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-neutral-900 [&::-webkit-details-marker]:hidden">
          <span
            className="mr-2 inline-block transition-transform group-open:rotate-90"
            aria-hidden="true"
          >
            ›
          </span>
          {f.guideTitle}
        </summary>
        <ol className="list-decimal space-y-1.5 px-4 pb-4 pl-9 text-sm text-neutral-600">
          {provider.setupSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </details>

      <div className="mt-6">
        <FormAlert title={f.errorTitle} message={error} />
      </div>

      <div className="space-y-6">
        <Field
          id={`${idPrefix}-label`}
          label={f.label}
          required
          hint={f.labelHint}
          error={errors.label?.message}
        >
          {(control) => (
            <input {...control} {...register('label')} autoComplete="off" className={inputClass} />
          )}
        </Field>

        <fieldset>
          <legend className="text-sm font-medium text-neutral-900">{f.environment}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {(['TEST', 'LIVE'] as const).map((env) => (
              <label
                key={env}
                className={`flex cursor-pointer gap-3 rounded-lg bg-white p-3.5 ring-1 transition-shadow ${
                  environment === env
                    ? 'ring-2 ring-primary-strong'
                    : 'ring-neutral-200 hover:ring-neutral-300'
                }`}
              >
                <input
                  type="radio"
                  value={env}
                  {...register('environment')}
                  className="mt-0.5 accent-primary-strong"
                />
                <span className="text-sm">
                  <span className="block font-semibold text-neutral-900">
                    {f.environments[env].label}
                  </span>
                  <span className="block text-neutral-500">{f.environments[env].description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="border-t border-neutral-200 pt-6">
          <legend className="sr-only">{f.credentialsTitle}</legend>
          <p aria-hidden="true" className="text-sm font-semibold text-neutral-900">
            {f.credentialsTitle}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[0.8125rem] text-neutral-500">
            <Lock aria-hidden="true" className="h-3.5 w-3.5" />
            {f.encrypted}
          </p>
          <div className="mt-5 grid gap-x-5 gap-y-5 sm:grid-cols-2">
            {provider.credentialFields.map((field) => (
              <Field
                key={field.key}
                id={`${idPrefix}-${field.key}`}
                label={field.label}
                required={field.required}
                optional={!field.required}
                hint={field.hint}
                error={errors.credentials?.[field.key]?.message}
              >
                {(control) =>
                  field.secret ? (
                    <PasswordInput
                      {...control}
                      {...register(`credentials.${field.key}`)}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  ) : (
                    <input
                      {...control}
                      {...register(`credentials.${field.key}`)}
                      autoComplete="off"
                      spellCheck={false}
                      className={inputClass}
                    />
                  )
                }
              </Field>
            ))}
            <Field
              id={`${idPrefix}-webhook`}
              label={provider.webhookSecret.label}
              optional
              hint={provider.webhookSecret.hint}
              error={errors.webhookSecret?.message}
              className="sm:col-span-2"
            >
              {(control) => (
                <PasswordInput
                  {...control}
                  {...register('webhookSecret')}
                  autoComplete="off"
                  spellCheck={false}
                />
              )}
            </Field>
          </div>
        </fieldset>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:justify-end">
        <Button variant="secondaryLight" onClick={onCancel} disabled={isSubmitting}>
          {f.cancel}
        </Button>
        <SubmitButton loading={isSubmitting}>{f.submit}</SubmitButton>
      </div>
    </form>
  );
}
