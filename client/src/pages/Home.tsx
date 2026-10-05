import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Sparkles,
  Mic,
  BookOpen,
  Compass,
  FileCheck2,
  TrendingUp,
  Bookmark,
  Award,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  LogIn,
  GraduationCap,
  Layers,
  Star,
  Phone,
  Mail,
  AlertCircle,
  HelpCircle,
  Check,
  Users,
  Building2,
  Library,
  QrCode,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CoverGenerator } from '../components/books/CoverGenerator';
import api from '../services/api';

export const Home: React.FC = () => {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Live Database Stats & Landing Data
  const [stats, setStats] = useState({
    totalTitles: 0,
    totalCopies: 0,
    availableCopies: 0,
    totalCategories: 0,
    isLibraryOpen: true,
    timingNote: 'Open Today: 8:00 AM – 8:00 PM',
  });
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [popularThisMonth, setPopularThisMonth] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/books/landing-data');
        if (res.data.success) {
          if (res.data.stats) setStats(res.data.stats);
          if (res.data.newArrivals) setNewArrivals(res.data.newArrivals);
          if (res.data.popularThisMonth) setPopularThisMonth(res.data.popularThisMonth);
          if (res.data.categories) setCategories(res.data.categories);
        }
      } catch (e) {
        console.error('Failed to load live landing data:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/catalog');
    }
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      setIsListening(false);
      navigate(`/catalog?q=${encodeURIComponent(transcript)}`);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const departmentChips = [
    { label: 'Computer', dept: 'Computer Engineering' },
    { label: 'Mechanical', dept: 'Mechanical Engineering' },
    { label: 'Civil', dept: 'Civil Engineering' },
    { label: 'Electrical', dept: 'Electrical Engineering' },
    { label: 'Electronics & TC', dept: 'Electronics and Telecommunication Engineering' },
    { label: 'Engg Science', dept: 'Engineering Science' },
  ];

  const faqs = [
    {
      q: 'How many books can a student borrow at a time?',
      a: 'Registered diploma and degree students can borrow up to 3 books simultaneously for a 14-day loan period. Loans can be renewed up to 3 times online if there is no pending waitlist for that title.',
    },
    {
      q: 'How do I locate a physical book on the library shelves?',
      a: 'Every book page in LibraAI features an interactive 2D Shelf Locator. It highlights the exact floor, section, rack number (e.g. Rack C-04, Shelf 2), and accession barcode for rapid pickup.',
    },
    {
      q: 'What are the overdue fine policies?',
      a: 'Overdue fines are charged at ₹5.00 per day per overdue volume after the due date. Fines can be settled at the circulation counter or reviewed by the Chief Librarian.',
    },
    {
      q: 'How does the study seat reservation system work?',
      a: 'Students can visit the Seat Booking portal to view live 2D floor occupancy across Silent Study, Group Discussion, and Digital Lab zones, and book dedicated study desks.',
    },
    {
      q: 'Can I chat with textbook chapters using Ask-the-Book AI?',
      a: 'Yes! Navigate to any book detail page and use the Ask-the-Book AI assistant to ask exam questions, clarify formulas, and get chapter citations tailored to the college syllabus.',
    },
  ];

  return (
    <div className="space-y-16 pb-12 text-slate-900 dark:text-slate-100">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-6 px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto">
        {/* Welcome Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-900/60 bg-blue-50/90 dark:bg-blue-950/60 px-4 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 shadow-sm mb-5">
          <Library className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>Government Polytechnic College Central Library</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
          Explore College Textbooks & <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500">
            Study with AI Assistance
          </span>
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          Search over 8,000 physical volumes across 6 engineering departments, check real-time shelf availability, reserve books, and study with instant AI chapter explanations.
        </p>

        {/* Central Search Bar */}
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
          <div className="relative flex items-center shadow-xl shadow-blue-500/10 dark:shadow-none rounded-2xl bg-white dark:bg-[#11192e] border-2 border-slate-200 dark:border-slate-800 focus-within:border-blue-500 dark:focus-within:border-blue-500 transition-all overflow-hidden">
            <div className="pl-4 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 8,000+ books by title, author, subject, or ISBN..."
              className="w-full py-4 pl-3 pr-28 text-xs sm:text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none font-medium"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`p-2.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  isListening ? 'bg-rose-50 text-rose-600 animate-bounce' : ''
                }`}
                title="Voice Search"
              >
                <Mic className="h-4 w-4" />
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
              >
                <span>Search</span>
              </button>
            </div>
          </div>
        </form>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-3xl mx-auto">
          <span className="text-xs font-bold text-slate-400">Branches:</span>
          {departmentChips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => navigate(`/catalog?department=${encodeURIComponent(chip.dept)}`)}
              className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#11192e] text-slate-700 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 border border-slate-200/60 dark:border-slate-800 transition-all font-semibold active:scale-95"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Guest CTA Buttons */}
        {!isAuthenticated && (
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={() => openAuthModal('login', 'Sign in to access your bookshelf, borrowings, and seat bookings.')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all active:scale-95"
            >
              <LogIn className="h-4 w-4" />
              <span>Login to Library</span>
            </button>
            <button
              onClick={() => openAuthModal('signup', 'Register for a new student library account to borrow physical and digital books.')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-slate-300 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm bg-white dark:bg-[#0c1324] transition-all shadow-sm active:scale-95"
            >
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <span>Student Registration</span>
            </button>
          </div>
        )}
      </section>

      {/* 2. LIVE DATABASE STATS BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 shadow-sm">
          
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Titles</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalTitles > 0 ? stats.totalTitles.toLocaleString() : '2,299+'}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Distinct verified titles</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <Layers className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Physical Copies</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalCopies > 0 ? stats.totalCopies.toLocaleString() : '8,246'}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.availableCopies > 0 ? `${stats.availableCopies.toLocaleString()} ready on shelf` : 'Full inventory indexed'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
              <Building2 className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Branches</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalCategories > 0 ? stats.totalCategories : 6} Departments
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Engineering & Sciences</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] border border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Library Status</span>
            </div>
            <div className="flex items-center gap-2 text-sm sm:text-base font-black text-slate-900 dark:text-white">
              <span className={`h-2.5 w-2.5 rounded-full ${stats.isLibraryOpen ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>{stats.isLibraryOpen ? 'Open Now' : 'Closed'}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5 truncate">{stats.timingNote}</div>
          </div>

        </div>
      </section>

      {/* 3. NEW ARRIVALS ROW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span>New Arrivals in Library</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Recently cataloged curriculum textbooks & engineering reference editions
            </p>
          </div>
          <Link
            to="/catalog?sort=newest"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {newArrivals.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {newArrivals.slice(0, 6).map((book) => {
              const available = book.availableCopiesCount ?? 1;
              const isAvailable = available > 0;

              return (
                <div
                  key={book.id}
                  onClick={() => navigate(`/book/${book.id}`)}
                  className="group cursor-pointer bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full h-44 rounded-xl overflow-hidden mb-3 shadow-sm group-hover:scale-[1.02] transition-transform">
                      <CoverGenerator title={book.title} author={book.author} department={book.department} />
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-0.5 truncate">
                      {book.department?.replace(' Engineering', '')}
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">{book.author}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {isAvailable ? `Available (${available})` : 'Join Waitlist'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No new arrivals listed yet.
          </div>
        )}
      </section>

      {/* 4. POPULAR THIS MONTH ROW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span>Popular This Month</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Most requested and checked-out textbooks by students this semester
            </p>
          </div>
          <Link
            to="/catalog?sort=popular"
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <span>View All Popular</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {popularThisMonth.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
            {popularThisMonth.slice(0, 6).map((book) => {
              const available = book.availableCopiesCount ?? 1;
              const isAvailable = available > 0;

              return (
                <div
                  key={book.id}
                  onClick={() => navigate(`/book/${book.id}`)}
                  className="group cursor-pointer bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full h-44 rounded-xl overflow-hidden mb-3 shadow-sm group-hover:scale-[1.02] transition-transform">
                      <CoverGenerator title={book.title} author={book.author} department={book.department} />
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-0.5 truncate">
                      {book.department?.replace(' Engineering', '')}
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">{book.author}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isAvailable
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {isAvailable ? `Available (${available})` : 'Join Waitlist'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#0c1324] border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
            No popular book statistics generated yet.
          </div>
        )}
      </section>

      {/* 5. BROWSE BY CATEGORY GRID */}
      <section id="categories" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <span>Browse by Academic Category</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Explore dedicated catalog sections curated for engineering disciplines
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.name}
              onClick={() => navigate(`/catalog?department=${encodeURIComponent(cat.name)}`)}
              className="group cursor-pointer p-5 rounded-3xl bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-blue-500/80 transition-all shadow-xs hover:shadow-md flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 group-hover:scale-105 transition-transform">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {cat.count.toLocaleString()} Books in Catalog
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </section>

      {/* 6. "HOW IT WORKS" STRIP (Visual 4-Step Flow) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-900 via-[#0a101f] to-slate-900 rounded-3xl p-6 sm:p-10 text-white border border-slate-800 shadow-xl">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-black text-white">How LibraAI Works</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Seamless 4-step workflow from discovery to AI-assisted study
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center">1</div>
              <h3 className="text-sm font-bold text-white">Search & Discover</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Query 8,000+ textbooks by title, author, syllabus unit, or ISBN with live copy availability.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">2</div>
              <h3 className="text-sm font-bold text-white">2D Shelf Locator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                View the exact floor rack, shelf row, and accession barcode before walking to the stack.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center">3</div>
              <h3 className="text-sm font-bold text-white">Scan & Borrow</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Present your student ID or use the mobile camera barcode scanner at the circulation counter.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="h-8 w-8 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center">4</div>
              <h3 className="text-sm font-bold text-white">AI Study Companion</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Chat with textbook chapters, match curriculum units, and book silent study desks online.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LIBRARY INFO CARD (Timings, Location, Contact, Rules) */}
      <section id="library-info" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#0c1324] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span>Library Information & Circulation Rules</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Service hours, location details, loan limits, and campus code of conduct
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hours & Location */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                  <Clock className="h-4 w-4" /> Timings & Schedule
                </div>
                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <p><strong>Mon – Fri:</strong> 8:00 AM – 8:00 PM</p>
                  <p><strong>Saturday:</strong> 9:00 AM – 4:00 PM</p>
                  <p><strong>Sunday / Holidays:</strong> Closed</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold pt-1">
                    * Reading Halls open 24/7 during Exam Weeks
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#11192e] border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                  <MapPin className="h-4 w-4" /> Location & Contact
                </div>
                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <p><strong>Location:</strong> Central Academic Block, 2nd Floor</p>
                  <p><strong>Email:</strong> library@college.edu</p>
                  <p><strong>Phone:</strong> +91 (020) 2550-7000 Ext: 240</p>
                </div>
              </div>
            </div>

            {/* Loan Period & Rules */}
            <div className="md:col-span-2 p-5 rounded-2xl bg-slate-50 dark:bg-[#11192e] border border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4" /> Circulation Policy & Overdue Fines
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
                <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-[#0c1324] border border-slate-200/60 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white">Student Borrowing</h4>
                  <ul className="space-y-1 list-disc pl-4 text-slate-500 dark:text-slate-400">
                    <li>Max 3 books checked out at one time.</li>
                    <li>14-day standard loan duration.</li>
                    <li>Up to 3 renewals if no active reservation exists.</li>
                  </ul>
                </div>

                <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-[#0c1324] border border-slate-200/60 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white">Faculty & Staff</h4>
                  <ul className="space-y-1 list-disc pl-4 text-slate-500 dark:text-slate-400">
                    <li>Max 6 books checked out at one time.</li>
                    <li>30-day loan duration for course preparation.</li>
                    <li>Curate recommended reading lists for subjects.</li>
                  </ul>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs">
                <strong>Overdue Fine Policy:</strong> ₹5.00 per day per book is levied automatically on overdue checkouts. Lost or damaged books must be replaced with the same edition or paid in full at counter.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. HELP & FAQ SECTION */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            <span>Frequently Asked Questions</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Quick answers about borrowing, renewals, AI study features, and digital access
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0c1324] overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-[#11192e] transition-colors"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 text-base">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. SIGN UP CALL TO ACTION BANNER */}
      {!isAuthenticated && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-8 sm:p-12 text-white shadow-2xl text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                Ready to Access 8,000+ Library Resources?
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                Create your student library account in under 60 seconds. Borrow physical textbooks, reserve reading desks, and get instant AI study roadmaps.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => openAuthModal('signup', 'Create your student account for digital library privileges.')}
                  className="px-6 py-3.5 rounded-2xl bg-white text-blue-700 font-bold text-xs sm:text-sm shadow-lg hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-2"
                >
                  <GraduationCap className="h-4 w-4" />
                  <span>Register Student Account</span>
                </button>
                <button
                  onClick={() => openAuthModal('login', 'Sign in with your email and password.')}
                  className="px-6 py-3.5 rounded-2xl border border-white/40 hover:border-white text-white font-bold text-xs sm:text-sm hover:bg-white/10 transition-all active:scale-95"
                >
                  <span>Existing Member Login</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 10. FOOTER */}
      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#0a101f]/50 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-200 dark:border-slate-800">
            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <BookOpen className="h-5 w-5" />
                </div>
                <span className="text-xl font-black text-slate-900 dark:text-white">Libra<span className="text-blue-500">AI</span></span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Next-generation college library management system powered by semantic AI, instant catalog search, and live desk reservations.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">Library Discovery</h4>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li><Link to="/catalog" className="hover:text-blue-600 dark:hover:text-blue-400">Browse Full Catalog</Link></li>
                <li><Link to="/catalog?sort=newest" className="hover:text-blue-600 dark:hover:text-blue-400">New Arrivals</Link></li>
                <li><Link to="/catalog?sort=popular" className="hover:text-blue-600 dark:hover:text-blue-400">Popular Books</Link></li>
                <li><a href="#categories" className="hover:text-blue-600 dark:hover:text-blue-400">Engineering Categories</a></li>
              </ul>
            </div>

            {/* AI & Digital Services */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">Digital Services</h4>
              <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <li><Link to="/seats" className="hover:text-blue-600 dark:hover:text-blue-400">Study Seat Booking</Link></li>
                <li><Link to="/learning-path" className="hover:text-blue-600 dark:hover:text-blue-400">AI Learning Paths</Link></li>
                <li><Link to="/syllabus-matcher" className="hover:text-blue-600 dark:hover:text-blue-400">Syllabus Matcher</Link></li>
                <li><a href="#library-info" className="hover:text-blue-600 dark:hover:text-blue-400">Library Rules & Fines</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-3">Campus Contact</h4>
              <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-blue-500" /> Academic Block, 2nd Floor</p>
                <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-blue-500" /> library@college.edu</p>
                <p className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-blue-500" /> Mon–Fri: 8:00 AM – 8:00 PM</p>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
            <div>© {new Date().getFullYear()} Government Polytechnic College. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Library Code of Conduct</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
