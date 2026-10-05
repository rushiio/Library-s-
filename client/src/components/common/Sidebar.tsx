import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Bookmark,
  BarChart3,
  Sparkles,
  MessageSquareCode,
  Compass,
  Map,
  Award,
  Users,
  Clock,
  QrCode,
  ShieldCheck,
  Upload,
  Settings,
  Sun,
  Moon,
  LogOut,
  BookOpen,
  GraduationCap,
  ChevronRight,
  X,
  FileCheck2,
  TrendingUp,
  HelpCircle,
  Info,
  LogIn,
  Home,
  Bot,
  Receipt,
  Bell,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavGroup {
  heading?: string;
  items: {
    name: string;
    path: string;
    icon: any;
    badge?: string;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role;

  // Navigation items grouped by section
  const getNavGroups = (): NavGroup[] => {
    if (!isAuthenticated) {
      // GUEST MENU
      return [
        {
          items: [
            { name: 'Home', path: '/', icon: Home },
            { name: 'Browse Catalog', path: '/catalog', icon: Layers },
            { name: 'New Arrivals', path: '/catalog?sort=newest', icon: Sparkles, badge: 'New' },
            { name: 'Popular Books', path: '/catalog?sort=popular', icon: TrendingUp },
            { name: 'Categories', path: '/catalog?tab=categories', icon: BookOpen },
            { name: 'Library Info', path: '/#library-info', icon: Info },
            { name: 'Help / FAQ', path: '/#faq', icon: HelpCircle },
          ],
        },
      ];
    }

    if (role === 'STUDENT') {
      // STUDENT MENU - GROUPED WITH HEADINGS
      return [
        {
          heading: 'Main',
          items: [
            { name: 'Dashboard', path: '/student', icon: LayoutDashboard },
            { name: 'Books Catalog', path: '/catalog', icon: Layers },
            { name: 'My Shelf', path: '/my-shelf', icon: Bookmark },
          ],
        },
        {
          heading: 'Learn with AI',
          items: [
            { name: 'Ask-the-Book', path: '/catalog?tab=ask-ai', icon: MessageSquareCode },
            { name: 'Learning Paths', path: '/learning-path', icon: Sparkles },
            { name: 'Syllabus Matcher', path: '/syllabus-matcher', icon: FileCheck2 },
            { name: 'AI Assistant', path: '/student?tab=ai', icon: Bot },
          ],
        },
        {
          heading: 'Campus',
          items: [
            { name: 'Seat Booking', path: '/seats', icon: Compass },
            { name: 'Library Map', path: '/seats?tab=map', icon: Map },
          ],
        },
        {
          heading: 'My Activity',
          items: [
            { name: 'My Stats', path: '/student?tab=stats', icon: BarChart3 },
            { name: 'Achievements', path: '/my-shelf?tab=badges', icon: Award },
            { name: 'Fines and Payments', path: '/my-shelf?tab=fines', icon: Receipt },
            { name: 'Notifications', path: '/student?tab=notifications', icon: Bell },
          ],
        },
      ];
    }

    if (role === 'LIBRARIAN') {
      return [
        {
          items: [
            { name: 'Dashboard', path: '/librarian', icon: LayoutDashboard },
            { name: 'Circulation Counter', path: '/librarian?tab=circulation', icon: Clock },
            { name: 'Books Catalog', path: '/catalog', icon: Layers },
            { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3, badge: 'New' },
            { name: 'Member Directory', path: '/admin/members', icon: Users },
            { name: 'Overdue Reminders', path: '/librarian?tab=overdues', icon: Clock, badge: 'Alerts' },
            { name: 'AI Insights', path: '/analytics?tab=ai', icon: Sparkles },
            { name: 'Barcode Scanner', path: '/scan', icon: QrCode },
            { name: 'Seat Booking', path: '/seats', icon: Compass },
          ],
        },
      ];
    }

    if (role === 'ADMIN') {
      return [
        {
          items: [
            { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
            { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3, badge: 'Full' },
            { name: 'Catalog & Importer', path: '/admin/import', icon: Upload },
            { name: 'Books Catalog', path: '/catalog', icon: Layers },
            { name: 'Member Management', path: '/admin/members', icon: Users },
            { name: 'AI System Controls', path: '/admin?tab=ai', icon: Sparkles },
            { name: 'Audit Logs (SHA-256)', path: '/admin?tab=audit', icon: ShieldCheck },
            { name: 'Seat Booking', path: '/seats', icon: Compass },
          ],
        },
      ];
    }

    // FACULTY
    return [
      {
        items: [
          { name: 'Dashboard', path: '/faculty', icon: LayoutDashboard },
          { name: 'Books Catalog', path: '/catalog', icon: Layers },
          { name: 'Course Reading Lists', path: '/faculty', icon: Bookmark },
          { name: 'Analytics', path: '/analytics', icon: BarChart3 },
          { name: 'Syllabus Matcher', path: '/syllabus-matcher', icon: FileCheck2 },
          { name: 'Ask-the-Book', path: '/catalog', icon: MessageSquareCode },
          { name: 'Seat Booking', path: '/seats', icon: Compass },
          { name: 'Barcode Scanner', path: '/scan', icon: QrCode },
        ],
      },
    ];
  };

  const navGroups = getNavGroups();
  const isActive = (path: string) => {
    if (path.startsWith('/#')) {
      return location.pathname === '/' && location.hash === path.replace('/', '');
    }
    if (path.includes('?')) {
      return location.pathname + location.search === path;
    }
    return location.pathname === path;
  };

  const getPortalLabel = () => {
    if (!isAuthenticated || !user) return 'Library Portal';
    if (user.role === 'STUDENT') {
      const deptShort = (user.department || 'Computer Engineering').replace(' Engineering', '');
      return `${deptShort} • Year ${user.year || 3}`;
    }
    return `${user.role} Portal`;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container: Fixed Dark Navy Theme */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#0a101f] text-slate-300 border-r border-[#162038] flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header & Branding */}
        <div>
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#162038]">
            <Link to="/" className="flex items-center gap-3 group min-w-0" onClick={onCloseMobile}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-tight text-white">Libra<span className="text-blue-400">AI</span></span>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                  {getPortalLabel()}
                </div>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links with Group Headings */}
          <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-270px)] custom-scrollbar">
            {navGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-1">
                {group.heading && (
                  <div className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                    {group.heading}
                  </div>
                )}

                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  const handleClick = (e: React.MouseEvent) => {
                    onCloseMobile?.();
                    if (item.path.startsWith('/#')) {
                      const targetId = item.path.replace('/#', '');
                      const el = document.getElementById(targetId);
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      } else if (location.pathname !== '/') {
                        navigate('/' + item.path.replace('/', ''));
                      }
                    }
                  };

                  return (
                    <Link
                      key={item.name + item.path}
                      to={item.path}
                      onClick={handleClick}
                      className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        active
                          ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/30'
                          : 'text-slate-400 hover:text-white hover:bg-[#121c33]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                        <span>{item.name}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                            active
                              ? 'bg-white/20 text-white'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom Sidebar: User Profile & Controls */}
        <div className="p-3 border-t border-[#162038] space-y-2 bg-[#080d1a]">
          {/* Light / Dark Mode Toggle Switch */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#11192e] text-slate-300 hover:text-white hover:bg-[#16223e] border border-[#1b2746] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              {isDark ? (
                <Moon className="h-4 w-4 text-blue-400" />
              ) : (
                <Sun className="h-4 w-4 text-amber-400" />
              )}
              <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isDark ? 'bg-blue-600' : 'bg-slate-600'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          {/* User Account / Profile Box */}
          {isAuthenticated && user ? (
            <div className="p-2.5 rounded-2xl bg-[#11192e] border border-[#1b2746] space-y-2">
              <div
                onClick={() => {
                  switch (user.role) {
                    case 'ADMIN': navigate('/admin'); break;
                    case 'LIBRARIAN': navigate('/librarian'); break;
                    case 'FACULTY': navigate('/faculty'); break;
                    default: navigate('/student');
                  }
                  onCloseMobile?.();
                }}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <img
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`}
                  alt={user.name}
                  className="h-9 w-9 rounded-xl object-cover ring-1 ring-blue-500/40 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {user.department ? `${user.department.replace(' Engineering', '')} • Year ${user.year || 3}` : user.memberId}
                  </div>
                </div>
              </div>

              {/* Profile Links & Logout */}
              <div className="flex items-center justify-between pt-1.5 border-t border-[#1a2645] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/my-shelf');
                    onCloseMobile?.();
                  }}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  <span>Settings</span>
                </button>

                <button
                  type="button"
                  onClick={logout}
                  title="Sign out"
                  className="text-[11px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[#111c38] to-[#0d162d] border border-blue-900/40 text-center space-y-2.5 shadow-md">
              <p className="text-[11px] font-medium text-slate-300 leading-snug">
                Login to borrow, reserve, and get AI recommendations
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onCloseMobile?.();
                    openAuthModal('login', 'Sign in to access your student bookshelf, renewals, and loans.');
                  }}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => {
                    onCloseMobile?.();
                    openAuthModal('signup', 'Create your student account to borrow books and access AI features.');
                  }}
                  className="flex-1 py-2 rounded-xl border border-blue-500/40 hover:border-blue-400 text-blue-300 hover:text-white bg-blue-950/40 hover:bg-blue-900/50 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
