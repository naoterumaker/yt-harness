import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'danger';

const variantStyles: Record<Variant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
