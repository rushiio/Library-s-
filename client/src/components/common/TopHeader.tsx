import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopHeaderProps {
  onOpenMobileSidebar: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onOpenMobileSidebar }) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  const getDashboardRoute = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'LIBRARIAN': return '/librarian';
      case 'FACULTY': return '/faculty';
      default: return '/student';
    }
  };

  const notifications = [
    {
      id: 'n1',
      title: 'Overdue Reminder: Theory of Machines',
      desc: 'Your checkout is due in 3 days. Please return or renew at counter.',
      time: '2 hours ago',
      type: 'urgent',
    },
    {
      id: 'n2',
      title: 'Waitlist Fulfilled',
      desc: 'A copy of "Data Structures with C" is now available on Shelf Rack C-04.',
      time: '1 day ago',
      type: 'success',
    },
    {
      id: 'n3',
      title: 'New Arrivals in Engineering',
      desc: '25 new reference volumes added to Computer & Mechanical departments.',
      time: '3 days ago',
      type: 'info',
    },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 dark:bg-[#0c1324]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between transition-colors">
      
      {/* Left: Mobile Sidebar Trigger & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 8,000+ catalog titles, authors, ISBN..."
              className="w-full pl-10 pr-12 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
            />
            <div className="absolute right-2.5 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-400">
              <span>⌘K</span>
            </div>
          </div>
        </form>
      </div>

      {/* Right Controls: Notifications & Auth / User Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        
        {/* Notifications Bell (for logged in users) */}
        {isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#11192e] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#11192e] p-4 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-50 space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Activity Notifications</h4>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-md">3 New</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          {n.type === 'urgent' && <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                          {n.type === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                          {n.type === 'info' && <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                          <span className="line-clamp-1">{n.title}</span>
                        </span>
                        <span className="text-[9px] text-slate-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Profile Avatar / Login & Sign Up Buttons */}
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <img
                src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`}
                alt={user.name}
                className="h-8 w-8 rounded-lg object-cover ring-2 ring-blue-500/30"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 leading-tight">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-medium capitalize">{user.role.toLowerCase()}</div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:inline" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#11192e] p-2 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
                  <div className="mt-1">
                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      {user.role}
                    </span>
                  </div>
                </div>

                <Link
                  to={getDashboardRoute()}
                  onClick={() => setUserDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-blue-500" /> Role Dashboard
                </Link>

                <Link
                  to="/my-shelf"
                  onClick={() => setUserDropdownOpen(false)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <UserIcon className="h-3.5 w-3.5 text-purple-500" /> My Bookshelf
                </Link>

                <button
                  onClick={() => { setUserDropdownOpen(false); logout(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAuthModal('signup')}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-xs font-bold transition-all shadow-sm"
            >
              Sign Up
            </button>
            <button
              onClick={() => openAuthModal('login')}
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all active:scale-95"
            >
              Login
            </button>
          </div>
        )}

      </div>
    </header>
  );
};
