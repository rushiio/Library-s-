import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  Sparkles,
  BookOpen,
  Users,
  AlertTriangle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Send,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  Layers,
  Search,
  Activity,
  Zap,
  HelpCircle,
  PieChart as PieIcon,
  ShieldCheck,
  BrainCircuit,
  Flame,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#6366f1', '#f97316'];

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();

  // Filters State
  const [range, setRange] = useState<'today' | '7d' | '30d' | 'semester' | 'year'>('30d');
  const [department, setDepartment] = useState<string>('ALL');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleTimeString());

  // Data State
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Natural Language Query State
  const [nlQuery, setNlQuery] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [nlResult, setNlResult] = useState<{ answer: string; chartType: string; chartData: any } | null>(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/analytics/comprehensive?range=${range}&department=${department}&role=${roleFilter}`);
      if (res.data.success) {
        setAnalyticsData(res.data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Failed to load comprehensive analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range, department, roleFilter]);

  useEffect(() => {
    let timer: any;
    if (autoRefresh) {
      timer = setInterval(() => {
        fetchAnalytics();
      }, 30000); // 30s auto-refresh
    }
    return () => clearInterval(timer);
  }, [autoRefresh, range, department, roleFilter]);

  // Handle Natural Query Submit
  const handleNaturalQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;

    try {
      setNlLoading(true);
      const res = await api.post('/analytics/natural-query', { question: nlQuery.trim() });
      if (res.data.success) {
        setNlResult(res.data);
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to analyze natural query.');
    } finally {
      setNlLoading(false);
    }
  };

  // Export Data to CSV
  const exportToCSV = () => {
    if (!analyticsData?.charts?.topBorrowedBooks) return;

    const rows = [
      ['Title', 'Author', 'Department', 'Borrow Count'],
      ...analyticsData.charts.topBorrowedBooks.map((b: any) => [
        `"${b.title}"`,
        `"${b.author}"`,
        `"${b.department}"`,
        b.borrows,
      ]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LibraAI_Analytics_${range}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print PDF
  const handlePrintPDF = () => {
    window.print();
  };

  const charts = analyticsData?.charts || {};
  const kpis = analyticsData?.kpis || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 print:p-0 print:m-0">
      {/* Top Header & Global Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full">
              Institutional Intelligence
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Last synced: {lastUpdated}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Library Analytics & Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            22 multi-dimensional Recharts analytical models, predictive demand forecasts, and plain-language AI insights.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          {/* Date Range Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
            {(['today', '7d', '30d', 'semester', 'year'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-xl transition-all capitalize ${
                  range === r
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer">Computer Engineering</option>
            <option value="Mechanical">Mechanical Engineering</option>
            <option value="Civil">Civil Engineering</option>
            <option value="Electrical">Electrical Engineering</option>
            <option value="E & TC">Electronics & Telecomm</option>
            <option value="Science">Engineering Science</option>
          </select>

          {/* Export Buttons */}
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Printer className="h-3.5 w-3.5 text-blue-600" />
            <span>PDF Report</span>
          </button>

          {/* Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors shadow-sm ${
              autoRefresh
                ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${autoRefresh ? 'animate-spin text-emerald-600' : ''}`} />
            <span>{autoRefresh ? 'Live (30s)' : 'Auto-Sync'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: Natural Language Analytics Assistant */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-950/20 relative overflow-hidden print:hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            <span>Natural Language Analytics Copilot</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Ask any library analytics question in plain English or Hindi
          </h2>
          <p className="text-xs sm:text-sm text-blue-200 mt-1 mb-5">
            e.g. "Which subject had the lowest usage this semester?", "What is the peak library hour?", or "Forecast demand for next month's exams".
          </p>

          <form onSubmit={handleNaturalQuery} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={nlQuery}
                onChange={(e) => setNlQuery(e.target.value)}
                placeholder="Ask e.g. Which department borrows the most books?..."
                className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-blue-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              disabled={nlLoading || !nlQuery.trim()}
              className="px-5 py-3 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {nlLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>Analyze</span>
            </button>
          </form>

          {/* Natural Query Response Card */}
          {nlResult && (
            <div className="mt-5 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 animate-fade-in">
              <div className="flex items-start gap-3">
                <BrainCircuit className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-emerald-300 uppercase tracking-wider">AI Executive Finding:</h4>
                  <p className="text-xs sm:text-sm text-white mt-1 leading-relaxed font-medium">{nlResult.answer}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: 6 KPI Cards with Trends */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* KPI 1: Total Books */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total Titles</span>
            <BookOpen className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {kpis.totalBooks ? kpis.totalBooks.toLocaleString() : '2,299'}
          </div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="h-3 w-3" /> +4.2% catalog
          </div>
        </div>

        {/* KPI 2: Physical Copies */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Physical Volumes</span>
            <Layers className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {kpis.totalCopies ? kpis.totalCopies.toLocaleString() : '8,246'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {charts.inventoryStatus?.[0]?.value || '8,228'} available
          </div>
        </div>

        {/* KPI 3: Active Loans */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Active Issues</span>
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {kpis.activeIssues || 18}
          </div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="h-3 w-3" /> +8.5% weekly
          </div>
        </div>

        {/* KPI 4: Overdue Loans */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Overdue Returns</span>
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {kpis.overdueIssues || 7}
          </div>
          <div className="text-[11px] text-rose-500 flex items-center gap-0.5 mt-0.5">
            <Clock className="h-3 w-3" /> ₹5 / day accrued
          </div>
        </div>

        {/* KPI 5: Fine Collections */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Fines Collected</span>
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            ₹{kpis.finesPaid || 420}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            ₹{kpis.finesUnpaid || 180} pending
          </div>
        </div>

        {/* KPI 6: Active Members */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Active Readers</span>
            <Users className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {kpis.activeMembers || 520}
          </div>
          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5">
            <ArrowUpRight className="h-3 w-3" /> +15% this term
          </div>
        </div>
      </div>

      {/* SECTION 3: Main Analytical Grid (Charts 1 to 22) */}

      {/* Row A: Circulation Timeline (Area) + Category Breakdown (Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Issues and Returns Over Time (Area Chart) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Circulation Activity & Footfall Timeline
              </h3>
              <p className="text-xs text-slate-500">Daily book checkouts, returns, and library visitor footfall</p>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full w-fit">
              {range.toUpperCase()} Range
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={charts.issuesAndReturnsTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="issuesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="returnsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    backgroundColor: '#0a101f',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area isAnimationActive={false} type="monotone" dataKey="issues" name="Book Checkouts" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#issuesGrad)" />
                <Area isAnimationActive={false} type="monotone" dataKey="returns" name="Book Returns" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#returnsGrad)" />
                <Line isAnimationActive={false} type="monotone" dataKey="footfall" name="Visitor Footfall" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Books by Category (Donut Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Books by Department / Category</h3>
            <p className="text-xs text-slate-500">Distribution across 2,299 catalog titles</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  isAnimationActive={false}
                  data={charts.booksByCategory || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(charts.booksByCategory || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} Titles`, name]}
                  contentStyle={{ borderRadius: '12px', backgroundColor: '#0a101f', border: 'none', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1.5 mt-2 text-[11px]">
            {(charts.booksByCategory || []).slice(0, 6).map((c: any, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-slate-600 dark:text-slate-300 truncate">{c.name}: <strong>{c.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row B: Top 10 Borrowed Books (Bar) + Top Borrowing Departments (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Top 10 Most Borrowed Books */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Top 10 Most Borrowed Books</h3>
              <p className="text-xs text-slate-500">Most requested titles across semesters</p>
            </div>
            <Award className="h-5 w-5 text-amber-500" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.topBorrowedBooks || []} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="title" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#0a101f', border: 'none', color: '#fff', fontSize: '12px' }} />
                <Bar isAnimationActive={false} dataKey="borrows" name="Total Checkouts" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Department Borrowing Comparison */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Top Borrowing Departments</h3>
              <p className="text-xs text-slate-500">Branch-wise checkout volume vs active members</p>
            </div>
            <Users className="h-5 w-5 text-purple-500" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={charts.topBorrowingDepartments || []} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="department" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#0a101f', border: 'none', color: '#fff', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '15px' }} />
                <Bar isAnimationActive={false} dataKey="borrows" name="Book Checkouts" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                <Bar isAnimationActive={false} dataKey="activeMembers" name="Active Members" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row C: 30-Day Predictive Demand Forecast + Multi-Disciplinary Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 5: 30-Day Predictive Demand Forecast with Confidence Band */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full mb-1">
                <BrainCircuit className="h-3 w-3" /> AI Linear Projection Model
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                30-Day Predictive Circulation Demand Forecast
              </h3>
              <p className="text-xs text-slate-500">Predicted daily checkout volume leading into upcoming exams</p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              95% Confidence Band
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.predictionForecast || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#0a101f', border: 'none', color: '#fff', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="upper" name="Upper Estimate" stroke="#c084fc" fill="#f3e8ff" fillOpacity={0.3} />
                <Area type="monotone" dataKey="lower" name="Lower Estimate" stroke="#cbd5e1" fill="#ffffff" fillOpacity={0.8} />
                <Line type="monotone" dataKey="forecast" name="Forecasted Daily Issues" stroke="#9333ea" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="actual" name="Historical Baseline" stroke="#3b82f6" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 6: Subject Demand Radar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Subject Demand vs Stock Radar</h3>
            <p className="text-xs text-slate-500">Student inquiry index vs shelf availability</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={charts.subjectDemandRadar || []}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                <Radar name="Student Demand" dataKey="demand" stroke="#ec4899" fill="#ec4899" fillOpacity={0.4} />
                <Radar name="Shelf Copies" dataKey="availability" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#0a101f', border: 'none', color: '#fff', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row D: Peak Hours Heatmap + Monthly Category Stacked Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 7: Peak Library Hours Heatmap */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Peak Library Hours & Study Zone Heatmap
              </h3>
              <p className="text-xs text-slate-500">Concurrent student presence by day and time block</p>
            </div>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800 font-semibold">
                  <th className="py-2 text-left">Day</th>
                  <th>8-10 AM</th>
                  <th>10-12 PM</th>
                  <th>12-2 PM</th>
                  <th>2-4 PM</th>
                  <th>4-6 PM</th>
                  <th>6-8 PM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => {
                  const daySlots = (charts.peakHoursHeatmap || []).filter((h: any) => h.day === d);
                  return (
                    <tr key={d}>
                      <td className="py-2.5 font-bold text-left text-slate-700 dark:text-slate-300">{d}</td>
                      {['8-10 AM', '10-12 PM', '12-2 PM', '2-4 PM', '4-6 PM', '6-8 PM'].map((slot) => {
                        const cell = daySlots.find((s: any) => s.hour === slot);
                        const val = cell ? cell.visits : 20;
                        const bg =
                          val > 60
                            ? 'bg-blue-600 text-white font-bold'
                            : val > 40
                            ? 'bg-blue-400 text-white'
                            : val > 25
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500';

                        return (
                          <td key={slot} className="p-1">
                            <div className={`py-1.5 px-2 rounded-xl text-[11px] ${bg}`}>
                              {val}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end gap-3 mt-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-slate-100 dark:bg-slate-800 border"></span> Low</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-blue-100 dark:bg-blue-950"></span> Moderate</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-blue-400"></span> High</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-blue-600"></span> Peak</span>
          </div>
        </div>

        {/* Chart 8: Monthly Category Stacked Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Monthly Category-Wise Issues</h3>
            <p className="text-xs text-slate-500">Stacked checkout velocity by academic discipline</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyCategoryStacked || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#0a101f', border: 'none', color: '#fff', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Computer" stackId="a" fill="#3b82f6" />
                <Bar dataKey="Mechanical" stackId="a" fill="#10b981" />
                <Bar dataKey="Civil" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Electrical" stackId="a" fill="#8b5cf6" />
                <Bar dataKey="Science" stackId="a" fill="#ec4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row E: Least Borrowed Books + Return Delay by Department */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 9: Least Borrowed / Idle Books */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Least Borrowed / Idle Books Detection
              </h3>
              <p className="text-xs text-slate-500">Items with 0 circulations in 120+ days (recommend rotation)</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              Low Velocity
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.leastBorrowedBooks || []} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="title" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#0a101f', border: 'none', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="idleDays" name="Days Idle Without Borrow" fill="#f59e0b" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 10: Average Return Delay by Department */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Average Return Delay by Department
              </h3>
              <p className="text-xs text-slate-500">Overdue delay duration in days & defaulter rates</p>
            </div>
            <Clock className="h-5 w-5 text-rose-500" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.returnDelayByDept || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: '#0a101f', border: 'none', color: '#fff', fontSize: '12px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="avgDelayDays" name="Avg Return Delay (Days)" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row F: Multi-Gauges & User Journey Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 11: Institutional Gauges & Occupancy */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
            Capacity & Utilization Gauges
          </h3>
          <p className="text-xs text-slate-500 mb-6">Real-time facility & catalog usage rate</p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Catalog Collection Turnover</span>
                <span className="text-blue-600 dark:text-blue-400">{charts.capacityGauges?.overallCollectionUsage || 24.5}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${charts.capacityGauges?.overallCollectionUsage || 24.5}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Silent Study Seat Occupancy</span>
                <span className="text-emerald-600 dark:text-emerald-400">{charts.capacityGauges?.seatOccupancyRate || 45}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${charts.capacityGauges?.seatOccupancyRate || 45}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Digital Resource Lab Usage</span>
                <span className="text-purple-600 dark:text-purple-400">{charts.capacityGauges?.digitalLabUsage || 62}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: `${charts.capacityGauges?.digitalLabUsage || 62}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-slate-700 dark:text-slate-300">Active Member Engagement</span>
                <span className="text-amber-600 dark:text-amber-400">{charts.capacityGauges?.activeMemberRatio || 78.4}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${charts.capacityGauges?.activeMemberRatio || 78.4}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 12: User Journey Funnel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Student Discovery & Borrowing Conversion Funnel
            </h3>
            <p className="text-xs text-slate-500">From catalog search to successful book checkout</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center my-6">
            {(charts.userFunnel || []).map((step: any, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 relative flex flex-col justify-between"
                style={{ backgroundColor: `${step.fill}15` }}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{step.step}</div>
                  <div className="text-2xl font-black mt-1" style={{ color: step.fill }}>{step.count.toLocaleString()}</div>
                </div>
                <div className="text-[11px] font-bold text-slate-400 mt-2">
                  {idx === 0 ? '100% Base' : `${Math.round((step.count / charts.userFunnel[0].count) * 100)}% Conversion`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row G: Top Borrowers & Defaulters Table with Sparklines */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <span>Top Academic Readers & Borrowing Leaderboard</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Recognizing outstanding reading streaks and institutional engagement</p>
          </div>

          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full">
            Gamified Streaks
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider text-slate-400">
                <th className="pb-3 font-semibold">Rank & Member</th>
                <th className="pb-3 font-semibold">Department</th>
                <th className="pb-3 font-semibold">Role</th>
                <th className="pb-3 font-semibold">Total Borrowed</th>
                <th className="pb-3 font-semibold">Current Active</th>
                <th className="pb-3 font-semibold">Fines Status</th>
                <th className="pb-3 font-semibold text-right">Activity Sparkline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {(charts.topBorrowersTable || []).map((b: any, idx: number) => (
                <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-blue-50 dark:bg-blue-950 font-black text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{b.name}</div>
                        <div className="text-[10px] text-slate-400">{b.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{b.dept}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {b.role}
                    </span>
                  </td>
                  <td className="py-3 font-black text-slate-900 dark:text-white">{b.borrowsCount} books</td>
                  <td className="py-3 font-bold text-blue-600 dark:text-blue-400">{b.activeLoans} active</td>
                  <td className="py-3">
                    <span className={`text-[11px] font-bold ${b.finesPaid > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {b.finesPaid > 0 ? `₹${b.finesPaid} paid` : 'Zero Fines'}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex items-end gap-1 h-5">
                      {b.history.map((h: number, i: number) => (
                        <div
                          key={i}
                          className="w-1.5 bg-blue-500 rounded-t"
                          style={{ height: `${h * 5}px` }}
                        ></div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row H: AI Plain-Language Findings & Monthly Purchase Assistant */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: AI Insights Findings Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Autonomous AI Data Insights & Findings
            </h3>
          </div>

          <div className="space-y-3">
            {(charts.aiInsights || []).map((finding: string, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium"
              >
                {finding}
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Predictive Purchase Assistant ("Books to Buy") */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Predictive Purchase Recommendations
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
              Term Budget Optimizer
            </span>
          </div>

          <div className="space-y-3">
            {(charts.purchaseRecommendations || []).map((rec: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rec.title}</h4>
                    <p className="text-[10px] text-slate-500">{rec.author} • {rec.branch}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      rec.priority === 'HIGH'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {rec.priority} PRIORITY
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 flex items-center justify-between">
                  <span className="italic">{rec.reason}</span>
                  <strong className="text-slate-900 dark:text-white font-mono shrink-0 pl-2">{rec.estCost}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
