import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Layers,
  Bookmark,
  QrCode,
  Compass,
  LayoutDashboard,
  Upload,
  Users,
  Sun,
  Moon,
  Globe,
  LogOut,
  Sparkles,
  Eye,
  Type,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme, isHighContrast, toggleHighContrast, isDyslexicFont, toggleDyslexicFont } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ADMIN':
        return '/admin';
      case 'LIBRARIAN':
        return '/librarian';
      case 'FACULTY':
        return '/faculty';
      default:
        return '/student';
    }
  };

  const getRoleBadgeColor = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'LIBRARIAN':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'FACULTY':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Libra<span className="text-brand-600 dark:text-brand-400">AI</span></span>
              <span className="rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/50 dark:border-brand-800/50">NextGen</span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/catalog"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/catalog')
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Layers className="h-4 w-4" />
            {t('nav.catalog')}
          </Link>

          {isAuthenticated && (
            <Link
              to="/my-shelf"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/my-shelf')
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              {t('nav.myShelf')}
            </Link>
          )}

          <Link
            to="/learning-path"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/learning-path')
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            {t('nav.learningPath')}
          </Link>

          <Link
            to="/seats"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/seats')
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Compass className="h-4 w-4" />
            {t('nav.seatBooking')}
          </Link>

          {/* Admin Import tab */}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/import"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/admin/import')
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Upload className="h-4 w-4 text-purple-500" />
              {t('nav.adminImport')}
            </Link>
          )}
        </nav>

        {/* Right Tools (Language, Accessibility, Theme, User Profile) */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Change Language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="uppercase">{language}</span>
            </button>
            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-xl bg-white p-1.5 shadow-xl ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => { setLanguage('en'); setLangDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg font-medium ${language === 'en' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  English
                </button>
                <button
                  onClick={() => { setLanguage('hi'); setLangDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg font-medium ${language === 'hi' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  हिन्दी (Hindi)
                </button>
                <button
                  onClick={() => { setLanguage('mr'); setLangDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs rounded-lg font-medium ${language === 'mr' ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                  मराठी (Marathi)
                </button>
              </div>
            )}
          </div>

          {/* Accessibility Settings */}
          <div className="relative">
            <button
              onClick={() => setAccessibilityOpen(!accessibilityOpen)}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Accessibility Options"
            >
              <Eye className="h-4 w-4" />
            </button>
            {accessibilityOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white p-2 shadow-xl ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10 z-50">
                <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Accessibility</p>
                <button
                  onClick={toggleDyslexicFont}
                  className="flex w-full items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <span className="flex items-center gap-2"><Type className="h-3.5 w-3.5" /> Dyslexia Font</span>
                  <span className={`h-2 w-2 rounded-full ${isDyslexicFont ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </button>
                <button
                  onClick={toggleHighContrast}
                  className="flex w-full items-center justify-between px-2.5 py-1.5 text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <span className="flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> High Contrast</span>
                  <span className={`h-2 w-2 rounded-full ${isHighContrast ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                </button>
              </div>
            )}
          </div>

          {/* Dark / Light Mode */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* User Account / Auth Actions */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
              <Link
                to={getDashboardPath()}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <img
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0284c7&color=fff`}
                  alt={user.name}
                  className="h-8 w-8 rounded-lg object-cover ring-2 ring-brand-500/30"
                />
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold leading-tight text-slate-900 dark:text-white line-clamp-1">{user.name}</div>
                  <div className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider border ${getRoleBadgeColor()}`}>
                    {t(`roles.${user.role}`)}
                  </div>
                </div>
              </Link>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 transition-all active:scale-95"
            >
              {t('nav.login')}
            </Link>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/catalog"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Layers className="h-4 w-4" /> {t('nav.catalog')}
          </Link>
          {isAuthenticated && (
            <Link
              to="/my-shelf"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bookmark className="h-4 w-4" /> {t('nav.myShelf')}
            </Link>
          )}
          <Link
            to="/learning-path"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Sparkles className="h-4 w-4 text-amber-500" /> {t('nav.learningPath')}
          </Link>
          <Link
            to="/seats"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Compass className="h-4 w-4" /> {t('nav.seatBooking')}
          </Link>
          {isAuthenticated && (
            <Link
              to={getDashboardPath()}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-bold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950"
            >
              <LayoutDashboard className="h-4 w-4" /> {t('nav.dashboard')} ({user?.role})
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
