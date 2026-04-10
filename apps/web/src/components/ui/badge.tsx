import { cn } from '@/lib/utils';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info';

const variantStyles: Record<Variant, string> = {
  default: 'bg-gray-700 text-gray-300',
  success: 'bg-green-900/60 text-green-400',
  warning: 'bg-yellow-900/60 text-yellow-400',
  danger: 'bg-red-900/60 text-red-400',
  info: 'bg-blue-900/60 text-blue-400',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
