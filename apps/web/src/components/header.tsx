import { QuotaGauge } from './quota-gauge';

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-800 bg-gray-900 px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-medium text-gray-300">Channel:</h2>
        <select className="rounded-md border border-gray-700 bg-gray-800 px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none">
          <option>My Channel</option>
          <option>Second Channel</option>
        </select>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-gray-400">Quota</span>
        <QuotaGauge used={4200} limit={10000} />
      </div>
    </header>
  );
}
