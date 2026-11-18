import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { account as t } from '../../content/account.fr';
import { useSession, type SessionState } from '../../lib/session/sessionContext';
import {
  COMPANY_SIZES,
  COUNTRIES,
  findCountry,
  SECTORS,
} from '../../services/account/referenceData';
import {
  companySchema,
  normalizePhone,
  normalizeWebsite,
  type CompanyValues,
} from '../../services/account/schemas';
import type { CompanyProfile } from '../../services/account/types';
import { errorMessage } from '../../services/api/errors';
import { Field, inputClass, selectClass } from '../ui/form/Field';
import { FormAlert } from './FormAlert';
import { SubmitButton } from './SubmitButton';

type Props = {
  initial: CompanyProfile | null;
  /** Appelé après l'enregistrement (création ou mise à jour). */
  /** Reçoit l'état renvoyé par le serveur après l'enregistrement. */
  onSaved: (next: SessionState) => void;
};

const DEFAULT_COUNTRY = 'SN';

/** Création de l'entreprise (l'utilisateur devient OWNER) ou mise à jour de son profil. */
export function CompanyForm({ initial, onSaved }: Props) {
  const { api, refresh } = useSession();
  const [error, setError] = useState<string | null>(null);
  const isUpdate = Boolean(initial);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues: initial
      ? { ...initial, website: initial.website ?? '' }
      : {
          tradeName: '',
          legalName: '',
          country: DEFAULT_COUNTRY,
          sector: '',
          phone: `${findCountry(DEFAULT_COUNTRY)!.dialCode} `,
          website: '',
          size: '' as CompanyValues['size'],
        },
  });

  // Changement de pays : l'indicatif suit, tant que le numéro n'a pas été saisi.
  const countryField = register('country', {
    onChange: (event: { target: { value: string } }) => {
      const phone = normalizePhone(getValues('phone'));
      const isOnlyDialCode = !phone || COUNTRIES.some((country) => country.dialCode === phone);
      const next = findCountry(event.target.value);
      if (isOnlyDialCode && next) setValue('phone', `${next.dialCode} `);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await api.saveCompany({
        tradeName: values.tradeName.trim(),
        legalName: values.legalName.trim(),
        country: values.country,
        sector: values.sector,
        phone: normalizePhone(values.phone),
        website: normalizeWebsite(values.website),
        size: values.size as CompanyProfile['size'],
      });
      onSaved(await refresh());
    } catch (cause) {
      setError(errorMessage(cause));
    }
  });

  return (
    <form noValidate onSubmit={onSubmit}>
      <FormAlert title={t.company.errorTitle} message={error} />
      <div className="grid gap-x-5 gap-y-6 sm:grid-cols-2">
        <Field
          id="co-trade"
          label={t.company.tradeName}
          required
          hint={t.company.tradeNameHint}
          error={errors.tradeName?.message}
        >
          {(control) => (
            <input
              {...control}
              {...register('tradeName')}
              autoComplete="organization"
              className={inputClass}
            />
          )}
        </Field>
        <Field
          id="co-legal"
          label={t.company.legalName}
          required
          hint={t.company.legalNameHint}
          error={errors.legalName?.message}
        >
          {(control) => <input {...control} {...register('legalName')} className={inputClass} />}
        </Field>
        <Field id="co-country" label={t.company.country} required error={errors.country?.message}>
          {(control) => (
            <select {...control} {...countryField} autoComplete="country" className={selectClass}>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id="co-sector" label={t.company.sector} required error={errors.sector?.message}>
          {(control) => (
            <select {...control} {...register('sector')} className={selectClass}>
              <option value="" disabled>
                {t.company.choose}
              </option>
              {SECTORS.map((sector) => (
                <option key={sector} value={sector}>
                  {sector}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id="co-phone" label={t.company.phone} required error={errors.phone?.message}>
          {(control) => (
            <input
              {...control}
              {...register('phone')}
              type="tel"
              autoComplete="tel"
              className={inputClass}
            />
          )}
        </Field>
        <Field id="co-website" label={t.company.website} optional error={errors.website?.message}>
          {(control) => (
            <input
              {...control}
              {...register('website')}
              type="url"
              inputMode="url"
              autoComplete="url"
              placeholder="www.exemple.sn"
              className={inputClass}
            />
          )}
        </Field>
        <Field
          id="co-size"
          label={t.company.size}
          required
          error={errors.size?.message}
          className="sm:col-span-2"
        >
          {(control) => (
            <select
              {...control}
              {...register('size')}
              className={`${selectClass} sm:max-w-[calc(50%-0.625rem)]`}
            >
              <option value="" disabled>
                {t.company.choose}
              </option>
              {COMPANY_SIZES.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>
      <div className="mt-8 flex justify-end border-t border-neutral-200 pt-6">
        <SubmitButton loading={isSubmitting} className="w-full sm:w-auto">
          {isUpdate ? t.company.submitUpdate : t.company.submitCreate}
        </SubmitButton>
      </div>
    </form>
  );
}
