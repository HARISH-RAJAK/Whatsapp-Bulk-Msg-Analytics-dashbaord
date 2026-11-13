import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, IndianRupee, Clock, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { useDateFilter } from '../context/DateFilterContext';

export const AnalyticsPage = () => {
  const { preset, startDate, endDate, getFilterParams } = useDateFilter();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const params = getFilterParams();
        const [sum, tr] = await Promise.all([
          api.getSummary(params),
          api.getTrends(params),
        ]);
        setSummary(sum.data);
        setTrends(tr.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [preset, startDate, endDate]);

  const kpis = summary?.kpis || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Advanced Analytics</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Delivery funnel stages, cost analytics, and hourly traffic distribution
        </p>
      </div>

      {/* Funnel Milestone Cards */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">End-to-End Delivery Funnel</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">1. Submitted</span>
            <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.submitted?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-slate-400 mt-1">100% of pipeline</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center">
            <span className="text-[11px] font-semibold text-blue-700 uppercase">2. Sent to Carrier</span>
            <p className="text-2xl font-bold text-blue-800 mt-1">{kpis.sent?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-blue-600 font-medium mt-1">
              {kpis.submitted > 0 ? ((kpis.sent / kpis.submitted) * 100).toFixed(1) : 0}% Dispatch
            </p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase">3. Delivered</span>
            <p className="text-2xl font-bold text-emerald-800 mt-1">{kpis.delivered?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">
              {kpis.delivery_rate || 0}% Delivery Rate
            </p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
            <span className="text-[11px] font-semibold text-indigo-700 uppercase">4. Read</span>
            <p className="text-2xl font-bold text-indigo-800 mt-1">{kpis.read?.toLocaleString() || 0}</p>
            <p className="text-[10px] text-indigo-600 font-semibold mt-1">
              {kpis.read_rate || 0}% Open Rate
            </p>
          </div>
        </div>
      </div>

      {/* Hourly Density */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">24-Hour Sending Heatmap Distribution</h3>
          <p className="text-[11px] text-slate-500">Peak delivery hours in Asia/Kolkata timezone</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends?.hourly_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="total" fill="#0284c7" radius={[4, 4, 0, 0]} name="Total Traffic" />
              <Bar dataKey="delivered" fill="#10b981" radius={[4, 4, 0, 0]} name="Delivered" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Estimated Spend</span>
          <p className="text-3xl font-bold text-slate-900 mt-2">
            ₹{kpis.total_cost?.toFixed(2) || '0.00'}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Calculated from webhook price per delivered message
          </span>
        </div>
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Effective Cost Per Read</span>
          <p className="text-3xl font-bold text-indigo-600 mt-2">
            ₹{kpis.read > 0 ? (kpis.total_cost / kpis.read).toFixed(3) : '0.00'}
          </p>
          <span className="text-xs text-slate-400 mt-1 block">
            Cost per verified customer read milestone
          </span>
        </div>
      </div>
    </div>
  );
};

