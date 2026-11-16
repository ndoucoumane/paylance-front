import { Component, type ErrorInfo, type ReactNode } from 'react';
import { fr } from '../../content/fr';

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Filet de sécurité : jamais de page blanche.
 * Cas typique : un module chargé à la demande qui ne se télécharge pas (réseau coupé).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 text-center text-neutral-950">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">{fr.errorPage.title}</h1>
          <p className="mt-3 text-neutral-600">{fr.errorPage.text}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary-strong px-5 font-semibold text-white hover:bg-primary-hover"
          >
            {fr.errorPage.reload}
          </button>
        </div>
      </div>
    );
  }
}
