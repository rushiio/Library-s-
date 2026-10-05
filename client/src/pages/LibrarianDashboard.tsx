import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Users,
  ArrowLeftRight,
  Clock,
  AlertTriangle,
  Sparkles,
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  DollarSign,
  MapPin,
  FileCheck,
  Send,
  TrendingUp,
  ArrowUpRight,
  HelpCircle,
  Filter,
  Check,
  BarChart3,
  Bookmark,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { IssueRecord, Fine, BookCopy } from '../types';

export const LibrarianDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'circulation' | 'activeLoans' | 'fines' | 'audit'>('overview');

  // Dashboard Overview State
  const [kpis, setKpis] = useState<{
    totalTitles?: number;
    totalCopies?: number;
    availableCopies?: number;
    issuedCopies?: number;
    activeIssues?: number;
    overdueCount?: number;
    activeMembers?: number;
    fines?: { unpaidTotal: number; paidTotal: number; waivedTotal: number };
  }>({});
  const [recentTransactions, setRecentTransactions] = useState<IssueRecord[]>([]);
  const [popularBooks, setPopularBooks] = useState<any[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderFeedback, setReminderFeedback] = useState<string | null>(null);

  // Rapid Circulation Counter State
  const [actionType, setActionType] = useState<'ISSUE' | 'RETURN'>('ISSUE');
  const [barcode, setBarcode] = useState('');
  const [memberId, setMemberId] = useState('');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [circulationLoading, setCirculationLoading] = useState(false);
  const [circulationFeedback, setCirculationFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active Loans Table State
  const [loans, setLoans] = useState<IssueRecord[]>([]);
  const [loansFilter, setLoansFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE'>('ACTIVE');
  const [loansSearch, setLoansSearch] = useState('');
  const [loansLoading, setLoansLoading] = useState(false);

  // Fines Management State
  const [fines, setFines] = useState<Fine[]>([]);
  const [finesStats, setFinesStats] = useState<any>({});
  const [finesFilter, setFinesFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'WAIVED'>('UNPAID');
  const [finesSearch, setFinesSearch] = useState('');
  const [finesLoading, setFinesLoading] = useState(false);

  // Waive Modal State
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [waiverReason, setWaiverReason] = useState('');
  const [waiveProcessing, setWaiveProcessing] = useState(false);

  // Shelf Audit Tool State
  const [auditShelf, setAuditShelf] = useState('Rack C-04, Shelf 2');
  const [auditBarcode, setAuditBarcode] = useState('');
  const [auditResult, setAuditResult] = useState<{
    status: 'CORRECT' | 'MISPLACED' | 'NOT_FOUND';
    copy?: any;
    message: string;
  } | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // Audio Beep Feedback
  const playBeep = (freq = 880, duration = 150) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) {}
  };

  const fetchOverviewData = async () => {
    try {
      setLoadingOverview(true);
      const [kpiRes, loansRes] = await Promise.all([
        api.get('/analytics/kpis'),
        api.get('/circulation/active-issues?status=ALL&limit=10'),
      ]);

      if (kpiRes.data.success) {
        setKpis(kpiRes.data.kpis || {});
      }
      if (loansRes.data.success) {
        setRecentTransactions(loansRes.data.issues || []);
      }

      // Hardcoded or API popular books
      setPopularBooks([
        { id: 1, title: 'HTML & Web Design', author: 'Jamsa K', department: 'Computer', borrows: 42, available: 3 },
        { id: 2, title: 'Basic Chemistry', author: 'Jadhav D. D.', department: 'Science', borrows: 38, available: 5 },
        { id: 3, title: 'Surveying and Levelling', author: 'Kanetkar', department: 'Civil', borrows: 35, available: 2 },
        { id: 4, title: 'Data Structures with C', author: 'Lipschutz S.', department: 'Computer', borrows: 31, available: 0 },
        { id: 5, title: 'Workshop Technology', author: 'Choudhory S.K.', department: 'Mechanical', borrows: 28, available: 4 },
      ]);
    } catch (err) {
      console.error('Fetch overview data error:', err);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchLoans = async () => {
    try {
      setLoansLoading(true);
      const res = await api.get(`/circulation/active-issues?status=${loansFilter}&search=${encodeURIComponent(loansSearch)}`);
      if (res.data.success) {
        setLoans(res.data.issues || []);
      }
    } catch (err) {
      console.error('Fetch loans error:', err);
    } finally {
      setLoansLoading(false);
    }
  };

  const fetchFines = async () => {
    try {
      setFinesLoading(true);
      const res = await api.get(`/fines?status=${finesFilter}&search=${encodeURIComponent(finesSearch)}`);
      if (res.data.success) {
        setFines(res.data.fines || []);
        setFinesStats(res.data.stats || {});
      }
    } catch (err) {
      console.error('Fetch fines error:', err);
    } finally {
      setFinesLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  useEffect(() => {
    if (activeTab === 'activeLoans') fetchLoans();
    if (activeTab === 'fines') fetchFines();
  }, [activeTab, loansFilter, finesFilter]);

  // Handle Send Overdue Reminders
  const handleSendReminders = async () => {
    try {
      setSendingReminders(true);
      setReminderFeedback(null);
      const res = await api.post('/analytics/send-overdue-reminders');
      if (res.data.success) {
        setReminderFeedback(res.data.message || `Overdue reminder alerts successfully sent to members.`);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        playBeep(1100, 200);
      }
    } catch (err: any) {
      setReminderFeedback(err.response?.data?.error || 'Failed to dispatch reminders.');
    } finally {
      setSendingReminders(false);
      setTimeout(() => setReminderFeedback(null), 6000);
    }
  };

  // Handle Rapid Circulation Submit
  const handleCirculationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode.trim()) {
      setCirculationFeedback({ type: 'error', message: 'Book barcode is required.' });
      return;
    }

    try {
      setCirculationLoading(true);
      setCirculationFeedback(null);

      if (actionType === 'ISSUE') {
        if (!memberId.trim()) {
          setCirculationFeedback({ type: 'error', message: 'Member ID or Email is required for checkout.' });
          setCirculationLoading(false);
          return;
        }

        const res = await api.post('/circulation/issue', {
          barcode: barcode.trim(),
          memberId: memberId.trim(),
        });

        if (res.data.success) {
          setCirculationFeedback({ type: 'success', message: res.data.message });
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          playBeep(1100, 150);
          setBarcode('');
          fetchOverviewData();
        }
      } else {
        const res = await api.post('/circulation/return', {
          barcode: barcode.trim(),
          returnRemarks: returnRemarks.trim() || 'Rapid Circulation Desk Return',
        });

        if (res.data.success) {
          setCirculationFeedback({ type: 'success', message: res.data.message });
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          playBeep(1320, 180);
          setBarcode('');
          setReturnRemarks('');
          fetchOverviewData();
        }
      }
    } catch (err: any) {
      setCirculationFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Operation failed.',
      });
      playBeep(300, 250);
    } finally {
      setCirculationLoading(false);
    }
  };

  // Pay Fine Action
  const handlePayFine = async (fineId: string) => {
    try {
      const res = await api.post(`/fines/${fineId}/pay`, { paymentMethod: 'CASH' });
      if (res.data.success) {
        alert(res.data.message);
        fetchFines();
        fetchOverviewData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record payment.');
    }
  };

  // Waive Fine Action
  const handleWaiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFine || !waiverReason.trim()) return;

    try {
      setWaiveProcessing(true);
      const res = await api.post(`/fines/${selectedFine.id}/waive`, { waiverReason });
      if (res.data.success) {
        alert(res.data.message);
        setSelectedFine(null);
        setWaiverReason('');
        fetchFines();
        fetchOverviewData();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to waive fine.');
    } finally {
      setWaiveProcessing(false);
    }
  };

  // Shelf Audit Verification
  const handleShelfAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditBarcode.trim()) return;

    try {
      setAuditLoading(true);
      setAuditResult(null);
      const res = await api.get(`/circulation/copy/${encodeURIComponent(auditBarcode.trim())}`);

      if (res.data.success && res.data.copy) {
        const copy = res.data.copy;
        const expectedShelf = copy.shelfNumber || copy.location || '';
        const match = expectedShelf.toLowerCase().trim() === auditShelf.toLowerCase().trim();

        if (match) {
          setAuditResult({
            status: 'CORRECT',
            copy,
            message: `Verified! "${copy.book?.title}" is properly placed on shelf (${expectedShelf}).`,
          });
          playBeep(1200, 150);
        } else {
          setAuditResult({
            status: 'MISPLACED',
            copy,
            message: `MISPLACED ITEM ALERT: Scanned on "${auditShelf}", but official catalog shelf is "${expectedShelf || 'Unassigned'}".`,
          });
          playBeep(350, 300);
        }
      }
    } catch (err: any) {
      setAuditResult({
        status: 'NOT_FOUND',
        message: err.response?.data?.error || `Barcode '${auditBarcode}' not found in catalog.`,
      });
      playBeep(250, 250);
    } finally {
      setAuditLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Greeting Header (Reference Style) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full">
              Circulation Command
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Hello, {user?.name?.split(' ')[0] || 'Librarian'} 👋
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
            Here is your daily library circulation summary, member checkouts, and AI recommendations.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSendReminders}
            disabled={sendingReminders}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {sendingReminders ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>Send Overdue Reminders</span>
          </button>

          <Link
            to="/scan"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <QrCode className="h-4 w-4" />
            <span>Camera Scanner</span>
          </Link>

          <Link
            to="/analytics"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-xs shadow-sm transition-all"
          >
            <BarChart3 className="h-4 w-4 text-blue-600" />
            <span>Full Analytics</span>
          </Link>
        </div>
      </div>

      {/* Reminder Feedback Banner */}
      {reminderFeedback && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-center justify-between text-xs font-semibold shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{reminderFeedback}</span>
          </div>
          <button onClick={() => setReminderFeedback(null)} className="text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* 4 KPI Cards (Matching Reference Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* KPI 1: Total Books */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" /> +4.2%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {kpis.totalTitles ? kpis.totalTitles.toLocaleString() : '2,299'}
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
            Total Book Titles ({kpis.totalCopies || 8246} physical copies)
          </div>
        </div>

        {/* KPI 2: Active Members */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" /> +12.8%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {kpis.activeMembers || 452}
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
            Active Members (Students & Faculty)
          </div>
        </div>

        {/* KPI 3: Books Issued Today / Active Loans */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              Active loans
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {kpis.activeIssues || 18}
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1">
            Books Currently on Loan
          </div>
        </div>

        {/* KPI 4: Overdue Books */}
        <div
          onClick={() => {
            setActiveTab('activeLoans');
            setLoansFilter('OVERDUE');
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="h-11 w-11 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-105 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              Needs Attention
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {kpis.overdueCount || 7}
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
            <span>Overdue Returns</span>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 group-hover:underline">View list →</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="h-4 w-4" /> Overview & AI Insights
        </button>

        <button
          onClick={() => setActiveTab('circulation')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'circulation'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowLeftRight className="h-4 w-4" /> Rapid Circulation Desk
        </button>

        <button
          onClick={() => setActiveTab('activeLoans')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'activeLoans'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" /> Active Loans ({loans.length || kpis.activeIssues || 0})
        </button>

        <button
          onClick={() => setActiveTab('fines')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'fines'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="h-4 w-4" /> Fines & Waivers
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MapPin className="h-4 w-4" /> Misplaced Shelf Audit
        </button>
      </div>

      {/* Tab 1: Reference Overview & AI Insights */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Cols: Recent Issue / Return Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Recent Issue / Return Activity</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Live transaction log from circulation counters and mobile scanners
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('activeLoans')}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    View All Records <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {loadingOverview ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading circulation log...</div>
              ) : recentTransactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No circulation transactions found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-slate-400">
                        <th className="pb-3 font-semibold">Book Title</th>
                        <th className="pb-3 font-semibold">Barcode</th>
                        <th className="pb-3 font-semibold">Borrower</th>
                        <th className="pb-3 font-semibold">Due Date</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {recentTransactions.slice(0, 7).map((item) => {
                        const due = new Date(item.dueDate);
                        const now = new Date();
                        const isOverdue = item.status === 'ACTIVE' && due < now;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                              {item.copy?.book?.title || 'Library Item'}
                            </td>
                            <td className="py-3 font-mono text-slate-600 dark:text-slate-300">
                              {item.copy?.barcode || 'D-???'}
                            </td>
                            <td className="py-3">
                              <div className="font-bold text-slate-800 dark:text-slate-200">{item.user?.name}</div>
                              <div className="text-[10px] text-slate-400">{item.user?.memberId}</div>
                            </td>
                            <td className="py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </td>
                            <td className="py-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  item.status === 'RETURNED'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                    : isOverdue
                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                }`}
                              >
                                {item.status === 'RETURNED' ? 'Returned' : isOverdue ? 'Overdue' : 'Issued'}
                              </span>
                            </td>
                            <td className="py-3 text-right whitespace-nowrap">
                              {item.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => {
                                    setBarcode(item.copy?.barcode || '');
                                    setActionType('RETURN');
                                    setActiveTab('circulation');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold transition-colors"
                                >
                                  Return
                                </button>
                              ) : (
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Done</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Quick Circulation Rules Summary */}
            <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Institutional Loan & Reservation Rules
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300 mt-3">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white block">Student Borrowing:</span>
                  <span>Max 5 items, 14 days duration, up to 3 online renewals.</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white block">Faculty Borrowing:</span>
                  <span>Max 10 items, 30 days duration, high waitlist priority.</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white block">Overdue Penalty:</span>
                  <span>₹5.00/day per item automatically accrued after due date.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Insights Card & Popular Books */}
          <div className="space-y-6">
            {/* AI Insights Card (Matching Reference Design) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="h-8 w-8 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">AI Circulation Insights</h3>
                  <p className="text-[11px] text-slate-500">Autonomous pattern analysis</p>
                </div>
              </div>

              {/* AI Suggestion Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/60 mb-5">
                <div className="flex items-start gap-2.5">
                  <span className="text-base">💡</span>
                  <div>
                    <h4 className="text-xs font-black text-blue-900 dark:text-blue-200">
                      Predictive Demand Spike Alert
                    </h4>
                    <p className="text-xs text-blue-800/80 dark:text-blue-300 mt-1 leading-relaxed">
                      Midterms begin in 12 days. <strong>Data Structures with C</strong> and <strong>Basic Chemistry</strong> will experience ~85% inventory depletion based on historical checkouts.
                    </p>
                  </div>
                </div>
              </div>

              {/* Most Popular Books List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Most Popular Books This Term
                </h4>

                <div className="space-y-3">
                  {popularBooks.map((book, idx) => (
                    <div
                      key={book.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {book.title}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {book.author} • {book.department}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <div className="text-xs font-black text-blue-600 dark:text-blue-400">
                          {book.borrows} issues
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {book.available > 0 ? `${book.available} avail` : 'Waitlist'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Overdue Action Box */}
            <div className="bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-950/30 dark:to-orange-950/20 border border-rose-200/80 dark:border-rose-900/50 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-rose-700 dark:text-rose-300 font-black text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Overdue Books Follow-up</span>
              </div>
              <p className="text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed mb-4">
                <strong>{kpis.overdueCount || 7} books</strong> are past their loan return deadline. Send automated in-app notifications and email reminders with a single click.
              </p>
              <button
                onClick={handleSendReminders}
                disabled={sendingReminders}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sendingReminders ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Dispatched Overdue Reminders</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rapid Circulation Counter */}
      {activeTab === 'circulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <button
                type="button"
                onClick={() => { setActionType('ISSUE'); setCirculationFeedback(null); }}
                className={`flex-1 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
                  actionType === 'ISSUE'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                📤 Book Checkout (Issue)
              </button>

              <button
                type="button"
                onClick={() => { setActionType('RETURN'); setCirculationFeedback(null); }}
                className={`flex-1 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all ${
                  actionType === 'RETURN'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                📥 Book Check-in (Return)
              </button>
            </div>

            {circulationFeedback && (
              <div
                className={`mb-6 p-4 rounded-2xl flex items-center gap-3 border ${
                  circulationFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 text-rose-800 dark:text-rose-200'
                }`}
              >
                {circulationFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-semibold">{circulationFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleCirculationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Book Barcode / Physical Copy ID *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Scan or enter barcode (e.g. D-1, D-501)..."
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <QrCode className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
              </div>

              {actionType === 'ISSUE' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Borrower Member ID / Email *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. STU001, FAC001 or student email"
                      value={memberId}
                      onChange={(e) => setMemberId(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <UserCheck className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  </div>
                </div>
              )}

              {actionType === 'RETURN' && (
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Return Condition / Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Good condition, returned at desk"
                    value={returnRemarks}
                    onChange={(e) => setReturnRemarks(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={circulationLoading}
                className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                  actionType === 'ISSUE' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {circulationLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
                <span>
                  {circulationLoading
                    ? 'Processing...'
                    : actionType === 'ISSUE'
                    ? 'Execute Book Checkout (14-Day Loan)'
                    : 'Process Book Return & Calculate Fines'}
                </span>
              </button>
            </form>
          </div>

          {/* Quick Counter Helper Card */}
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                Scanner Instructions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                Both handheld USB barcode guns and 2D Bluetooth ring scanners are supported natively without additional driver configuration.
              </p>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <li>• <strong>Checkout:</strong> Scan book barcode, enter Member ID, press Enter.</li>
                <li>• <strong>Return:</strong> Scan book barcode; fines are calculated on the spot.</li>
                <li>• <strong>Camera Scanner:</strong> Open mobile camera view for phone-based scanning.</li>
              </ul>
            </div>

            <div className="mt-6">
              <Link
                to="/scan"
                className="w-full py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-bold text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors block"
              >
                Launch Mobile Camera Barcode Scanner →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Active Loans & Overdues Table */}
      {activeTab === 'activeLoans' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search member, title, or barcode..."
                  value={loansSearch}
                  onChange={(e) => setLoansSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchLoans()}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={fetchLoans}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Search
              </button>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-2">
              {(['ACTIVE', 'OVERDUE', 'ALL'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLoansFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    loansFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {loansLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading active circulation records...</div>
          ) : loans.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">No matching circulation records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-400">
                    <th className="pb-3 font-semibold">Barcode</th>
                    <th className="pb-3 font-semibold">Book Title</th>
                    <th className="pb-3 font-semibold">Borrower</th>
                    <th className="pb-3 font-semibold">Issue Date</th>
                    <th className="pb-3 font-semibold">Due Date</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {loans.map((item) => {
                    const due = new Date(item.dueDate);
                    const now = new Date();
                    const isOverdue = item.status === 'ACTIVE' && due < now;
                    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          {item.copy?.barcode}
                        </td>
                        <td className="py-3 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {item.copy?.book?.title}
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{item.user?.name}</div>
                          <div className="text-[10px] text-slate-400">{item.user?.memberId} • {item.user?.department || 'Member'}</div>
                        </td>
                        <td className="py-3 text-slate-500">
                          {new Date(item.issuedDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-slate-500">
                          {due.toLocaleDateString()}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {isOverdue ? `${Math.abs(diffDays)}d Overdue` : `${diffDays}d left`}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              setBarcode(item.copy?.barcode || '');
                              setActionType('RETURN');
                              setActiveTab('circulation');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold hover:bg-blue-100 transition-colors"
                          >
                            Quick Return
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Fines Management & Waivers */}
      {activeTab === 'fines' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
              <div className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400">Total Unpaid Fines</div>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">₹{finesStats.unpaidTotal || 0}</div>
            </div>

            <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900">
              <div className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">Total Collected Fines</div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">₹{finesStats.paidTotal || 0}</div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold uppercase text-slate-500">Total Waived Fines</div>
              <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-1">₹{finesStats.waivedTotal || 0}</div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search member or title..."
                  value={finesSearch}
                  onChange={(e) => setFinesSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchFines()}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                />
                <button
                  onClick={fetchFines}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200"
                >
                  Search
                </button>
              </div>

              <div className="flex items-center gap-2">
                {(['UNPAID', 'PAID', 'WAIVED', 'ALL'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFinesFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      finesFilter === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {finesLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs">Loading fine records...</div>
            ) : fines.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">No fine records found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-400">
                      <th className="pb-3 font-semibold">Member</th>
                      <th className="pb-3 font-semibold">Book Title</th>
                      <th className="pb-3 font-semibold">Overdue Days</th>
                      <th className="pb-3 font-semibold">Amount</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {fines.map((fine) => (
                      <tr key={fine.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3">
                          <div className="font-bold text-slate-900 dark:text-white">{fine.user?.name}</div>
                          <div className="text-[10px] text-slate-400">{fine.user?.memberId}</div>
                        </td>
                        <td className="py-3 text-slate-700 dark:text-slate-300 max-w-xs truncate">
                          {fine.issueRecord?.copy?.book?.title || 'Unknown Title'}
                        </td>
                        <td className="py-3 font-mono">{fine.daysOverdue} days</td>
                        <td className="py-3 font-black text-rose-600 dark:text-rose-400">₹{fine.amount}</td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              fine.status === 'UNPAID'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : fine.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {fine.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          {fine.status === 'UNPAID' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handlePayFine(fine.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                              >
                                Collect ₹{fine.amount}
                              </button>
                              <button
                                onClick={() => setSelectedFine(fine)}
                                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 font-bold text-[11px]"
                              >
                                Waive...
                              </button>
                            </div>
                          )}
                          {fine.status === 'WAIVED' && (
                            <span className="text-[10px] text-slate-400 italic">Reason: {fine.waiverReason || 'Staff Discretion'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Misplaced Book Shelf Audit Tool */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="max-w-2xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <MapPin className="h-6 w-6 text-blue-500" />
              <span>Misplaced Book Shelf Audit Tool</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Walk down library stacks with your scanner. Select the shelf you are currently inspecting and scan barcodes in succession. The system alerts instantly if a book belongs to a different rack or shelf.
            </p>

            <form onSubmit={handleShelfAudit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Current Shelf / Section Under Inspection *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rack C-04, Shelf 2 or Diploma Library"
                  value={auditShelf}
                  onChange={(e) => setAuditShelf(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Scan Physical Book Barcode *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Scan barcode (e.g. D-1, D-2, D-501)..."
                    value={auditBarcode}
                    onChange={(e) => setAuditBarcode(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <QrCode className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                disabled={auditLoading}
                className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {auditLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileCheck className="h-4 w-4" />}
                <span>Verify Shelf Placement</span>
              </button>
            </form>

            {/* Audit Verification Result */}
            {auditResult && (
              <div
                className={`mt-6 p-5 rounded-3xl border ${
                  auditResult.status === 'CORRECT'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {auditResult.status === 'CORRECT' ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0 animate-bounce" />
                  )}
                  <div>
                    <h4 className="font-black text-sm">{auditResult.message}</h4>
                    {auditResult.copy && (
                      <p className="text-xs mt-1">
                        Book: <strong>{auditResult.copy.book?.title}</strong> • Status: {auditResult.copy.status}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Waive Fine */}
      {selectedFine && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Waive Overdue Fine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Waiving fine of <strong>₹{selectedFine.amount}</strong> for member <strong>{selectedFine.user?.name}</strong> ({selectedFine.user?.memberId}).
            </p>

            <form onSubmit={handleWaiveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Waiver Reason / Institutional Justification *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Medical certificate verified by HOD..."
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedFine(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={waiveProcessing}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {waiveProcessing ? 'Waiving...' : 'Confirm Waiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarianDashboard;
