import React, { useEffect, useState } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Eye,
  AlertOctagon,
  Clock,
  TrendingUp,
  Percent,
  FileCheck2,
  Calendar,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { useDateFilter } from '../context/DateFilterContext';
import { api } from '../services/api';
import { KpiCard } from '../components/KpiCard';

const STATUS_COLORS = {
  Read: '#6366f1',
  Delivered: '#10b981',
  Sent: '#0284c7',
  Submitted: '#f59e0b',
  Pending: '#eab308',
  Failed: '#ef4444',
  Unknown: '#94a3b8',
};

export const DashboardPage = () => {
  const { preset, startDate, endDate, getFilterParams } = useDateFilter();
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = getFilterParams();
      const [sumRes, trendRes] = await Promise.all([
        api.getSummary(params),
        api.getTrends(params),
      ]);
      setSummary(sumRes.data);
      setTrends(trendRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [preset, startDate, endDate]);

  const kpis = summary?.kpis || {};
  const statusBreakdown = summary?.status_breakdown || {};

  const statusPieData = Object.entries(statusBreakdown).map(([name, value]) => ({
    name,
    value: Number(value),
  }));

  const deliveredVsFailedData = [
    { name: 'Delivered', value: kpis.delivered || 0, color: '#10b981' },
    { name: 'Failed', value: kpis.failed || 0, color: '#ef4444' },
    { name: 'Pending / In-Transit', value: Math.max(0, (kpis.total_messages || 0) - (kpis.delivered || 0) - (kpis.failed || 0)), color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const readVsUnreadData = [
    { name: 'Read', value: kpis.read || 0, color: '#6366f1' },
    { name: 'Delivered (Unread)', value: Math.max(0, (kpis.delivered || 0) - (kpis.read || 0)), color: '#38bdf8' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Timezone Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Analytics Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time delivery intelligence from MSG91 WhatsApp Webhooks • Display Timezone: <strong className="text-slate-700">Asia/Kolkata (IST)</strong>
          </p>
        </div>

        <button
          onClick={() => {
            setRefreshing(true);
            fetchData();
          }}
          disabled={refreshing}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Primary KPI Metric Cards (9 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <KpiCard
          title="Total Messages"
          value={kpis.total_messages ?? 0}
          subtitle="Unique recipients"
          icon={MessageSquare}
          color="slate"
        />
        <KpiCard
          title="Submitted"
          value={kpis.submitted ?? 0}
          subtitle="Confirmed submission"
          icon={FileCheck2}
          color="amber"
        />
        <KpiCard
          title="Sent"
          value={kpis.sent ?? 0}
          subtitle="Dispatched to carrier"
          icon={Send}
          color="blue"
        />
        <KpiCard
          title="Delivered"
          value={kpis.delivered ?? 0}
          subtitle="Handset confirmed"
          icon={CheckCircle2}
          color="emerald"
        />
        <KpiCard
          title="Read"
          value={kpis.read ?? 0}
          subtitle="Opened by customer"
          icon={Eye}
          color="indigo"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Failed"
          value={kpis.failed ?? 0}
          subtitle="Carrier rejected/bounced"
          icon={AlertOctagon}
          color="rose"
          rate={kpis.failure_rate}
        />
        <KpiCard
          title="Pending"
          value={kpis.pending ?? 0}
          subtitle="Awaiting final status"
          icon={Clock}
          color="amber"
        />
        <KpiCard
          title="Delivery Rate"
          value={`${kpis.delivery_rate ?? 0}%`}
          subtitle="Delivered / Submitted"
          icon={TrendingUp}
          color="emerald"
        />
        <KpiCard
          title="Read Rate"
          value={`${kpis.read_rate ?? 0}%`}
          subtitle="Read / Delivered"
          icon={Percent}
          color="indigo"
        />
      </div>

      {/* Main Charts: Daily Sending Trends */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Daily Message Sending Trends</h3>
            <p className="text-[11px] text-slate-500">Unique messages breakdown by day (Asia/Kolkata)</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends?.daily_trends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="colorRead" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="total" stroke="#94a3b8" fillOpacity={0.1} fill="#94a3b8" name="Total Unique" />
              <Area type="monotone" dataKey="delivered" stroke="#10b981" fillOpacity={1} fill="url(#colorDelivered)" name="Delivered" />
              <Area type="monotone" dataKey="read" stroke="#6366f1" fillOpacity={1} fill="url(#colorRead)" name="Read" />
              <Area type="monotone" dataKey="failed" stroke="#ef4444" fillOpacity={0.2} fill="#ef4444" name="Failed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row of 2 Charts: Delivered vs Failed & Read vs Unread */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivered vs Failed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Delivery Fulfillment Ratio</h3>
            <p className="text-[11px] text-slate-500">Delivered vs Failed vs In-Flight messages</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deliveredVsFailedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {deliveredVsFailedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Read vs Unread */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Audience Engagement</h3>
            <p className="text-[11px] text-slate-500">Opened messages vs delivered unopened</p>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={readVsUnreadData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {readVsUnreadData.map((entry, index) => (
                    <Cell key={`cell-read-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hourly Message Distribution (00:00 to 23:00 in Asia/Kolkata) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Hourly Traffic Distribution (24 Hours)</h3>
          <p className="text-[11px] text-slate-500">Message delivery density by hour of day (Asia/Kolkata)</p>
        </div>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends?.hourly_distribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
              <Bar dataKey="delivered" fill="#10b981" radius={[4, 4, 0, 0]} name="Delivered" />
              <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Template Performance Table Snapshot */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Template Performance</h3>
            <p className="text-[11px] text-slate-500">Delivery & open rate benchmarking across WhatsApp templates</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">Template Name</th>
                <th className="py-2.5 px-3">Total Sent</th>
                <th className="py-2.5 px-3">Delivered</th>
                <th className="py-2.5 px-3">Read</th>
                <th className="py-2.5 px-3">Delivery Rate</th>
                <th className="py-2.5 px-3">Read Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(trends?.template_performance || []).map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{t.template_name}</td>
                  <td className="py-2.5 px-3 text-slate-600">{t.total_messages?.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-emerald-600 font-medium">{t.delivered?.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-indigo-600 font-medium">{t.read?.toLocaleString()}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {t.delivery_rate}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {t.read_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

