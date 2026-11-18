import { LogoMark } from '../ui/Logo';
import { Spinner } from '../ui/Spinner';

export function PageLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white">
      <LogoMark size="lg" className="motion-safe:animate-pulse" />
      <Spinner className="h-5 w-5 text-primary-strong" />
    </div>
  );
}
