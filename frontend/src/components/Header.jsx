import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDateFilter } from '../context/DateFilterContext';
import { DateRangePicker } from './DateRangePicker';

export const Header = ({ setMobileOpen }) => {
  const { user, logout } = useAuth();
  const { globalSearch, setGlobalSearch } = useDateFilter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/messages?search=${encodeURIComponent(globalSearch.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Mobile toggle & mobile brand */}
      <div className="flex items-center gap-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/dashboard" className="font-bold text-slate-900 text-base">
          ClickNCult
        </Link>
      </div>

      {/* Global Search */}
      <div className="hidden sm:flex flex-1 max-w-md">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Search phone number, UUID, campaign, or request ID..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:border-emerald-500 transition-all"
          />
        </form>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Date Filter */}
        <DateRangePicker />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg relative focus:outline-none"
            title="System Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </button>

          {notificationsOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setNotificationsOpen(false)} />
              <div className="absolute right-0 mt-2 z-30 w-80 p-3 bg-white border border-slate-200 rounded-xl shadow-xl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-800">Webhook Activity</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">Listening</span>
                </div>
                <div className="py-2 space-y-2 text-xs text-slate-600">
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <p className="font-medium text-slate-800">MSG91 Webhook Active</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Outbound WhatsApp reports successfully streaming.</p>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <p className="font-medium text-slate-800">Deduplication Engine</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">SHA-256 event hashing protecting against duplicate counts.</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 focus:outline-none"
          >
            <div className="h-7 w-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-semibold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || 'Administrator'}
              </div>
              <div className="text-[10px] text-slate-400 capitalize">
                {user?.role || 'Admin'}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setProfileOpen(false)} />
              <div className="absolute right-0 mt-2 z-30 w-52 p-1.5 bg-white border border-slate-200 rounded-xl shadow-xl space-y-1">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-medium text-slate-800 truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>

                <Link
                  to="/settings"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <User className="h-3.5 w-3.5 text-slate-500" />
                  <span>Profile Settings</span>
                </Link>

                <div className="border-t border-slate-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg text-left"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

