import React, { useEffect, useState } from 'react';
import { FileCode, Search, TrendingUp, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { useDateFilter } from '../context/DateFilterContext';

export const TemplatesPage = () => {
  const { preset, startDate, endDate } = useDateFilter();
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const res = await api.listTemplates({
          preset,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        });
        setTemplates(res.data?.templates || []);
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [preset, startDate, endDate]);

  const filtered = templates.filter((t) =>
    t.template_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Template Performance</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Delivery rates and customer read rates across registered WhatsApp message templates
        </p>
      </div>

      {/* Chart: Template Delivery vs Read Rate */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Template Conversion Benchmarks</h3>
          <p className="text-[11px] text-slate-500">Comparing Delivery Rate (%) and Read Rate (%)</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filtered} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="template_name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="delivery_rate" fill="#10b981" radius={[4, 4, 0, 0]} name="Delivery Rate (%)" />
              <Bar dataKey="read_rate" fill="#6366f1" radius={[4, 4, 0, 0]} name="Read Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search template name..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Template Name</th>
                <th className="py-3 px-4 text-right">Total Dispatched</th>
                <th className="py-3 px-4 text-right">Delivered</th>
                <th className="py-3 px-4 text-right">Read</th>
                <th className="py-3 px-4 text-right">Failed</th>
                <th className="py-3 px-4 text-center">Delivery Rate</th>
                <th className="py-3 px-4 text-center">Read Rate</th>
                <th className="py-3 px-4 text-right">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">Loading templates...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">No templates found.</td>
                </tr>
              ) : (
                filtered.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{t.template_name}</td>
                    <td className="py-3 px-4 text-right text-slate-700 font-medium">{t.total_messages?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">{t.delivered?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-indigo-600 font-medium">{t.read?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-rose-600 font-medium">{t.failed?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {t.delivery_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {t.read_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-800 font-semibold">
                      ₹{t.total_cost?.toFixed(2) || '0.00'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

