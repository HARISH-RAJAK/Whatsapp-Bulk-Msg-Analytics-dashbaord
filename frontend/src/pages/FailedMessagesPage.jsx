import React, { useEffect, useState } from 'react';
import { AlertOctagon, Download, Search, AlertCircle, Eye } from 'lucide-react';
import { api } from '../services/api';
import { useDateFilter } from '../context/DateFilterContext';
import { Pagination } from '../components/Pagination';
import { MessageDetailModal } from '../components/MessageDetailModal';

export const FailedMessagesPage = () => {
  const { preset, startDate, endDate } = useDateFilter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    const fetchFailedReports = async () => {
      try {
        setLoading(true);
        const res = await api.getFailedReports({
          preset,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
        });
        setData(res.data);
      } catch (err) {
        console.error('Failed to load failed messages report:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFailedReports();
  }, [preset, startDate, endDate]);

  const reasons = data?.failure_reasons || [];
  const messages = data?.messages?.items || [];
  const pagination = data?.messages?.pagination || { total: 0, page: 1, limit: 25, total_pages: 1 };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Failed Message Analysis</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Identify bounce reasons, carrier rejections, and opt-out blocks from webhook payloads
          </p>
        </div>

        <button
          onClick={() => {
            window.location.href = api.getExportUrl('messages', {
              status: 'Failed',
              preset,
              start_date: startDate || undefined,
              end_date: endDate || undefined,
            });
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg shadow-sm hover:bg-rose-100"
        >
          <Download className="h-3.5 w-3.5 text-rose-600" />
          <span>Export Failed List</span>
        </button>
      </div>

      {/* Top Failure Reasons Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Carrier Failure Reasons Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {reasons.map((r, idx) => (
            <div key={idx} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono font-semibold text-rose-600 uppercase">
                  Code: {r.status_code || 'N/A'}
                </span>
                <p className="text-xs font-semibold text-slate-800 mt-1 line-clamp-2" title={r.reason}>
                  {r.reason}
                </p>
              </div>
              <p className="text-lg font-bold text-rose-700 mt-2">
                {r.count?.toLocaleString()} <span className="text-xs font-normal text-rose-500">messages</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Failed Messages Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Failed Delivery Audit Trail
          </h3>
          <span className="text-xs text-rose-600 font-semibold">
            {pagination.total} Total Failures
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Failure Reason</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Attempted At (IST)</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Loading failure records...</td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">Zero failure records recorded! Great delivery health.</td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.customer_number}</td>
                    <td className="py-3 px-4 text-rose-700 font-medium max-w-xs truncate" title={m.failure_reason}>
                      {m.failure_reason || 'Unspecified Error'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{m.status_code || '-'}</td>
                    <td className="py-3 px-4 text-slate-700">{m.campaign_name || '-'}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{m.created_at || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedMessage(m)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600"
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

