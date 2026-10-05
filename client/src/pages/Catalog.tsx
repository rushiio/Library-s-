import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { Book } from '../types';
import { BookCard } from '../components/books/BookCard';

export const Catalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [books, setBooks] = useState<Book[]>([]);
  const [departments, setDepartments] = useState<{ name: string; count: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter & pagination states
  const searchQuery = searchParams.get('q') || '';
  const selectedDept = searchParams.get('department') || 'ALL';
  const selectedDifficulty = searchParams.get('difficulty') || 'ALL';
  const selectedAvailability = searchParams.get('availability') || 'all';
  const selectedSort = searchParams.get('sort') || 'title_asc';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 24,
    totalBooks: 0,
    totalPages: 1,
  });

  // Fetch departments list
  useEffect(() => {
    api.get('/books/departments').then((res) => {
      if (res.data.success) {
        setDepartments(res.data.departments);
      }
    }).catch(console.error);
  }, []);

  // Fetch books matching current filters
  useEffect(() => {
    setIsLoading(true);
    api.get('/books', {
      params: {
        page: currentPage,
        limit: 24,
        q: searchQuery,
        department: selectedDept,
        difficulty: selectedDifficulty,
        availability: selectedAvailability,
        sort: selectedSort,
      },
    })
      .then((res) => {
        if (res.data.success) {
          setBooks(res.data.books);
          setPagination(res.data.pagination);
        }
      })
      .catch((err) => {
        console.error('Catalog fetch error:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [searchQuery, selectedDept, selectedDifficulty, selectedAvailability, selectedSort, currentPage]);

  const updateFilters = (newParams: Record<string, string>) => {
    const updated = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === 'ALL' || v === '' || v === 'all' && k === 'availability') {
        updated.delete(k);
      } else {
        updated.set(k, v);
      }
    });
    // Reset to page 1 on filter change
    if (!('page' in newParams)) {
      updated.set('page', '1');
    }
    setSearchParams(updated);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Library Books Catalog</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold border border-brand-200 dark:border-brand-800">
              {pagination.totalBooks.toLocaleString()} Titles
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse our comprehensive college collection or search by title, author, and branch.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => updateFilters({ q: e.target.value })}
            placeholder="Filter catalog titles..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => updateFilters({ q: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm sticky top-24">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              <span>Filters</span>
            </h3>
            {(selectedDept !== 'ALL' || selectedDifficulty !== 'ALL' || selectedAvailability !== 'all' || searchQuery) && (
              <button
                onClick={clearFilters}
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Reset All
              </button>
            )}
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Availability</label>
            <div className="space-y-1.5">
              <button
                onClick={() => updateFilters({ availability: 'all' })}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  selectedAvailability === 'all'
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                All Books
              </button>
              <button
                onClick={() => updateFilters({ availability: 'available' })}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  selectedAvailability === 'available'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                🟢 Available on Shelf Now
              </button>
            </div>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Department / Branch</label>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => updateFilters({ department: 'ALL' })}
                className={`w-full text-left flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  selectedDept === 'ALL'
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>All Departments</span>
                <span className="text-[10px] opacity-70">{pagination.totalBooks}</span>
              </button>
              {departments.map((d) => (
                <button
                  key={d.name}
                  onClick={() => updateFilters({ department: d.name })}
                  className={`w-full text-left flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                    selectedDept === d.name
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="line-clamp-1">{d.name}</span>
                  <span className="text-[10px] opacity-70 ml-2">{d.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Difficulty</label>
            <div className="flex flex-wrap gap-1.5">
              {['ALL', ...difficulties].map((diff) => (
                <button
                  key={diff}
                  onClick={() => updateFilters({ difficulty: diff })}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedDifficulty === diff
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Books Grid / List Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Controls Bar (Sort, View Mode, Mobile Filter trigger) */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-sm">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium hidden sm:inline">Sort By:</span>
              <select
                value={selectedSort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1.5 text-xs font-bold text-slate-800 dark:text-slate-200"
              >
                <option value="title_asc">Title (A - Z)</option>
                <option value="title_desc">Title (Z - A)</option>
                <option value="year_desc">Newest Publication</option>
                <option value="year_asc">Oldest Publication</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Loading Skeletons */}
          {isLoading ? (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 rounded-3xl bg-slate-200 dark:bg-slate-800/60 animate-pulse" />
              ))}
            </div>
          ) : books.length > 0 ? (
            <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'} gap-4`}>
              {books.map((book) => (
                <BookCard key={book.id} book={book} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
                <BookOpen className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No books matched your criteria</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                Try searching for a different keyword or removing some filters.
              </p>
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-500 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalBooks} items)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateFilters({ page: String(Math.max(pagination.page - 1, 1)) })}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {pagination.page}
                </div>

                <button
                  onClick={() => updateFilters({ page: String(Math.min(pagination.page + 1, pagination.totalPages)) })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
