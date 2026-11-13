import React, { useState } from 'react';
import { DownloadCloud, FileSpreadsheet, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useDateFilter } from '../context/DateFilterContext';

export const ExportPage = () => {
  const { preset, startDate, endDate } = useDateFilter();
  const [downloading, setDownloading] = useState('');

  const handleDownload = (type, status = null) => {
    setDownloading(type);
    const params = {
      preset,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
    };
    if (status) params.status = status;

    const url = api.getExportUrl('messages', params);
    window.location.href = url;
    setTimeout(() => setDownloading(''), 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Export Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Generate and download CSV reports formatted in Asia/Kolkata timezone with full event metadata
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Full Message Export */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 w-fit">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Comprehensive Messages CSV</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete archive of all unique messages including UUID, customer number, campaign, timestamps, and delivery statuses.
            </p>
          </div>
          <button
            onClick={() => handleDownload('all')}
            disabled={downloading === 'all'}
            className="mt-5 w-full py-2 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center justify-center gap-2"
          >
            <DownloadCloud className="h-4 w-4" />
            <span>{downloading === 'all' ? 'Preparing CSV...' : 'Download Full CSV'}</span>
          </button>
        </div>

        {/* Delivered Export */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 w-fit">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Delivered Messages Report</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Filter exclusively for handsets that acknowledged receipt, including read timestamps and carrier acknowledgment times.
            </p>
          </div>
          <button
            onClick={() => handleDownload('delivered', 'Delivered')}
            disabled={downloading === 'delivered'}
            className="mt-5 w-full py-2 px-4 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-sm flex items-center justify-center gap-2"
          >
            <DownloadCloud className="h-4 w-4" />
            <span>{downloading === 'delivered' ? 'Preparing CSV...' : 'Download Delivered Log'}</span>
          </button>
        </div>

        {/* Failed Export */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 w-fit">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Failure & Bounce Audit</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export all undelivered, rejected, or invalid phone numbers with original error reasons and status codes for list hygiene.
            </p>
          </div>
          <button
            onClick={() => handleDownload('failed', 'Failed')}
            disabled={downloading === 'failed'}
            className="mt-5 w-full py-2 px-4 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-sm flex items-center justify-center gap-2"
          >
            <DownloadCloud className="h-4 w-4" />
            <span>{downloading === 'failed' ? 'Preparing CSV...' : 'Download Failure Audit'}</span>
          </button>
        </div>

        {/* Campaign Summary Export */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 w-fit">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Campaign Aggregations</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Export campaign-level metrics, delivery rates, read rates, and estimated costs grouped by campaign identifier.
            </p>
          </div>
          <button
            onClick={() => handleDownload('campaigns')}
            disabled={downloading === 'campaigns'}
            className="mt-5 w-full py-2 px-4 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg shadow-sm flex items-center justify-center gap-2"
          >
            <DownloadCloud className="h-4 w-4" />
            <span>{downloading === 'campaigns' ? 'Preparing CSV...' : 'Download Campaign Summary'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

