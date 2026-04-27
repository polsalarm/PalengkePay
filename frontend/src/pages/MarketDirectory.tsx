import { useState } from 'react';
import { Search, Store, MapPin, Tag, RefreshCw } from 'lucide-react';
import { useAllVendors } from '../lib/hooks/useVendor';
import type { VendorProfile } from '../lib/hooks/useVendor';

const PRODUCT_EMOJIS: Record<string, string> = {
  fish: '🐟',
  meat: '🥩',
  vegetables: '🥦',
  fruits: '🍎',
  'rice & grains': '🌾',
  spices: '🌶️',
  other: '🛒',
};

function VendorCard({ vendor }: { vendor: VendorProfile }) {
  const emoji = PRODUCT_EMOJIS[vendor.productType] ?? '🛒';
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-2 hover:border-teal-300 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{vendor.name}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin size={11} className="text-slate-400 shrink-0" />
            <p className="text-xs text-slate-500">Stall {vendor.stallNumber}</p>
          </div>
        </div>
        <span className="text-2xl shrink-0">{emoji}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Tag size={11} className="text-teal-500 shrink-0" />
        <span className="text-xs font-medium text-teal-700 capitalize">{vendor.productType}</span>
        {vendor.isActive && (
          <span className="ml-auto text-xs font-medium text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
            Open
          </span>
        )}
      </div>
      {vendor.totalTransactions > 0 && (
        <p className="text-xs text-slate-400">
          {vendor.totalTransactions} transaction{vendor.totalTransactions !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

const ALL_TYPES = ['all', 'fish', 'meat', 'vegetables', 'fruits', 'rice & grains', 'spices', 'other'];

export function MarketDirectory() {
  const { vendors, isLoading, error, refetch } = useAllVendors();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const active = vendors.filter((v) => v.isActive);

  const filtered = active.filter((v) => {
    const matchType = typeFilter === 'all' || v.productType === typeFilter;
    const q = query.toLowerCase();
    const matchQuery =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.stallNumber.toLowerCase().includes(q) ||
      v.productType.toLowerCase().includes(q);
    return matchType && matchQuery;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Market Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isLoading ? 'Loading…' : `${active.length} registered vendor${active.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={refetch}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, stall, or product…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder:text-slate-300"
        />
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {ALL_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              typeFilter === t
                ? 'bg-teal-700 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-teal-300'
            }`}
          >
            {t === 'all' ? 'All' : `${PRODUCT_EMOJIS[t] ?? ''} ${t}`}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-rose-600">
          Failed to load vendors. <button onClick={refetch} className="font-semibold underline">Retry</button>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
              <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
              <div className="h-3 w-16 bg-slate-100 animate-pulse rounded" />
              <div className="h-3 w-20 bg-slate-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && !error && (
        <div className="text-center py-12">
          <Store size={36} className="text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-400">
            {query || typeFilter !== 'all' ? 'No vendors match your search' : 'No vendors registered yet'}
          </p>
          {(query || typeFilter !== 'all') && (
            <button
              onClick={() => { setQuery(''); setTypeFilter('all'); }}
              className="mt-2 text-xs text-teal-600 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((v) => (
            <VendorCard key={v.id} vendor={v} />
          ))}
        </div>
      )}
    </div>
  );
}
