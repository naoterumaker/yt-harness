interface QuotaGaugeProps {
  used: number;
  limit: number;
}

export function QuotaGauge({ used, limit }: QuotaGaugeProps) {
  const remaining = limit - used;
  const pct = limit > 0 ? (remaining / limit) * 100 : 0;

  let color = 'bg-green-500';
  if (pct < 20) color = 'bg-red-500';
  else if (pct < 50) color = 'bg-yellow-500';

  const usedPct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 w-32 rounded-full bg-gray-700">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
      <span className="text-xs text-gray-400">
        {used.toLocaleString()} / {limit.toLocaleString()} ユニット
      </span>
    </div>
  );
}
