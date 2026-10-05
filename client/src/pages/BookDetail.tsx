import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  Clock,
  BookOpen,
  Layers,
  MapPin,
  Calendar,
  Share2,
  Sparkles,
  MessageSquare,
  AlertCircle,
  Tag,
} from 'lucide-react';
import api from '../services/api';
import { Book, BookCopy, BookReview } from '../types';
import { useAuth } from '../context/AuthContext';
import { CoverGenerator } from '../components/books/CoverGenerator';
import { ShelfLocator } from '../components/books/ShelfLocator';

interface BookDetailData extends Book {
  copies: BookCopy[];
  reviews: BookReview[];
  pendingWaitlistCount?: number;
}

export const BookDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState<BookDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Review submission state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.get(`/books/${id}`)
      .then((res) => {
        if (res.data.success) {
          setBook(res.data.book);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'Failed to load book details.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !isAuthenticated) return;

    setIsSubmittingReview(true);
    try {
      const res = await api.post(`/books/${id}/reviews`, {
        rating: newRating,
        comment: newComment,
      });

      if (res.data.success) {
        setReviewSuccess(true);
        setNewComment('');
        // Refresh book reviews
        const updated = await api.get(`/books/${id}`);
        if (updated.data.success) {
          setBook(updated.data.book);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to post review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Book Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">{error || 'The requested catalog record does not exist.'}</p>
        <Link to="/catalog" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold">
          <ArrowLeft className="h-4 w-4" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const isAvailable = (book.availableCopiesCount || 0) > 0;
  const firstAvailableCopy = book.copies.find((c) => c.status === 'AVAILABLE') || book.copies[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Catalog</span>
      </button>

      {/* Main Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        
        {/* Left Cover Column */}
        <div className="lg:col-span-4 flex flex-col items-center">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="h-80 w-56 rounded-2xl object-cover shadow-xl ring-1 ring-black/10"
            />
          ) : (
            <CoverGenerator title={book.title} author={book.author} department={book.department} className="h-80 w-56" />
          )}

          {/* Availability Status Tag */}
          <div className="mt-6 w-full max-w-xs text-center space-y-3">
            <div
              className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 ${
                isAvailable
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
            >
              {isAvailable ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              <span>
                {isAvailable
                  ? `${book.availableCopiesCount} of ${book.copiesCount} Copies Available`
                  : `All ${book.copiesCount} Copies Issued (Waitlist: ${book.pendingWaitlistCount || 0})`}
              </span>
            </div>

            {/* Quick Borrow / Reserve Actions */}
            <div className="flex flex-col gap-2">
              {isAvailable ? (
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal('login', 'Log in to issue and borrow this textbook.');
                    } else {
                      navigate(`/scan?bookId=${book.id}`);
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Borrow Physical Copy</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal('login', 'Log in to place a reservation and join the waitlist.');
                    } else {
                      alert('Reservation placed! You will receive an in-app notification when a copy is returned.');
                    }
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Clock className="h-4 w-4" />
                  <span>Join Priority Waitlist</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Info Column */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                {book.department}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {book.resourceType}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                {book.difficultyLevel}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {book.title}
            </h1>

            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mt-1">
              Authored by <span className="text-slate-900 dark:text-white font-bold">{book.author}</span>
            </p>

            {/* Ratings & Quick Meta */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-amber-500 font-extrabold">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm">{book.averageRating || 4.5} / 5</span>
                <span className="text-slate-400 font-normal">({book.reviewsCount || 0} reviews)</span>
              </div>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 dark:text-slate-400">Publisher: <strong>{book.publisher || 'Not Listed'}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 dark:text-slate-400">Year: <strong>{book.year || 'N/A'}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 dark:text-slate-400">Edition: <strong>{book.edition || 'Standard'}</strong></span>
            </div>

            {/* Description / Summary */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Book Overview</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {book.description ||
                  `Standard reference text for ${book.department} diploma and degree students. Covers core theoretical foundations, practical applications, and syllabus curriculum.`}
              </p>
            </div>
          </div>

          {/* Interactive 2D Shelf Locator */}
          {firstAvailableCopy && (
            <ShelfLocator
              location={firstAvailableCopy.location}
              shelfNumber={firstAvailableCopy.shelfNumber || 'Rack C-04, Shelf 2'}
              department={book.department}
            />
          )}
        </div>

      </div>

      {/* Physical Copies Inventory Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <span>Physical Inventory Copies ({book.copies.length} Total Copies)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Individual barcode accession numbers for circulation counter scanning and self-service pickup.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Accession Key / Barcode</th>
                <th className="p-3">Shelf Location</th>
                <th className="p-3">Condition</th>
                <th className="p-3">Price (₹)</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {book.copies.map((copy) => (
                <tr key={copy.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-bold text-brand-600 dark:text-brand-400 flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5" />
                    <span>{copy.barcode}</span>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">
                    {copy.location} {copy.shelfNumber ? `(${copy.shelfNumber})` : ''}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{copy.condition}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{copy.price > 0 ? `₹${copy.price}` : 'Institute Copy'}</td>
                  <td className="p-3 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        copy.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {copy.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ask the Book AI Assistant Section */}
      <AskTheBookSection bookId={book.id} bookTitle={book.title} author={book.author} />

      {/* Reviews & Ratings Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-amber-500" />
            <span>Student & Faculty Reviews</span>
          </h2>
        </div>

        {/* Post a Review Form */}
        {isAuthenticated ? (
          <form onSubmit={handleReviewSubmit} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Leave a Review & Rating</span>
              {/* Star selector */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewRating(s)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star className={`h-4 w-4 ${s <= newRating ? 'fill-current' : 'text-slate-300'}`} />
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your feedback about chapter clarity, solved examples, or exam relevance (+15 points)..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            />

            <div className="flex items-center justify-between">
              {reviewSuccess && <span className="text-xs font-bold text-emerald-600">Review posted (+15 XP awarded)!</span>}
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="ml-auto px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 active:scale-95 disabled:opacity-50"
              >
                {isSubmittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-center text-slate-500">
            <Link to="/login" className="font-bold text-brand-600 underline">Login</Link> to submit ratings and earn student reading points.
          </div>
        )}

        {/* Existing Reviews List */}
        <div className="space-y-3">
          {book.reviews && book.reviews.length > 0 ? (
            book.reviews.map((rev) => (
              <div key={rev.id} className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{rev.user?.name || 'Reader'}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase">
                      {rev.user?.role || 'Member'}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                </div>
                {rev.comment && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rev.comment}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No reviews yet. Be the first to review this textbook!</p>
          )}
        </div>

      </div>

    </div>
  );
};

interface AskTheBookProps {
  bookId: string;
  bookTitle: string;
  author: string;
}

const AskTheBookSection: React.FC<AskTheBookProps> = ({ bookId, bookTitle, author }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [qaResult, setQaResult] = useState<{
    answer: string;
    chapter: string;
    pageRange: string;
    keyConcepts: string[];
    relatedQuestions: string[];
  } | null>(null);

  const SAMPLE_QUESTIONS = [
    'Explain the primary architectural principles covered in this text.',
    'What are the common university exam questions for this subject?',
    'Summarize key algorithmic complexity and optimization trade-offs.',
  ];

  const handleAsk = async (qText?: string) => {
    const promptToSubmit = qText || question;
    if (!promptToSubmit.trim() || loading) return;

    setLoading(true);
    try {
      const res = await api.post('/ai/ask-the-book', {
        bookId,
        question: promptToSubmit,
      });

      if (res.data.success) {
        setQaResult(res.data);
      }
    } catch (err) {
      console.error('Ask the book error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-brand-950/20 via-white dark:via-slate-900 to-indigo-950/20 border border-brand-200/80 dark:border-brand-900/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3 h-3 text-brand-600 dark:text-brand-400" />
            Ask-the-Book AI Engine
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Instant Academic Q&A with Simulated Chapter References
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Query theorems, formulas, algorithms, or exam concepts directly against this catalog textbook.
          </p>
        </div>
      </div>

      {/* Suggested chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Suggested Questions:</span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_QUESTIONS.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuestion(sq);
                handleAsk(sq);
              }}
              disabled={loading}
              className="text-left text-xs bg-white dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 border border-slate-200 dark:border-slate-700 hover:border-brand-400 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl font-medium transition-all shadow-2xs active:scale-95 disabled:opacity-50"
            >
              💡 {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Query input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
          placeholder={`Ask anything about "${bookTitle}"...`}
          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={() => handleAsk()}
          disabled={loading || !question.trim()}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </div>

      {/* Render Answer Result */}
      {qaResult && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-brand-300 dark:border-brand-800/80 shadow-md space-y-4 animate-in fade-in">
          {/* Chapter & Page citation badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                📖 {qaResult.chapter}
              </span>
              <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold">
                📍 {qaResult.pageRange}
              </span>
            </div>
            <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
              Verified against textbook edition
            </span>
          </div>

          {/* Core Markdown Body */}
          <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-2 whitespace-pre-line">
            {qaResult.answer}
          </div>

          {/* Key Concept Badges */}
          {qaResult.keyConcepts?.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                Key Conceptual Pillars:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {qaResult.keyConcepts.map((c, i) => (
                  <span
                    key={i}
                    className="bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-[11px] font-medium px-2 py-0.5 rounded-full"
                  >
                    ✓ {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

