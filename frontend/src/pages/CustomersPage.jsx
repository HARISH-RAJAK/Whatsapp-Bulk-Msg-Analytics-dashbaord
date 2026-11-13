import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, MessageSquare, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { Pagination } from '../components/Pagination';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.listCustomers({ page, limit: 25, search });
      setCustomers(res.data?.items || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, limit: 25, total_pages: 1 });
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCustomers(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Customer Directory</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Aggregate recipient metrics and per-customer communication histories
        </p>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer phone number..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-500"
          />
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Customer Phone</th>
                <th className="py-3 px-4 text-right">Messages Sent</th>
                <th className="py-3 px-4 text-right">Delivered</th>
                <th className="py-3 px-4 text-right">Read</th>
                <th className="py-3 px-4 text-right">Failed</th>
                <th className="py-3 px-4 text-center">Delivery Rate</th>
                <th className="py-3 px-4 text-center">Read Rate</th>
                <th className="py-3 px-4">Last Active (IST)</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">No customer records found.</td>
                </tr>
              ) : (
                customers.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{c.customer_number}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">{c.total_messages?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">{c.delivered_count?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-indigo-600 font-semibold">{c.read_count?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right text-rose-600 font-semibold">{c.failed_count?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {c.delivery_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {c.read_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{c.last_activity || '-'}</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">₹{c.total_spent?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => navigate(`/messages?search=${c.customer_number}`)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        <span>History</span>
                        <ArrowRight className="h-3 w-3" />
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
          onPageChange={fetchCustomers}
        />
      </div>
    </div>
  );
};

