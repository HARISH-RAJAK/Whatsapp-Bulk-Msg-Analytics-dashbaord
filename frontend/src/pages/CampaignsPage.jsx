import React, { useEffect, useState } from 'react';
import { Megaphone, Search, Download, Eye, ArrowUpDown, Filter } from 'lucide-react';
import { api } from '../services/api';
import { useDateFilter } from '../context/DateFilterContext';
import { Pagination } from '../components/Pagination';
import { CampaignDetailModal } from '../components/CampaignDetailModal';

export const CampaignsPage = () => {
  const { preset, startDate, endDate } = useDateFilter();
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, total_pages: 1 });
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('total_messages');
  const [sortDir, setSortDir] = useState('DESC');
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const fetchCampaigns = async (page = 1) => {
    try {
      setLoading(true);
      const res = await api.listCampaigns({
        page,
        limit: 25,
        search,
        sort_by: sortBy,
        sort_dir: sortDir,
        preset,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setCampaigns(res.data?.items || []);
      setPagination(res.data?.pagination || { total: 0, page: 1, limit: 25, total_pages: 1 });
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns(1);
  }, [preset, startDate, endDate, sortBy, sortDir]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCampaigns(1);
  };

  const handleExport = () => {
    window.location.href = api.getExportUrl('campaigns', {
      search,
      preset,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Campaign Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Performance analytics by MSG91 campaign identifier and request ID
          </p>
        </div>

        <button
          onClick={handleExport}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>Export Campaigns</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaign name or request ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-500">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="total_messages">Total Volume</option>
            <option value="delivered">Delivered Count</option>
            <option value="delivery_rate">Delivery Rate</option>
            <option value="campaign_name">Campaign Name</option>
            <option value="created_at">Campaign Date</option>
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

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Campaign Request ID</th>
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Delivered</th>
                <th className="py-3 px-4 text-right">Read</th>
                <th className="py-3 px-4 text-right">Failed</th>
                <th className="py-3 px-4 text-center">Delivery Rate</th>
                <th className="py-3 px-4 text-center">Read Rate</th>
                <th className="py-3 px-4">Date (IST)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Loading campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    No campaigns found matching current filters.
                  </td>
                </tr>
              ) : (
                campaigns.map((camp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {camp.campaign_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {camp.campaign_request_id}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {camp.template_name}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {camp.total_messages?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-semibold">
                      {camp.delivered?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-indigo-600 font-semibold">
                      {camp.read?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-rose-600 font-semibold">
                      {camp.failed?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {camp.delivery_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {camp.read_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {camp.campaign_date}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedCampaign(camp)}
                        className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                        title="View Campaign Details"
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
          onPageChange={fetchCampaigns}
        />
      </div>

      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
        />
      )}
    </div>
  );
};

