import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Award,
  Flame,
  Star,
  Bookmark,
  ChevronRight,
  TrendingUp,
  ShieldAlert,
  History,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IssueRecord, Reservation, Fine } from '../types';

export const MyShelf: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'loans' | 'reservations' | 'history' | 'badges'>('loans');
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pastIssues, setPastIssues] = useState<IssueRecord[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchShelfData = async () => {
    try {
      setLoading(true);
      const [issuesRes, resRes, finesRes] = await Promise.all([
        api.get('/circulation/active-issues'),
        api.get('/circulation/reservations'),
        api.get('/fines'),
      ]);

      if (issuesRes.data.success) {
        const allUserIssues: IssueRecord[] = issuesRes.data.issues || [];
        setIssues(allUserIssues.filter((i) => i.status === 'ACTIVE'));
        setPastIssues(allUserIssues.filter((i) => i.status === 'RETURNED'));
      }

      if (resRes.data.success) {
        setReservations(resRes.data.reservations || []);
      }

      if (finesRes.data.success) {
        setFines(finesRes.data.fines || []);
      }
    } catch (err: any) {
      console.error('Failed to load shelf data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShelfData();
  }, []);

  const handleRenew = async (issueId: string) => {
    try {
      setRenewingId(issueId);
      setActionMessage(null);
      const res = await api.post('/circulation/renew', { issueRecordId: issueId });
      if (res.data.success) {
        setActionMessage({ type: 'success', text: res.data.message });
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.7 },
        });
        await fetchShelfData();
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to renew book loan.',
      });
    } finally {
      setRenewingId(null);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      setCancellingId(reservationId);
      setActionMessage(null);
      const res = await api.post(`/circulation/reservations/${reservationId}/cancel`);
      if (res.data.success) {
        setActionMessage({ type: 'success', text: res.data.message });
        await fetchShelfData();
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to cancel reservation.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const unpaidFines = fines.filter((f) => f.status === 'UNPAID');
  const unpaidTotal = unpaidFines.reduce((sum, f) => sum + f.amount, 0);

  const getDaysLeft = (dueDateStr: string) => {
    const due = new Date(dueDateStr);
    const now = new Date();
    const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diff;
  };

  const allBadges = [
    { name: 'Bookworm', icon: '📚', desc: 'Read more than 5 books in a semester', unlocked: true },
    { name: 'Speed Reader', icon: '⚡', desc: 'Returned 3 books before 50% loan duration', unlocked: true },
    { name: 'Top Reviewer', icon: '⭐', desc: 'Wrote helpful reviews on 3 textbooks', unlocked: true },
    { name: 'Night Owl', icon: '🦉', desc: 'Checked out books during late hours study', unlocked: (user?.readingStreak || 0) > 10 },
    { name: 'Master Scholar', icon: '🎓', desc: 'Maintained a 30-day continuous reading streak', unlocked: (user?.readingStreak || 0) >= 30 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Streak Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-gradient-to-r from-brand-700 via-brand-600 to-sky-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-brand-500/10 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider mb-3">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>My Academic Library Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{user?.name}'s Bookshelf</h1>
              <p className="text-sm text-brand-100 mt-1 max-w-md">
                Manage your active loans, track reservation waitlists, and view your academic reading journey.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 self-start sm:self-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-slate-900 shadow-md">
                <Flame className="h-7 w-7 text-amber-900 animate-pulse" />
              </div>
              <div>
                <div className="text-2xl font-black leading-none">{user?.readingStreak || 12} Days</div>
                <div className="text-xs font-medium text-brand-100 mt-1">Reading Streak 🔥</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Points & Fines Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Reward Balance</span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3.5 w-3.5" /> Active Learner
            </span>
          </div>
          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>{user?.totalPoints || 240}</span>
              <span className="text-sm font-bold text-amber-500">Points 🌟</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Earn +15 points for every book returned on time and +15 for writing reviews.
            </p>
          </div>

          {unpaidTotal > 0 ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
              <div className="flex items-center gap-2 text-xs font-bold">
                <ShieldAlert className="h-4 w-4 text-rose-500" />
                <span>Pending Overdue Fine:</span>
              </div>
              <span className="text-sm font-black">₹{unpaidTotal}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>No outstanding fines. Account in good standing!</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 text-rose-800 dark:text-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{actionMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 sm:gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('loans')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'loans'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Active Loans</span>
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'loans' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {issues.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reservations')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'reservations'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          <span>Reservations & Waitlist</span>
          <span
            className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'reservations' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {reservations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Borrowing History</span>
        </button>

        <button
          onClick={() => setActiveTab('badges')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'badges'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Badges & Level</span>
        </button>
      </div>

      {/* Tab 1: Active Loans */}
      {activeTab === 'loans' && (
        <div>
          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">Loading active book loans...</div>
          ) : issues.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
              <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Active Loans</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                You currently don't have any books checked out from the library.
              </p>
              <Link
                to="/catalog"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold shadow-md hover:bg-brand-500 transition-colors"
              >
                Browse Catalog <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {issues.map((issue) => {
                const daysLeft = getDaysLeft(issue.dueDate);
                const isOverdue = daysLeft < 0;
                const isCritical = daysLeft <= 2 && daysLeft >= 0;
                const book = issue.copy?.book;

                return (
                  <div
                    key={issue.id}
                    className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border shadow-sm transition-all hover:shadow-md ${
                      isOverdue
                        ? 'border-rose-300 dark:border-rose-900 ring-2 ring-rose-500/20'
                        : isCritical
                        ? 'border-amber-300 dark:border-amber-800'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-28 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                        {book?.coverUrl ? (
                          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="h-8 w-8 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md border border-brand-200/50 dark:border-brand-800/50">
                              {book?.department || 'Textbook'}
                            </span>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 mt-1">
                              {book?.title || 'Unknown Title'}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                              by {book?.author || 'Unknown Author'}
                            </p>
                          </div>
                        </div>

                        {/* Barcode & Accession Details */}
                        <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                            {issue.copy?.barcode || 'N/A'}
                          </span>
                          <span>Shelf: {issue.copy?.shelfNumber || issue.copy?.location || 'General'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Due Date & Renewal Status Card */}
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div className="text-xs">
                          <span className="text-slate-400">Due: </span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {new Date(issue.dueDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <span
                          className={`ml-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : isCritical
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {isOverdue ? `${Math.abs(daysLeft)}d Overdue (₹5/day)` : `${daysLeft} days remaining`}
                        </span>
                      </div>

                      {/* One Click Renew Button */}
                      <button
                        onClick={() => handleRenew(issue.id)}
                        disabled={renewingId === issue.id || issue.renewCount >= 3}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          issue.renewCount >= 3
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900 border border-brand-200 dark:border-brand-800 active:scale-95'
                        }`}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${renewingId === issue.id ? 'animate-spin' : ''}`} />
                        <span>{issue.renewCount >= 3 ? 'Max Renewals (3/3)' : `Renew (+14d, ${issue.renewCount}/3)`}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Reservations & Waitlist */}
      {activeTab === 'reservations' && (
        <div>
          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">Loading reservations...</div>
          ) : reservations.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center shadow-sm">
              <Bookmark className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">No Active Reservations</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                When popular books are currently checked out, you can place a reservation to reserve the next copy.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reservations.map((res) => (
                <div
                  key={res.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-black text-lg border border-brand-200 dark:border-brand-800">
                      #{res.queuePosition}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white">
                        {res.book?.title || 'Unknown Title'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        by {res.book?.author} • Reserved on {new Date(res.reservedDate).toLocaleDateString()}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                          Priority Score: {res.priorityScore}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Status: <strong className="text-emerald-600 uppercase">{res.status}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {res.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancelReservation(res.id)}
                      disabled={cancellingId === res.id}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                    >
                      {cancellingId === res.id ? 'Cancelling...' : 'Cancel Reservation'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Borrowing History */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-brand-500" /> Past Returned Books
          </h3>

          {pastIssues.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No past borrowing history recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-semibold">Book Title</th>
                    <th className="pb-3 font-semibold">Barcode</th>
                    <th className="pb-3 font-semibold">Issued Date</th>
                    <th className="pb-3 font-semibold">Returned Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pastIssues.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 font-medium text-slate-900 dark:text-white">
                        {item.copy?.book?.title || 'Unknown Title'}
                      </td>
                      <td className="py-3 font-mono text-xs text-slate-500">{item.copy?.barcode}</td>
                      <td className="py-3 text-xs text-slate-500">
                        {new Date(item.issuedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-xs text-slate-500">
                        {item.returnedDate ? new Date(item.returnedDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" /> Returned
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Gamified Badges */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allBadges.map((badge, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-6 border transition-all ${
                badge.unlocked
                  ? 'bg-gradient-to-b from-white to-amber-50/40 dark:from-slate-900 dark:to-slate-900 border-amber-200 dark:border-amber-900/60 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="text-4xl mb-3">{badge.icon}</div>
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{badge.name}</h4>
                {badge.unlocked ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                    Unlocked
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    Locked
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{badge.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyShelf;
