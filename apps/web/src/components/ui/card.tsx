interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export function Card({ title, value, subtitle, className = '' }: CardProps) {
  return (
    <div className={`rounded-lg bg-gray-800 p-5 ${className}`}>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-100">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}
