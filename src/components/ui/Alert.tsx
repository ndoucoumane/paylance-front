import { CircleAlert, CircleCheck } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
  tone: 'error' | 'success';
  title: string;
  children?: ReactNode;
  className?: string;
};

export function Alert({ tone, title, children, className = '' }: Props) {
  const isError = tone === 'error';
  const Icon = isError ? CircleAlert : CircleCheck;
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex gap-3 rounded-lg border p-4 text-sm ${
        isError
          ? 'border-red-200 bg-red-50 text-red-900'
          : 'border-primary/30 bg-primary-soft text-content'
      } ${className}`}
    >
      <Icon
        aria-hidden="true"
        className={`mt-0.5 h-5 w-5 shrink-0 ${isError ? 'text-red-700' : 'text-primary-strong'}`}
      />
      <div>
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 leading-relaxed">{children}</div>}
      </div>
    </div>
  );
}
