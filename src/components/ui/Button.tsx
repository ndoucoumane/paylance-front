import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export type ButtonVariant =
  'primary' | 'secondaryDark' | 'secondaryLight' | 'ghostDark' | 'ghostLight';
export type ButtonSize = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-strong text-white hover:bg-primary-hover',
  secondaryDark: 'border border-white/25 text-white hover:border-white/40 hover:bg-white/10',
  secondaryLight:
    'bg-white text-neutral-950 ring-1 ring-inset ring-neutral-950/15 hover:bg-neutral-50 active:bg-neutral-100',
  ghostDark: 'text-white/90 hover:bg-white/10 hover:text-white',
  ghostLight: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950',
};

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-10 px-4 py-2 text-sm',
  lg: 'min-h-12 px-6 py-3 text-[15px]',
};

function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className = '',
): string {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

export function Button({
  variant,
  size,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

type ButtonLinkProps = LinkProps & { variant?: ButtonVariant; size?: ButtonSize };

export function ButtonLink({ variant, size, className, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
