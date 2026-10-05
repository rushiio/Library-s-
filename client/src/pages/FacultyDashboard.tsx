import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  Plus,
  Trash2,
  Users,
  TrendingUp,
  Send,
  CheckCircle2,
  AlertCircle,
  FileText,
  Star,
  Layers,
  Sparkles,
  ChevronRight,
  BarChart2,
  Building2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Book } from '../types';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const [readingLists, setReadingLists] = useState<any[]>([]);
  const [engagement, setEngagement] = useState<any[]>([]);
  const [availableBooks, setAvailableBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // New Reading List Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [semester, setSemester] = useState('6');
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);
  const [listCreating, setListCreating] = useState(false);

  // Purchase Recommendation State
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [recTitle, setRecTitle] = useState('');
  const [recAuthor, setRecAuthor] = useState('');
  const [recIsbn, setRecIsbn] = useState('');
  const [recPublisher, setRecPublisher] = useState('');
  const [recPrice, setRecPrice] = useState('');
  const [recCourse, setRecCourse] = useState('');
  const [recReason, setRecReason] = useState('');
  const [recSubmitting, setRecSubmitting] = useState(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadFacultyData = async () => {
    try {
      setLoading(true);
      const [listsRes, engageRes, booksRes] = await Promise.all([
        api.get('/faculty/lists'),
        api.get('/faculty/engagement'),
        api.get('/books?limit=50'),
      ]);

      if (listsRes.data.success) {
        setReadingLists(listsRes.data.lists || []);
      }
      if (engageRes.data.success) {
        setEngagement(engageRes.data.engagement || []);
      }
      if (booksRes.data.success) {
        setAvailableBooks(booksRes.data.books || []);
      }
    } catch (err) {
      console.error('Failed to load faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacultyData();
  }, []);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode || !subjectName || selectedBookIds.length === 0) {
      setNotification({ type: 'error', message: 'Please enter subject code, name, and select at least 1 book.' });
      return;
    }

    try {
      setListCreating(true);
      const payload = {
        subjectCode,
        subjectName,
        semester: parseInt(semester, 10),
        items: selectedBookIds.map((id) => ({
          bookId: id,
          isMandatory: true,
          notes: `Essential textbook for ${subjectCode}`,
        })),
      };

      const res = await api.post('/faculty/lists', payload);
      if (res.data.success) {
        setNotification({ type: 'success', message: res.data.message });
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
        setShowCreateModal(false);
        setSubjectCode('');
        setSubjectName('');
        setSelectedBookIds([]);
        loadFacultyData();
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.error || 'Failed to create reading list.',
      });
    } finally {
      setListCreating(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Are you sure you want to delete this course reading list?')) return;
    try {
      const res = await api.delete(`/faculty/lists/${listId}`);
      if (res.data.success) {
        setNotification({ type: 'success', message: res.data.message });
        loadFacultyData();
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.error || 'Failed to delete reading list.',
      });
    }
  };

  const handleRecommendBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle || !recAuthor) {
      setNotification({ type: 'error', message: 'Book title and author are required.' });
      return;
    }

    try {
      setRecSubmitting(true);
      const res = await api.post('/faculty/recommend', {
        title: recTitle,
        author: recAuthor,
        isbn: recIsbn,
        publisher: recPublisher,
        estimatedPrice: recPrice ? parseFloat(recPrice) : null,
        courseName: recCourse,
        reason: recReason,
      });

      if (res.data.success) {
        setNotification({ type: 'success', message: res.data.message });
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
        setShowRecommendModal(false);
        setRecTitle('');
        setRecAuthor('');
        setRecIsbn('');
        setRecPublisher('');
        setRecPrice('');
        setRecCourse('');
        setRecReason('');
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.error || 'Failed to submit recommendation.',
      });
    } finally {
      setRecSubmitting(false);
    }
  };

  const toggleBookSelection = (id: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(id) ? prev.filter((bId) => bId !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 rounded-3xl p-6 sm:p-10 text-white shadow-xl shadow-amber-600/10 mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3">
              <GraduationCap className="h-3.5 w-3.5 text-amber-200" />
              <span>Faculty Academic Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="text-sm text-amber-100 mt-2 max-w-xl">
              {user?.department || 'Engineering Faculty'} • Curate course syllabi reading lists, track student textbook engagement, and recommend additions to the collection.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-amber-900 font-bold text-sm shadow-md hover:bg-amber-50 transition-colors"
              >
                <Plus className="h-4 w-4" /> Curate Course Reading List
              </button>
              <button
                onClick={() => setShowRecommendModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm backdrop-blur-md border border-white/20 transition-colors"
              >
                <Send className="h-4 w-4" /> Suggest Book Purchase
              </button>
            </div>
          </div>

          {/* Borrowing Limit Stat Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-center shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
              Faculty Quota
            </span>
            <div className="text-3xl font-black mt-1">10 Books</div>
            <div className="text-xs text-amber-100 mt-1">Extended 30-day loan duration</div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 text-rose-800 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-xs font-bold underline">Dismiss</button>
        </div>
      )}

      {/* Main Grid: Reading Lists & Engagement Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Left 2 Cols: Course Reading Lists */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-500" />
              <span>Curated Course Reading Lists</span>
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1"
            >
              + Create New List
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">Loading reading lists...</div>
          ) : readingLists.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center shadow-sm">
              <GraduationCap className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-white">No Reading Lists Curated</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Create subject-wise essential textbook lists to guide your students directly in their portal.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-md hover:bg-amber-500 transition-colors"
              >
                Create First List
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {readingLists.map((list) => (
                <div
                  key={list.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-lg text-xs font-black">
                          {list.subjectCode}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {list.subjectName}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Semester {list.semester} • Curated by {list.faculty?.name}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteList(list.id)}
                      className="text-slate-400 hover:text-rose-600 p-2 rounded-lg transition-colors self-end sm:self-auto"
                      title="Delete List"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Books inside this list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(list.items || []).map((item: any) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-3"
                      >
                        <div className="w-10 h-14 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                          {item.book?.coverUrl ? (
                            <img src={item.book.coverUrl} alt={item.book.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                              {item.isMandatory ? 'Mandatory' : 'Reference'}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                            {item.book?.title}
                          </h4>
                          <p className="text-[10px] text-slate-400 truncate">by {item.book?.author}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Student Engagement Insights */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <BarChart2 className="h-5 w-5 text-amber-500" />
              <span>Student Engagement</span>
            </h3>

            {engagement.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Engagement data will populate as students check out books from your curated lists.
              </div>
            ) : (
              <div className="space-y-4">
                {engagement.map((eng, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span>{eng.subjectCode}</span>
                      <span className="text-amber-600 dark:text-amber-400">{eng.totalBorrowCount} Loans</span>
                    </div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{eng.subjectName}</div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-amber-200/40 dark:border-amber-900/30">
                      <span>Assigned Books: <strong>{eng.totalBooks}</strong></span>
                      <span>Active Readers: <strong>{eng.activeStudentReaders}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Acquisition Committee Notice */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-sm">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
              <Building2 className="h-4 w-4" />
              <span>Library Acquisition Desk</span>
            </div>
            <h4 className="text-sm font-bold">Need new titles for upcoming syllabus?</h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Faculty can recommend new print or digital textbook procurement directly to the college library committee.
            </p>
            <button
              onClick={() => setShowRecommendModal(true)}
              className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs shadow-md transition-colors"
            >
              Submit Recommendation Form
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create Reading List */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Curate Course Reading List</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateList} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., CS-601"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Artificial Intelligence & Neural Networks"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* Book Selection Multi-checkbox */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Select Textbooks ({selectedBookIds.length} selected)
                </label>
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl max-h-56 overflow-y-auto p-2 space-y-1.5 bg-slate-50 dark:bg-slate-800/40">
                  {availableBooks.map((b) => {
                    const isSelected = selectedBookIds.includes(b.id);
                    return (
                      <div
                        key={b.id}
                        onClick={() => toggleBookSelection(b.id)}
                        className={`p-2.5 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 font-bold'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="text-slate-900 dark:text-white">{b.title}</span>
                          <span className="text-slate-400 font-normal"> by {b.author}</span>
                        </div>
                        <span
                          className={`h-4 w-4 rounded flex items-center justify-center border ${
                            isSelected ? 'bg-amber-600 text-white border-amber-600' : 'border-slate-300'
                          }`}
                        >
                          {isSelected ? '✓' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={listCreating}
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {listCreating ? 'Creating...' : 'Publish Reading List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Suggest Book Purchase */}
      {showRecommendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Suggest Book Purchase</h3>
              <button
                onClick={() => setShowRecommendModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecommendBook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Learning with PyTorch"
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Author(s) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eli Stevens, Luca Antiga"
                  value={recAuthor}
                  onChange={(e) => setRecAuthor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">ISBN</label>
                  <input
                    type="text"
                    placeholder="978-1617295263"
                    value={recIsbn}
                    onChange={(e) => setRecIsbn(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Est. Price (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1200"
                    value={recPrice}
                    onChange={(e) => setRecPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Academic Justification</label>
                <textarea
                  rows={3}
                  placeholder="Explain why this textbook is required for course curriculum or project work..."
                  value={recReason}
                  onChange={(e) => setRecReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRecommendModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {recSubmitting ? 'Submitting...' : 'Submit to Library Committee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
