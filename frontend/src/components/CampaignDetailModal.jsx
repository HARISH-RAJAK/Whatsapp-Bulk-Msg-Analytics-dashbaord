import React from 'react';
import { X, Megaphone, CheckCircle2, Eye, AlertOctagon, TrendingUp, IndianRupee } from 'lucide-react';

export const CampaignDetailModal = ({ campaign, onClose }) => {
  if (!campaign) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{campaign.campaign_name}</h3>
              <p className="text-xs text-slate-500 font-mono">ID: {campaign.campaign_request_id || campaign.campaign_identifier}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Messages</span>
              <p className="text-xl font-bold text-slate-900 mt-1">{campaign.total_messages?.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase">Delivered</span>
              <p className="text-xl font-bold text-emerald-800 mt-1">{campaign.delivered?.toLocaleString()}</p>
              <span className="text-[10px] text-emerald-600 font-semibold">{campaign.delivery_rate}% Rate</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-[11px] font-semibold text-indigo-700 uppercase">Read</span>
              <p className="text-xl font-bold text-indigo-800 mt-1">{campaign.read?.toLocaleString()}</p>
              <span className="text-[10px] text-indigo-600 font-semibold">{campaign.read_rate}% Rate</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
              <span className="text-[11px] font-semibold text-rose-700 uppercase">Failed</span>
              <p className="text-xl font-bold text-rose-800 mt-1">{campaign.failed?.toLocaleString()}</p>
              <span className="text-[10px] text-rose-600 font-semibold">{campaign.failure_rate}% Rate</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Campaign Overview</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Template Name:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{campaign.template_name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500">Estimated Cost:</span>
                <p className="font-semibold text-slate-800 mt-0.5">₹{campaign.total_cost?.toFixed(2) || '0.00'}</p>
              </div>
              <div>
                <span className="text-slate-500">Campaign Launched:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{campaign.campaign_date || '-'}</p>
              </div>
              <div>
                <span className="text-slate-500">Last Webhook Activity:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{campaign.last_activity || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

