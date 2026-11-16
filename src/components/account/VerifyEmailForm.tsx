import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { account as t } from '../../content/account.fr';
import { ROUTES } from '../../lib/session/routing';
import { useSession } from '../../lib/session/sessionContext';
import type { EmailVerificationStatus } from '../../services/account/types';
import { errorMessage } from '../../services/api/errors';
import { Alert } from '../ui/Alert';
import { OtpInput } from '../ui/form/OtpInput';
import { Spinner } from '../ui/Spinner';
import { FormAlert } from './FormAlert';
import { SubmitButton } from './SubmitButton';

const CODE_LENGTH = 6;

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1_000));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return `${minutes} min ${seconds} s`;
}

/** Saisie du code OTP reçu par e-mail, avec expiration, tentatives et renvoi. */
export function VerifyEmailForm() {
  const { api, refresh, logout } = useSession();
  const navigate = useNavigate();
  const now = useNow();

  const [status, setStatus] = useState<EmailVerificationStatus | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const syncDemoCode = useCallback(() => setDemoCode(api.demo?.hints().lastCode ?? null), [api]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setStatus(await api.getEmailVerification());
      syncDemoCode();
    } catch (cause) {
      setLoadError(errorMessage(cause));
    }
  }, [api, syncDemoCode]);

  useEffect(() => {
    void load();
  }, [load]);

  const expired = status ? now >= Date.parse(status.expiresAt) : false;
  const exhausted = status ? status.attemptsLeft <= 0 : false;
  const resendWait = status
    ? Math.max(0, Math.ceil((Date.parse(status.resendAvailableAt) - now) / 1_000))
    : 0;
  const blocked = expired || exhausted;

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH || submitting || blocked) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await api.verifyEmail(value);
      await refresh();
    } catch (cause) {
      setError(errorMessage(cause));
      setCode('');
      // Le serveur a décompté la tentative : on relit l'état à jour.
      try {
        setStatus(await api.getEmailVerification());
      } catch {
        // l'erreur principale est déjà affichée
      }
      setSubmitting(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void verify(code);
  };

  const onResend = async () => {
    setResending(true);
    setError(null);
    setNotice(null);
    try {
      setStatus(await api.sendVerificationCode());
      syncDemoCode();
      setCode('');
      setNotice(t.verify.resent);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setResending(false);
    }
  };

  const onRestart = async () => {
    await logout();
    navigate(ROUTES.register, { replace: true });
  };

  if (loadError) {
    return (
      <Alert tone="error" title={t.common.errorTitle}>
        <p>{loadError}</p>
        <button type="button" onClick={() => void load()} className="mt-2 font-semibold underline">
          {t.common.retry}
        </button>
      </Alert>
    );
  }

  if (!status) {
    return (
      <p role="status" className="flex items-center gap-2 text-neutral-500">
        <Spinner /> {t.common.loading}
      </p>
    );
  }

  return (
    <form noValidate onSubmit={onSubmit} className="max-w-md">
      <FormAlert title={t.common.errorTitle} message={error} />
      {notice && <Alert tone="success" title={notice} className="mb-6" />}

      {demoCode && !blocked && (
        <div className="mb-6 rounded-xl bg-neutral-50 p-4 text-sm ring-1 ring-neutral-200">
          <p className="font-semibold text-neutral-900">{t.demo.codeTitle}</p>
          <p className="mt-1 text-neutral-600">
            {t.demo.codeText}{' '}
            <span className="font-semibold tabular-nums tracking-[0.2em] text-neutral-950">
              {demoCode}
            </span>
          </p>
        </div>
      )}

      <OtpInput
        value={code}
        onChange={setCode}
        onComplete={(value) => void verify(value)}
        disabled={submitting || blocked}
        invalid={Boolean(error)}
        describedBy="otp-etat"
      />

      <p
        id="otp-etat"
        aria-live="polite"
        className={`mt-3 text-sm ${blocked ? 'text-red-700' : 'text-neutral-500'}`}
      >
        {expired
          ? t.verify.expired
          : exhausted
            ? t.verify.noAttempts
            : `${t.verify.expiresIn(formatDuration(Date.parse(status.expiresAt) - now))} ${t.verify.attemptsLeft(status.attemptsLeft)}`}
      </p>

      <SubmitButton
        loading={submitting}
        disabled={code.length !== CODE_LENGTH || blocked}
        className="mt-6 w-full"
      >
        {t.verify.submit}
      </SubmitButton>

      <p className="mt-6 text-sm text-neutral-600">
        {t.verify.notReceived}{' '}
        <button
          type="button"
          onClick={() => void onResend()}
          disabled={resending || resendWait > 0}
          className="font-semibold text-primary-strong underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-neutral-400 disabled:no-underline"
        >
          {resending ? <Spinner className="inline h-3.5 w-3.5" /> : null}
          {resendWait > 0 ? t.verify.resendIn(resendWait) : t.verify.resend}
        </button>
        .
      </p>
      <p className="mt-2 text-sm text-neutral-600">
        {t.verify.wrongEmail}{' '}
        <button
          type="button"
          onClick={() => void onRestart()}
          className="font-semibold text-neutral-900 underline-offset-4 hover:underline"
        >
          {t.verify.restart}
        </button>
      </p>
    </form>
  );
}
