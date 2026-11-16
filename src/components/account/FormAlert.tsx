import { Alert } from '../ui/Alert';

/** Erreur globale d'un formulaire, annoncée aux lecteurs d'écran. */
export function FormAlert({ title, message }: { title: string; message: string | null }) {
  if (!message) return null;
  return (
    <Alert tone="error" title={title} className="mb-6">
      {message}
    </Alert>
  );
}
