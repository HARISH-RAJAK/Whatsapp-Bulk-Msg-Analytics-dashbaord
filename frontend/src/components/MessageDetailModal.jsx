import React, { useState } from 'react';
import { X, Clock, CheckCircle2, AlertCircle, Copy, Check, FileJson, ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const MessageDetailModal = ({ message, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  if (!message) return null;

  const handleCopyUuid = () => {
    if (message.uuid) {
      navigator.clipboard.writeText(message.uuid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900">Message Audit Inspector</h3>
            <StatusBadge status={message.current_status} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Identifiers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase">Customer Number</span>
              <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">{message.customer_number}</p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase">UUID (wamid)</span>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs font-mono text-slate-800 truncate" title={message.uuid || 'N/A'}>
                  {message.uuid || 'Missing / Not reported'}
                </p>
                {message.uuid && (
                  <button onClick={handleCopyUuid} className="text-slate-400 hover:text-slate-600">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase">Campaign</span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">
                {message.campaign_name || 'No campaign specified'}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 uppercase">Template</span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">
                {message.template_name || 'Generic / Freeform'}
              </p>
            </div>
          </div>

          {/* Message Content */}
          {message.content && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Message Body</h4>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans">
                {message.content}
              </div>
            </div>
          )}

          {/* Failure reason callout if applicable */}
          {message.failure_reason && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-900">Delivery Failure Reason</p>
                <p className="text-xs text-rose-700 mt-0.5">{message.failure_reason}</p>
                {message.status_code && (
                  <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-mono bg-rose-100 text-rose-800 rounded">
                    Status Code: {message.status_code}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Lifecycle Milestones */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Milestone Progression</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Requested</span>
                <p className="text-xs font-medium text-slate-800 mt-0.5">{message.requested_at || '-'}</p>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Sent</span>
                <p className="text-xs font-medium text-slate-800 mt-0.5">{message.sent_at || '-'}</p>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Delivered</span>
                <p className="text-xs font-medium text-slate-800 mt-0.5">{message.delivered_at || '-'}</p>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Read</span>
                <p className="text-xs font-medium text-slate-800 mt-0.5">{message.read_at || '-'}</p>
              </div>
            </div>
          </div>

          {/* Webhook Events Audit Timeline */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Webhook Event History ({message.events?.length || 0} events)
            </h4>

            {message.events && message.events.length > 0 ? (
              <div className="relative border-l-2 border-emerald-500/30 ml-3 space-y-4 py-1">
                {message.events.map((ev, idx) => (
                  <div key={ev.id || idx} className="relative pl-6">
                    <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-emerald-500/30"></span>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          {ev.event_name}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          {ev.event_timestamp}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Normalized: <strong className="text-slate-700">{ev.normalized_status}</strong></span>
                        {ev.status_code && <span>• Code: {ev.status_code}</span>}
                      </div>
                      {ev.reason && (
                        <p className="text-xs text-rose-600 bg-rose-50/50 p-1.5 rounded border border-rose-100">
                          {ev.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                No intermediate webhook event history available.
              </div>
            )}
          </div>

          {/* Raw Payload Accordion */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <FileJson className="h-4 w-4 text-slate-400" />
              <span>{showRaw ? 'Hide Raw Webhook Payload' : 'View Raw Webhook Payload (Administrator)'}</span>
            </button>

            {showRaw && (
              <pre className="mt-3 p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
                {JSON.stringify(message.raw_payload || message, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            ClickNCult Analytics Engine • Deduplicated SHA-256
          </span>
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

