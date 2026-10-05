import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Search, QrCode, Bookmark, User as UserIcon, Sparkles, BookOpen, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const BottomNav: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path.includes('?')) return location.pathname + location.search === path;
    return location.pathname === path;
  };

  const getProfilePath = () => {
    if (!isAuthenticated || !user) return '/login';
    switch (user.role) {
      case 'ADMIN': return '/admin';
      case 'LIBRARIAN': return '/librarian';
      case 'FACULTY': return '/faculty';
      default: return '/student';
    }
  };

  if (!isAuthenticated) {
    // GUEST MOBILE BOTTOM NAVIGATION
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a101f]/95 backdrop-blur-lg border-t border-[#162038] px-2 py-2 shadow-2xl">
        <div className="flex items-center justify-around">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-colors ${
              isActive('/') ? 'text-blue-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>

          <Link
            to="/catalog"
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-colors ${
              isActive('/catalog') ? 'text-blue-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="h-4 w-4" />
            <span>Catalog</span>
          </Link>

          <Link
            to="/catalog?sort=newest"
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-colors ${
              isActive('/catalog?sort=newest') ? 'text-blue-400' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Arrivals</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('categories');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else window.location.href = '/#categories';
            }}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span>Categories</span>
          </button>

          <button
            type="button"
            onClick={() => openAuthModal('login', 'Sign in to borrow books and access study tools.')}
            className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-[10px] font-bold text-blue-400 hover:text-white transition-colors"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  // LOGGED-IN MOBILE BOTTOM NAVIGATION
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a101f]/95 backdrop-blur-lg border-t border-[#162038] px-2 py-1.5 shadow-2xl">
      <div className="flex items-center justify-around">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold transition-colors ${
            isActive('/') ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <Home className="h-4 w-4" />
          <span>Home</span>
        </Link>

        <Link
          to="/catalog"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold transition-colors ${
            isActive('/catalog') ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Catalog</span>
        </Link>

        {/* Center Scanner Action Button */}
        <Link
          to="/scan"
          className="flex flex-col items-center -mt-5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 ring-4 ring-[#0a101f] active:scale-95 transition-transform">
            <QrCode className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-bold text-slate-300 mt-0.5">Scan</span>
        </Link>

        <Link
          to="/my-shelf"
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold transition-colors ${
            isActive('/my-shelf') ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>My Shelf</span>
        </Link>

        <Link
          to={getProfilePath()}
          className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-[10px] font-bold transition-colors ${
            isActive(getProfilePath()) ? 'text-blue-400' : 'text-slate-400'
          }`}
        >
          <UserIcon className="h-4 w-4" />
          <span>Portal</span>
        </Link>
      </div>
    </div>
  );
};

export default BottomNav;
