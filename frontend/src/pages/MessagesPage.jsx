import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Filter, Download, Eye, ArrowUpDown, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useDateFilter } from '../context/DateFilterContext';
import { StatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { MessageDetailModal } from '../components/MessageDetailModal';

export const MessagesPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get('search') || '';

  const { preset, startDate, endDate } = useDateFilter();
  const [messages, setMessages] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, total_pages: 1 });
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('DESC');
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchMessages = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.listMessages({
        page,
        limit: 25,
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort_by: sortBy,
        sort_dir: sortDir,
        preset,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setMessages(res.data?.items || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, limit: 25, total_pages: 1 });
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages(1);
  }, [preset, startDate, endDate, statusFilter, sortBy, sortDir]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMessages(1);
  };

  const handleRowClick = async (msg) => {
    try {
      const details = await api.getMessageDetails(msg.id);
      setSelectedMessage(details.data || msg);
    } catch {
      setSelectedMessage(msg);
    }
  };

  const handleExport = () => {
    window.location.href = api.getExportUrl('messages', {
      search,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      preset,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Message Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit history, status transitions, and raw webhook traces
          </p>
        </div>

        <button
          onClick={handleExport}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search phone, UUID, request ID, or campaign..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Statuses</option>
              <option value="Read">Read</option>
              <option value="Delivered">Delivered</option>
              <option value="Sent">Sent</option>
              <option value="Submitted">Submitted</option>
              <option value="Failed">Failed</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="created_at">Recent Activity</option>
              <option value="delivered_at">Delivery Time</option>
              <option value="read_at">Read Time</option>
              <option value="customer_number">Customer Phone</option>
              <option value="price">Cost</option>
            </select>
            <button
              onClick={() => setSortDir(sortDir === 'ASC' ? 'DESC' : 'ASC')}
              className="p-1 text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50"
              title="Toggle sort direction"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">UUID / Message Key</th>
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4">Delivered (IST)</th>
                <th className="py-3 px-4">Read (IST)</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading messages...
                  </td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No messages found matching search or filter criteria.
                  </td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => handleRowClick(m)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {m.customer_number}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={m.current_status} />
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-[180px] truncate" title={m.uuid || m.message_key}>
                      {m.uuid || m.message_key}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-[140px] truncate" title={m.campaign_name || '-'}>
                      {m.campaign_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-[120px] truncate" title={m.template_name || '-'}>
                      {m.template_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {m.delivered_at || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {m.read_at || '-'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      ₹{m.price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(m);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        title="View Full Webhook Trace"
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
          onPageChange={fetchMessages}
        />
      </div>

      {/* Message Detail Inspector Drawer/Modal */}
      {selectedMessage && (
        <MessageDetailModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  );
};

