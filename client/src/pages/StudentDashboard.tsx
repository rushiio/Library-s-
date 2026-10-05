import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Sparkles,
  Flame,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  ArrowRight,
  Star,
  ChevronRight,
  TrendingUp,
  Compass,
  FileCheck2,
  Calendar,
  Layers,
  RotateCcw,
  Bot,
  Receipt,
  MapPin,
  HelpCircle,
  Send,
  Check,
  Zap,
  Info,
  Building2,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CoverGenerator } from '../components/books/CoverGenerator';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [studentStats, setStudentStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [quickAiPrompt, setQuickAiPrompt] = useState('');
  const [quickAiResponse, setQuickAiResponse] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const [dashRes, statsRes] = await Promise.all([
        api.get('/student/dashboard'),
        api.get('/student/stats'),
      ]);

      if (dashRes.data.success) {
        setDashboardData(dashRes.data);
      }
      if (statsRes.data.success) {
        setStudentStats(statsRes.data.stats);
      }
    } catch (err: any) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  const handleRenewBook = async (issueRecordId: string) => {
    try {
      setRenewingId(issueRecordId);
      setActionFeedback(null);
      const res = await api.post('/circulation/renew', { issueRecordId });
      if (res.data.success) {
        setActionFeedback({ msg: res.data.message || 'Loan renewed successfully by +14 days!', type: 'success' });
        await fetchDashboard();
      }
    } catch (err: any) {
      setActionFeedback({
        msg: err.response?.data?.error || 'Failed to renew book. Maximum renewal limit reached or waitlist active.',
        type: 'error',
      });
    } finally {
      setRenewingId(null);
    }
  };

  const handleQuickAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAiPrompt.trim() || loadingAi) return;

    try {
      setLoadingAi(true);
      setQuickAiResponse(null);
      const res = await api.post('/ai/chatbot', {
        messages: [{ role: 'user', content: quickAiPrompt.trim() }],
      });
      if (res.data.success) {
        setQuickAiResponse(res.data.reply);
      }
    } catch (err: any) {
      setQuickAiResponse('The AI assistant is momentarily busy. Please try asking again.');
    } finally {
      setLoadingAi(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl w-1/3"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
      </div>
    );
  }

  const student = dashboardData?.student || user;
  const summary = dashboardData?.summary || {
    borrowedCount: 0,
    reservedCount: 0,
    unpaidFinesTotal: 0,
    readingStreak: 0,
    totalPoints: 0,
    level: 1,
  };
  const alerts = dashboardData?.alerts || [];
  const currentlyBorrowed = dashboardData?.currentlyBorrowed || [];
  const shelfBooks = dashboardData?.shelfBooks || [];
  const recommendedBooks = dashboardData?.recommendedBooks || [];
  const trendingBranchBooks = dashboardData?.trendingBranchBooks || [];
  const upcoming = dashboardData?.upcoming || { seatBookings: [], reservations: [], announcements: [] };
  const recentActivity = dashboardData?.recentActivity || [];
  const achievements = dashboardData?.achievements || { readingStreak: 0, totalPoints: 0, level: 1, badges: [] };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-slate-900 dark:text-slate-100">
      
      {/* ACTION FEEDBACK TOAST */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <span>{actionFeedback.msg}</span>
          </div>
          <button onClick={() => setActionFeedback(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">✕</button>
        </div>
      )}

      {/* 1. GREETING WITH CENTRAL SEARCH BAR */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
            <span>Hello, {student?.name || 'Student'}</span>
            <span className="text-2xl animate-bounce">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Department of <strong className="text-slate-800 dark:text-slate-200">{student?.department || 'Computer Engineering'}</strong> • Year {student?.year || 3} • Member ID: <span className="font-mono text-blue-600 dark:text-blue-400 font-bold">{student?.memberId}</span>
          </p>
        </div>

        {/* Global Catalog Search Form */}
        <form onSubmit={handleSearch} className="w-full md:max-w-md relative">
          <div className="relative flex items-center rounded-2xl bg-white dark:bg-[#11192e] border border-slate-200 dark:border-slate-800 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden">
            <Search className="h-4 w-4 text-slate-400 ml-3.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 8,000+ textbooks, authors, or ISBN..."
              className="w-full py-2.5 pl-2.5 pr-20 text-xs bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all"
            >
              Search
            </button>
          </div>
        </form>
      </section>

      {/* 2. ALERT STRIP (Due soon, Overdue, Unpaid fines, Ready reservation) */}
      {alerts.length > 0 && (
        <section className="space-y-3">
          {alerts.map((alert: any) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in ${
                alert.severity === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                  : alert.severity === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {alert.severity === 'danger' && <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />}
                  {alert.severity === 'warning' && <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                  {alert.severity === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{alert.title}</h4>
                  <p className="opacity-90 mt-0.5">{alert.message}</p>
                </div>
              </div>

              {alert.actionLabel && (
                <div className="shrink-0">
                  {alert.actionType === 'RENEW' && (
                    <button
                      onClick={() => handleRenewBook(alert.targetId)}
                      disabled={renewingId === alert.targetId}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      {renewingId === alert.targetId ? 'Renewing...' : alert.actionLabel}
                    </button>
                  )}
                  {alert.actionType === 'NAVIGATE' && (
                    <Link
                      to={`/book/${alert.bookId}`}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold shadow-sm inline-block"
                    >
                      {alert.actionLabel}
                    </Link>
                  )}
                  {alert.actionType === 'NAVIGATE_TAB' && (
                    <Link
                      to="/my-shelf?tab=fines"
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-sm inline-block"
                    >
                      {alert.actionLabel}
                    </Link>
                  )}
                  {alert.actionType === 'NAVIGATE_BOOK' && (
                    <Link
                      to={`/book/${alert.bookId}`}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-sm inline-block"
                    >
                      {alert.actionLabel}
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* 3. SUMMARY CARDS (Borrowed, Reserved, Fines Due, Reading Streak) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Borrowed */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Currently Borrowed</span>
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {summary.borrowedCount} <span className="text-sm font-semibold text-slate-400">/ 3 Books</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {summary.borrowedCount > 0 ? 'Active on student account' : 'No active borrowings'}
            </div>
          </div>
        </div>

        {/* Reserved */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reserved / Waitlist</span>
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Bookmark className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {summary.reservedCount} <span className="text-sm font-semibold text-slate-400">Titles</span>
            </div>
            <div className="text-[11px] text-purple-600 dark:text-purple-400 mt-1">
              {summary.reservedCount > 0 ? 'Queue position tracked' : 'No active waitlist'}
            </div>
          </div>
        </div>

        {/* Fines Due */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fines Due</span>
            <div className={`p-2.5 rounded-2xl ${summary.unpaidFinesTotal > 0 ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600' : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600'}`}>
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-black ${summary.unpaidFinesTotal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              ₹{summary.unpaidFinesTotal.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {summary.unpaidFinesTotal > 0 ? 'Overdue charges pending' : 'Zero outstanding dues'}
            </div>
          </div>
        </div>

        {/* Reading Streak */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reading Streak</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Flame className="h-5 w-5 fill-current text-amber-500 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-500">
              {summary.readingStreak} <span className="text-sm font-semibold text-slate-400">Days</span>
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-1">
              Level {summary.level} Scholar • {summary.totalPoints} XP
            </div>
          </div>
        </div>
      </section>

      {/* 4. CURRENTLY BORROWED LIST (With Due Dates, Renew Button, & Overdue State) */}
      <section className="bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <span>Currently Borrowed Books</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active physical copies checked out on your student library card
            </p>
          </div>
          <Link to="/my-shelf" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
            View All in My Shelf →
          </Link>
        </div>

        {currentlyBorrowed.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {currentlyBorrowed.map((loan: any) => {
              const dueDate = new Date(loan.dueDate);
              const isOverdue = loan.isOverdue;
              const daysRemaining = loan.daysRemaining;

              return (
                <div key={loan.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-16 rounded-xl overflow-hidden shrink-0 shadow-xs">
                      <CoverGenerator title={loan.title} author={loan.author} department={loan.department} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 mb-0.5">
                        {loan.department} • <span className="font-mono">{loan.barcode}</span>
                      </div>
                      <Link to={`/book/${loan.bookId}`} className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 line-clamp-1">
                        {loan.title}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{loan.author}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Shelf: <strong className="text-slate-700 dark:text-slate-300">{loan.shelfLocation}</strong> • Renewals: {loan.renewCount}/3
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <div
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          isOverdue
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                            : daysRemaining <= 3
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        }`}
                      >
                        {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                        <span>
                          {isOverdue
                            ? `Overdue by ${Math.abs(daysRemaining)}d`
                            : `Due in ${daysRemaining} day(s)`}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Due: {dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRenewBook(loan.id)}
                      disabled={renewingId === loan.id || !loan.canRenew}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
                    >
                      <RotateCcw className={`h-3.5 w-3.5 ${renewingId === loan.id ? 'animate-spin' : ''}`} />
                      <span>{renewingId === loan.id ? 'Renewing...' : 'Renew (+14d)'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-[#11192e] border border-slate-100 dark:border-slate-800 text-center space-y-2">
            <BookOpen className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Books Currently Borrowed</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven’t checked out any books yet. Browse the catalog to discover textbooks for your branch.
            </p>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold mt-2"
            >
              Browse Catalog <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </section>

      {/* 5. CONTINUE READING / MY SHELF */}
      <section className="bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-purple-600" />
              <span>Continue Reading / My Shelf</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your recent course reading list and completed volumes
            </p>
          </div>
          <Link to="/my-shelf" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
            Open Full Bookshelf →
          </Link>
        </div>

        {shelfBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {shelfBooks.slice(0, 6).map((book: any) => (
              <div
                key={book.id}
                onClick={() => navigate(`/book/${book.id}`)}
                className="group cursor-pointer p-3 rounded-2xl bg-slate-50 dark:bg-[#11192e] border border-slate-100 dark:border-slate-800 hover:border-purple-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-full h-36 rounded-xl overflow-hidden mb-2 shadow-xs group-hover:scale-102 transition-transform">
                    <CoverGenerator title={book.title} author={book.author} department={book.department} />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{book.title}</h4>
                  <p className="text-[10px] text-slate-400 truncate">{book.author}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  {book.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#11192e] text-center text-xs text-slate-400">
            Your reading history will appear here once you check out or review textbooks.
          </div>
        )}
      </section>

      {/* 6. RECOMMENDED FOR YOU (With One-Line Reason Each) */}
      <section className="bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>Recommended for You</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized textbook recommendations matched to {student?.department || 'your branch'} curriculum
            </p>
          </div>
          <Link to="/catalog" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
            View All →
          </Link>
        </div>

        {recommendedBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedBooks.map((book: any) => (
              <div
                key={book.id}
                onClick={() => navigate(`/book/${book.id}`)}
                className="group cursor-pointer p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] border border-slate-100 dark:border-slate-800 hover:border-amber-400/80 transition-all flex gap-3.5 shadow-2xs"
              >
                <div className="w-16 h-22 rounded-xl overflow-hidden shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <CoverGenerator title={book.title} author={book.author} department={book.department} />
                </div>
                <div className="min-w-0 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                      {book.department?.replace(' Engineering', '')}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-600 transition-colors">
                      {book.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{book.author}</p>
                  </div>
                  <div className="mt-2 text-[10px] italic text-slate-500 dark:text-slate-400 bg-amber-50/50 dark:bg-amber-950/30 p-1.5 rounded-lg border border-amber-200/40 dark:border-amber-900/40 line-clamp-1">
                    💡 {book.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#11192e] text-center text-xs text-slate-400">
            No recommendations generated yet.
          </div>
        )}
      </section>

      {/* 7. TRENDING IN MY BRANCH */}
      <section className="bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span>Trending in {student?.department || 'My Branch'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              High circulation titles most borrowed by fellow branch classmates
            </p>
          </div>
          <Link to={`/catalog?department=${encodeURIComponent(student?.department || 'Computer Engineering')}`} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
            Branch Catalog →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {trendingBranchBooks.map((book: any) => (
            <div
              key={book.id}
              onClick={() => navigate(`/book/${book.id}`)}
              className="group cursor-pointer p-3 rounded-2xl bg-slate-50 dark:bg-[#11192e] border border-slate-100 dark:border-slate-800 hover:border-emerald-400 transition-all flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="w-full h-36 rounded-xl overflow-hidden mb-2 shadow-xs group-hover:scale-102 transition-transform">
                  <CoverGenerator title={book.title} author={book.author} department={book.department} />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{book.title}</h4>
                <p className="text-[10px] text-slate-400 truncate">{book.author}</p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {book.availableCopies > 0 ? `Available (${book.availableCopies})` : 'Waitlist'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 8. AI ASSISTANT QUICK-ASK CARD */}
      <section className="bg-gradient-to-br from-indigo-900 via-[#0d162d] to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Academic Research Assistant</h3>
              <p className="text-xs text-blue-200">Instant answers, formula derivations, and book chapter references</p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
            Live Online
          </span>
        </div>

        {/* Quick Ask Form */}
        <form onSubmit={handleQuickAiAsk} className="relative flex items-center">
          <input
            type="text"
            value={quickAiPrompt}
            onChange={(e) => setQuickAiPrompt(e.target.value)}
            placeholder="Ask anything (e.g. 'Explain binary search tree complexity and cite library textbooks')..."
            className="w-full py-3.5 pl-4 pr-24 rounded-2xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="submit"
            disabled={!quickAiPrompt.trim() || loadingAi}
            className="absolute right-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1.5"
          >
            {loadingAi ? <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            <span>Ask</span>
          </button>
        </form>

        {quickAiResponse && (
          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-xs sm:text-sm leading-relaxed text-blue-50 animate-in fade-in whitespace-pre-line">
            {quickAiResponse}
          </div>
        )}
      </section>

      {/* 9. LEARNING PATH PROGRESS */}
      <section className="bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Curriculum Learning Paths</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Custom Skill Roadmaps Aligned with College Catalog
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Generate milestone-based study paths for Software Development, Embedded Systems, Machine Learning, Structural Analysis, and GATE preparation using books from our shelves.
          </p>
        </div>

        <Link
          to="/learning-path"
          className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition-all active:scale-95 shrink-0 flex items-center gap-2"
        >
          <span>Explore Learning Paths</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* 10. UPCOMING (Seat Bookings, Reservations, Announcements) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Seat Bookings */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="h-4 w-4 text-purple-600" />
              <span>Upcoming Seat Bookings</span>
            </h3>
            <Link to="/seats" className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline">
              Book Seat
            </Link>
          </div>

          {upcoming.seatBookings.length > 0 ? (
            <div className="space-y-2">
              {upcoming.seatBookings.map((s: any) => (
                <div key={s.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-[#11192e] text-xs space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">{s.seatCode} • {s.roomType}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] text-center text-xs text-slate-400">
              No active study desk bookings.
            </div>
          )}
        </div>

        {/* Reservations Queue */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-blue-600" />
              <span>Active Waitlists</span>
            </h3>
            <span className="text-xs font-bold text-blue-600">{upcoming.reservations.length} Active</span>
          </div>

          {upcoming.reservations.length > 0 ? (
            <div className="space-y-2">
              {upcoming.reservations.map((r: any) => (
                <div key={r.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-[#11192e] text-xs space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{r.title}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Queue Position: <strong className="text-blue-600">#{r.queuePosition}</strong></span>
                    <span>Hold until: {new Date(r.expiryDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] text-center text-xs text-slate-400">
              No pending book reservations.
            </div>
          )}
        </div>

        {/* Campus Announcements */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info className="h-4 w-4 text-emerald-600" />
            <span>Library Announcements</span>
          </h3>

          <div className="space-y-2">
            {upcoming.announcements.map((ann: any) => (
              <div key={ann.id} className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 text-xs space-y-0.5">
                <div className="font-bold text-emerald-900 dark:text-emerald-200">{ann.title}</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400">{ann.date}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. RECENT ACTIVITY & 12. COMPACT ACHIEVEMENTS */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Activity (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Account Activity</h3>
          
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentActivity.map((act: any) => (
                <div key={act.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold">
                      ✓
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {act.action?.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] text-slate-400">{new Date(act.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">Verified Log</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#11192e] text-center text-xs text-slate-400">
              No recent activity recorded yet.
            </div>
          )}
        </div>

        {/* Compact Achievements (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span>Scholar Achievements</span>
              </h3>
              <span className="text-xs font-bold text-amber-600">Level {achievements.level}</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 text-center mb-4">
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {achievements.totalPoints} XP
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {achievements.readingStreak} Day Daily Reading Streak 🔥
              </p>
            </div>

            {/* Badges List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unlocked Badges:</span>
              <div className="flex flex-wrap gap-2">
                {achievements.badges.map((badge: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                  >
                    🏆 {badge}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Link
            to="/my-shelf?tab=badges"
            className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors block"
          >
            View All Achievements
          </Link>
        </div>

      </section>

      {/* MY STATS MODAL / SECTION WHEN ?tab=stats */}
      {activeTab === 'stats' && studentStats && (
        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1324] border-2 border-blue-500/40 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>My Reading & Borrowing Statistics</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% real circulation data for {student?.name}
              </p>
            </div>
            <button
              onClick={() => navigate('/student')}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] text-center">
              <div className="text-2xl font-black text-blue-600">{studentStats.totalBooksBorrowed}</div>
              <div className="text-xs text-slate-400 mt-1">Total Books Read</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] text-center">
              <div className="text-2xl font-black text-emerald-600">{studentStats.onTimeRate}</div>
              <div className="text-xs text-slate-400 mt-1">On-Time Return Rate</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] text-center">
              <div className="text-2xl font-black text-amber-500">{studentStats.readingStreak} Days</div>
              <div className="text-xs text-slate-400 mt-1">Current Streak</div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] text-center">
              <div className="text-2xl font-black text-purple-600">₹{studentStats.totalFinesPaid}</div>
              <div className="text-xs text-slate-400 mt-1">Fines Paid</div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
};

export default StudentDashboard;
