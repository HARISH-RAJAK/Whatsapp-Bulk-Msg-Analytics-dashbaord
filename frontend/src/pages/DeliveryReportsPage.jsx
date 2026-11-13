import React, { useEffect, useState } from 'react';
import { CheckCheck, Download, Search, CheckCircle2, Eye } from 'lucide-react';
import { api } from '../services/api';
import { useDateFilter } from '../context/DateFilterContext';
import { Pagination } from '../components/Pagination';
import { MessageDetailModal } from '../components/MessageDetailModal';

export const DeliveryReportsPage = () => {
  const { preset, startDate, endDate } = useDateFilter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    const fetchDeliveryReports = async () => {
      try {
        setLoading(true);
        const res = await api.getDeliveryReports({
          preset,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        });
        setData(res.data);
      } catch (err) {
        console.error('Failed to load delivery reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeliveryReports();
  }, [preset, startDate, endDate]);

  const summary = data?.summary || {};
  const messages = data?.messages?.items || [];
  const pagination = data?.messages?.pagination || { total: 0, page: 1, limit: 25, total_pages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Delivery Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmed handset deliveries verified via MSG91 webhook events
          </p>
        </div>

        <button
          onClick={() => {
            window.location.href = api.getExportUrl('messages', {
              status: 'Delivered',
              preset,
              start_date: startDate || undefined,
              end_date: endDate || undefined,
            });
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>Export Delivery Log</span>
        </button>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Delivered</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {summary.delivered?.toLocaleString() || 0}
          </p>
          <span className="text-[11px] text-slate-400">Handset receipt acknowledged</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Overall Delivery Rate</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {summary.delivery_rate || 0}%
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">Delivered / Eligible Submitted</span>
        </div>
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Delivered & Read</span>
          <p className="text-2xl font-bold text-indigo-600 mt-1">
            {summary.read?.toLocaleString() || 0}
          </p>
          <span className="text-[11px] text-indigo-600 font-medium">{summary.read_rate || 0}% of delivered</span>
        </div>
      </div>

      {/* Delivered Feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Verified Delivered Log
          </h3>
          <span className="text-xs text-slate-500">
            Timestamps displayed in <strong className="text-slate-700">Asia/Kolkata (IST)</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">UUID</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4">Delivered Time (IST)</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading delivery reports...</td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">No delivered records in this time frame.</td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.customer_number}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 max-w-[200px] truncate" title={m.uuid}>{m.uuid || '-'}</td>
                    <td className="py-3 px-4 text-slate-700">{m.campaign_name || '-'}</td>
                    <td className="py-3 px-4 text-slate-700">{m.template_name || '-'}</td>
                    <td className="py-3 px-4 text-emerald-600 font-medium whitespace-nowrap">{m.delivered_at || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedMessage(m)}
                        className="p-1 rounded text-slate-400 hover:text-emerald-600"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          total={pagination.total}
          page={pagination.page}
          limit={pagination.limit}
          onPageChange={() => {}}
        />
      </div>

      {selectedMessage && (
        <MessageDetailModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  );
};

