import { Spinner } from '../ui/Spinner';

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Spinner className="h-6 w-6 text-primary-strong" />
    </div>
  );
}
