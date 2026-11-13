import React from 'react';

export const KpiCard = ({ title, value, subtitle, icon: Icon, color = 'emerald', rate = null }) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'border-slate-200 hover:border-emerald-300',
      rate: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    },
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'border-slate-200 hover:border-blue-300',
      rate: 'text-blue-700 bg-blue-50 border-blue-200',
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600',
      border: 'border-slate-200 hover:border-indigo-300',
      rate: 'text-indigo-700 bg-indigo-50 border-indigo-200',
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'border-slate-200 hover:border-amber-300',
      rate: 'text-amber-700 bg-amber-50 border-amber-200',
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'border-slate-200 hover:border-rose-300',
      rate: 'text-rose-700 bg-rose-50 border-rose-200',
    },
    slate: {
      bg: 'bg-slate-100 text-slate-600',
      border: 'border-slate-200 hover:border-slate-300',
      rate: 'text-slate-700 bg-slate-50 border-slate-200',
    },
  };

  const scheme = colorMap[color] || colorMap.slate;

  return (
    <div className={`p-4 bg-white rounded-xl border ${scheme.border} shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg ${scheme.bg}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>

        {rate !== null && (
          <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${scheme.rate}`}>
            {rate}%
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-[11px] text-slate-400 font-medium truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};

