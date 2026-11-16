import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Send } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useSearchParams } from 'react-router-dom';
import { fr } from '../../content/fr';
import { isSubject, leadSchema, type LeadFormValues } from '../../services/leadSchema';
import { leadService } from '../../services/leadService';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

const t = fr.contact;

const DEFAULT_VALUES: LeadFormValues = {
  name: '',
  company: '',
  email: '',
  phone: '+221 ',
  sector: '',
  volume: '',
  subject: 'acces_anticipe',
  message: '',
};

const inputClass =
  'block w-full rounded-lg border border-surface-line-strong bg-surface-card px-3.5 py-2.5 text-base text-content placeholder:text-content-muted focus:border-primary-strong focus:outline-none focus:ring-2 focus:ring-primary/40 aria-[invalid=true]:border-red-700';

type ControlProps = {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
};

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  optionalLabel?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: (control: ControlProps) => ReactNode;
};

function Field({
  id,
  label,
  required,
  optionalLabel,
  hint,
  error,
  className = '',
  children,
}: FieldProps) {
  const hintId = hint ? `${id}-aide` : undefined;
  const errorId = error ? `${id}-erreur` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-content">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-700">
            *
          </span>
        )}
        {optionalLabel && (
          <span className="ml-1 font-normal text-content-muted">({optionalLabel})</span>
        )}
      </label>
      <div className="mt-1.5">
        {children({
          id,
          'aria-invalid': Boolean(error),
          'aria-describedby': describedBy,
          'aria-required': required || undefined,
        })}
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm text-content-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted"
      />
    </div>
  );
}

type Status = 'idle' | 'success' | 'error';

export function ContactForm() {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onTouched',
  });

  const [status, setStatus] = useState<Status>('idle');
  const successRef = useRef<HTMLDivElement>(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const subjectParam = searchParams.get('sujet');

  // Sujet pré-sélectionné via l'URL, ex. /?sujet=partenariat#contact
  useEffect(() => {
    if (subjectParam && isSubject(subjectParam)) {
      setValue('subject', subjectParam, { shouldDirty: true });
      setStatus((current) => (current === 'success' ? 'idle' : current));
    }
  }, [subjectParam, setValue, location.key]);

  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  const onSubmit = async (values: LeadFormValues) => {
    setStatus('idle');
    try {
      await leadService.submit(values);
      reset(DEFAULT_VALUES);
      setStatus('success');
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div ref={successRef} tabIndex={-1} className="space-y-6 focus:outline-none">
        <Alert tone="success" title={t.successTitle}>
          {t.successText}
        </Alert>
        <Button variant="secondaryLight" onClick={() => setStatus('idle')}>
          {t.successAgain}
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <p className="text-sm text-content-muted">{t.requiredHint}</p>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-nom" label={t.fields.name.label} required error={errors.name?.message}>
          {(control) => (
            <input
              {...control}
              {...register('name')}
              type="text"
              autoComplete="name"
              placeholder={t.fields.name.placeholder}
              className={inputClass}
            />
          )}
        </Field>
        <Field
          id="contact-entreprise"
          label={t.fields.company.label}
          required
          error={errors.company?.message}
        >
          {(control) => (
            <input
              {...control}
              {...register('company')}
              type="text"
              autoComplete="organization"
              placeholder={t.fields.company.placeholder}
              className={inputClass}
            />
          )}
        </Field>
        <Field
          id="contact-email"
          label={t.fields.email.label}
          required
          error={errors.email?.message}
        >
          {(control) => (
            <input
              {...control}
              {...register('email')}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={t.fields.email.placeholder}
              className={inputClass}
            />
          )}
        </Field>
        <Field
          id="contact-telephone"
          label={t.fields.phone.label}
          required
          hint={t.fields.phone.hint}
          error={errors.phone?.message}
        >
          {(control) => (
            <input
              {...control}
              {...register('phone')}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder={t.fields.phone.placeholder}
              className={inputClass}
            />
          )}
        </Field>
        <Field
          id="contact-secteur"
          label={t.fields.sector.label}
          required
          error={errors.sector?.message}
        >
          {(control) => (
            <SelectWrapper>
              <select
                {...control}
                {...register('sector')}
                className={`${inputClass} appearance-none pr-10`}
              >
                <option value="" disabled>
                  {t.fields.sector.placeholder}
                </option>
                {t.sectors.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          )}
        </Field>
        <Field
          id="contact-volume"
          label={t.fields.volume.label}
          required
          error={errors.volume?.message}
        >
          {(control) => (
            <SelectWrapper>
              <select
                {...control}
                {...register('volume')}
                className={`${inputClass} appearance-none pr-10`}
              >
                <option value="" disabled>
                  {t.fields.volume.placeholder}
                </option>
                {t.volumes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          )}
        </Field>
      </div>

      <fieldset aria-describedby={errors.subject ? 'contact-sujet-erreur' : undefined}>
        <legend className="text-sm font-medium text-content">
          {t.fields.subject.label}
          <span aria-hidden="true" className="ml-0.5 text-red-700">
            *
          </span>
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {t.subjects.map((option) => (
            <label
              key={option.value}
              className="relative inline-flex cursor-pointer items-center gap-2 rounded-lg border border-surface-line-strong bg-surface-card px-3.5 py-2 text-sm font-medium text-content has-[:checked]:border-primary-strong has-[:checked]:bg-primary-soft has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/50"
            >
              <input
                type="radio"
                value={option.value}
                {...register('subject')}
                className="h-4 w-4 accent-primary-strong focus:outline-none"
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors.subject && (
          <p id="contact-sujet-erreur" className="mt-1.5 text-sm font-medium text-red-700">
            {errors.subject.message}
          </p>
        )}
      </fieldset>

      <Field
        id="contact-message"
        label={t.fields.message.label}
        optionalLabel={t.fields.message.optional}
        error={errors.message?.message}
      >
        {(control) => (
          <textarea
            {...control}
            {...register('message')}
            rows={4}
            placeholder={t.fields.message.placeholder}
            className={`${inputClass} resize-y`}
          />
        )}
      </Field>

      {status === 'error' && (
        <Alert tone="error" title={t.errorTitle}>
          {t.errorText}
        </Alert>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-content-muted sm:max-w-xs">{t.privacy}</p>
        <Button type="submit" size="lg" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner />
              {t.submitting}
            </>
          ) : (
            <>
              <Send aria-hidden="true" className="h-4 w-4" />
              {t.submit}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
