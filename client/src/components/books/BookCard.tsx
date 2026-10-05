import React from 'react';
import { Link } from 'react-router-dom';
import { Star, CheckCircle2, Clock, BookOpen, Layers } from 'lucide-react';
import { Book } from '../../types';
import { CoverGenerator } from './CoverGenerator';

interface BookCardProps {
  book: Book;
  viewMode?: 'grid' | 'list';
}

export const BookCard: React.FC<BookCardProps> = ({ book, viewMode = 'grid' }) => {
  const isAvailable = (book.availableCopiesCount || 0) > 0;

  const getDifficultyBadge = (level: string) => {
    switch (level) {
      case 'Advanced':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Intermediate':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  if (viewMode === 'list') {
    return (
      <div className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/50 hover:shadow-md transition-all">
        <div className="flex items-start gap-4">
          <Link to={`/book/${book.id}`} className="shrink-0 group-hover:scale-105 transition-transform">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-28 w-20 rounded-xl object-cover shadow-md"
              />
            ) : (
              <CoverGenerator title={book.title} author={book.author} department={book.department} className="h-28 w-20" />
            )}
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {book.department}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getDifficultyBadge(book.difficultyLevel)}`}>
                {book.difficultyLevel}
              </span>
              {book.year && (
                <span className="text-[11px] text-slate-400 font-medium">({book.year})</span>
              )}
            </div>

            <Link to={`/book/${book.id}`}>
              <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                {book.title}
              </h3>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              by <span className="text-slate-700 dark:text-slate-200 font-semibold">{book.author}</span> {book.publisher ? `• ${book.publisher}` : ''}
            </p>

            <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{book.averageRating || 4.5}</span>
                <span className="text-slate-400 font-normal">({book.reviewsCount || 0})</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span>{book.copiesCount || 0} Total Copies</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action & Availability */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
              isAvailable
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            }`}
          >
            {isAvailable ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
            <span>{isAvailable ? `Available (${book.availableCopiesCount})` : 'All Issued'}</span>
          </span>

          <Link
            to={`/book/${book.id}`}
            className="inline-flex items-center justify-center rounded-xl bg-brand-600 hover:bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
          >
            View Details
          </Link>
        </div>
      </div>
    );
  }

  // Grid View (Amazon/Goodreads card)
  return (
    <div className="group flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 hover:border-brand-500/50 hover:shadow-xl hover:-translate-y-1 transition-all">
      <div>
        {/* Cover Art Centered */}
        <div className="relative flex justify-center mb-4">
          <Link to={`/book/${book.id}`} className="group-hover:scale-105 transition-transform duration-300">
            {book.coverUrl ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                className="h-48 w-32 rounded-2xl object-cover shadow-md"
              />
            ) : (
              <CoverGenerator title={book.title} author={book.author} department={book.department} className="h-48 w-32" />
            )}
          </Link>

          {/* Floating Availability Badge */}
          <div className="absolute top-2 right-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm backdrop-blur-md ${
                isAvailable
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-amber-500/90 text-white'
              }`}
            >
              {isAvailable ? `${book.availableCopiesCount} Avail` : 'Waitlist'}
            </span>
          </div>
        </div>

        {/* Metadata */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 line-clamp-1">
              {book.department}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getDifficultyBadge(book.difficultyLevel)}`}>
              {book.difficultyLevel}
            </span>
          </div>

          <Link to={`/book/${book.id}`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-2 leading-tight">
              {book.title}
            </h3>
          </Link>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">
            {book.author}
          </p>
        </div>
      </div>

      {/* Footer Rating & Details Link */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-amber-500 font-bold">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span>{book.averageRating || 4.5}</span>
        </div>

        <Link
          to={`/book/${book.id}`}
          className="text-xs font-bold text-brand-600 dark:text-brand-400 group-hover:underline"
        >
          Details →
        </Link>
      </div>
    </div>
  );
};
