import React from 'react';

export const StatusBadge = ({ status }) => {
  const norm = (status || 'Unknown').toLowerCase();

  const configs = {
    read: {
      label: 'Read',
      classes: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-500',
    },
    delivered: {
      label: 'Delivered',
      classes: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
    },
    sent: {
      label: 'Sent',
      classes: 'bg-sky-50 text-sky-700 border-sky-200',
      dot: 'bg-sky-500',
    },
    submitted: {
      label: 'Submitted',
      classes: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
    },
    pending: {
      label: 'Pending',
      classes: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      dot: 'bg-yellow-500',
    },
    failed: {
      label: 'Failed',
      classes: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
    },
    unknown: {
      label: 'Unknown',
      classes: 'bg-slate-100 text-slate-700 border-slate-300',
      dot: 'bg-slate-400',
    },
  };

  const current = configs[norm] || configs.unknown;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`}></span>
      <span>{status || current.label}</span>
    </span>
  );
};

