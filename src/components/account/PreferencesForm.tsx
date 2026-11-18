import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { account as t } from '../../content/account.fr';
import { useSession, type SessionState } from '../../lib/session/sessionContext';
import { CURRENCIES, LANGUAGES, TIMEZONES } from '../../services/account/referenceData';
import { preferencesSchema, type PreferencesValues } from '../../services/account/schemas';
import type { NotificationPreferences, Preferences } from '../../services/account/types';
import { errorMessage } from '../../services/api/errors';
import { Checkbox } from '../ui/form/Checkbox';
import { Field, selectClass } from '../ui/form/Field';
import { FormAlert } from './FormAlert';
import { SubmitButton } from './SubmitButton';

const NOTIFICATION_KEYS = Object.keys(
  t.preferences.notifications,
) as (keyof NotificationPreferences)[];

type Props = {
  /** Préférences enregistrées, ou valeurs proposées selon le pays. */
  initial: Preferences;
  /** Reçoit l'état renvoyé par le serveur après l'enregistrement. */
  onSaved: (next: SessionState) => void;
};

export function PreferencesForm({ initial, onSaved }: Props) {
  const { api, refresh } = useSession();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PreferencesValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: initial,
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await api.savePreferences(values);
      onSaved(await refresh());
    } catch (cause) {
      setError(errorMessage(cause));
    }
  });

  return (
    <form noValidate onSubmit={onSubmit}>
      <FormAlert title={t.preferences.errorTitle} message={error} />

      <fieldset>
        <legend className="text-base font-semibold text-neutral-950">
          {t.preferences.regionalTitle}
        </legend>
        <div className="mt-5 grid gap-x-5 gap-y-6 sm:grid-cols-2">
          <Field
            id="pref-currency"
            label={t.preferences.currency}
            required
            hint={t.preferences.currencyHint}
            error={errors.currency?.message}
            className="sm:col-span-2"
          >
            {(control) => (
              <select
                {...control}
                {...register('currency')}
                className={`${selectClass} sm:max-w-[calc(50%-0.625rem)]`}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="pref-timezone"
            label={t.preferences.timezone}
            required
            error={errors.timezone?.message}
          >
            {(control) => (
              <select {...control} {...register('timezone')} className={selectClass}>
                {TIMEZONES.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id="pref-language"
            label={t.preferences.language}
            required
            error={errors.language?.message}
          >
            {(control) => (
              <select {...control} {...register('language')} className={selectClass}>
                {LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-10 border-t border-neutral-200 pt-8">
        <legend className="sr-only">{t.preferences.notificationsTitle}</legend>
        <p aria-hidden="true" className="text-base font-semibold text-neutral-950">
          {t.preferences.notificationsTitle}
        </p>
        <div className="mt-5 space-y-4">
          {NOTIFICATION_KEYS.map((key) => (
            <Checkbox
              key={key}
              id={`pref-notif-${key}`}
              label={t.preferences.notifications[key].label}
              description={t.preferences.notifications[key].description}
              {...register(`notifications.${key}`)}
            />
          ))}
        </div>
      </fieldset>

      <div className="mt-8 flex justify-end border-t border-neutral-200 pt-6">
        <SubmitButton loading={isSubmitting} className="w-full sm:w-auto">
          {t.preferences.submit}
        </SubmitButton>
      </div>
    </form>
  );
}
