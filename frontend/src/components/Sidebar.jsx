import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  FileCode,
  CheckCheck,
  AlertOctagon,
  Users,
  BarChart3,
  DownloadCloud,
  Settings,
  Activity,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { path: '/messages', label: 'Messages', icon: MessageSquare },
  { path: '/templates', label: 'Templates', icon: FileCode },
  { path: '/delivery-reports', label: 'Delivery Reports', icon: CheckCheck },
  { path: '/failed-messages', label: 'Failed Messages', icon: AlertOctagon },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/export', label: 'Export Reports', icon: DownloadCloud },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header: Prominently displayed ClickNCult in top-left, clicking goes to dashboard */}
        <div className="h-16 px-6 flex items-center border-b border-slate-800/80 bg-slate-950/40">
          <Link
            to="/dashboard"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 group-hover:scale-105 transition-transform">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                ClickNCult
              </span>
              <p className="text-[10px] font-medium tracking-wide uppercase text-slate-400">
                WhatsApp Analytics
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600/15 text-emerald-400 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Integration Status Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Provider Gateway</span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              MSG91 Webhook
            </span>
          </div>
          <div className="text-[11px] text-slate-400 truncate">
            Timezone: Asia/Kolkata (IST)
          </div>
        </div>
      </aside>
    </>
  );
};

