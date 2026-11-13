import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { useDateFilter } from '../context/DateFilterContext';

const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last_7_days', label: 'Last 7 Days' },
  { id: 'last_30_days', label: 'Last 30 Days' },
  { id: 'this_month', label: 'This Month' },
  { id: 'previous_month', label: 'Previous Month' },
  { id: 'custom', label: 'Custom Date Range' },
];

export const DateRangePicker = () => {
  const { preset, setPreset, startDate, setStartDate, endDate, setEndDate } = useDateFilter();
  const [open, setOpen] = useState(false);

  const currentLabel = PRESETS.find((p) => p.id === preset)?.label || 'Date Range';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      >
        <Calendar className="h-3.5 w-3.5 text-slate-500" />
        <span>{currentLabel}</span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-30 w-72 p-3 bg-white border border-slate-200 rounded-xl shadow-xl space-y-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
              Select Time Window
            </div>

            <div className="grid grid-cols-2 gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPreset(p.id);
                    if (p.id !== 'custom') setOpen(false);
                  }}
                  className={`px-2.5 py-1.5 text-xs rounded-md text-left transition-colors ${
                    preset === p.id
                      ? 'bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {preset === 'custom' && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full py-1 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700"
                >
                  Apply Custom Range
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

