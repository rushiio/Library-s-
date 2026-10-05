import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Upload,
  RefreshCw,
  Search,
  Layers,
  GraduationCap,
  Bookmark,
  MapPin,
} from 'lucide-react';
import api from '../services/api';
import { SyllabusUnitMatch } from '../types';

const SAMPLE_SYLLABI = [
  {
    title: 'Computer Networks (Semester 5)',
    dept: 'Computer Engineering',
    content: `Unit 1: Introduction to Computer Networks & Physical Layer
Network Topologies, OSI Reference Model, TCP/IP Protocol Suite, Transmission Media (Twisted pair, Coaxial, Fiber Optics), Switching techniques.

Unit 2: Data Link Layer & Medium Access
Framing, Error Detection and Correction (CRC, Hamming Codes), Flow Control (Stop & Wait, Sliding Window), Multiple Access Protocols (CSMA/CD, CSMA/CA).

Unit 3: Network Layer & IP Addressing
IPv4 Addressing, Subnetting, Classless Inter-Domain Routing (CIDR), Routing Algorithms (Distance Vector, Link State Routing, OSPF, BGP).

Unit 4: Transport Layer Protocols
Process-to-Process Delivery, UDP Operation, TCP Connection Establishment, TCP Congestion Control and Flow Control mechanisms.

Unit 5: Application Layer & Network Security
DNS, HTTP, HTTPS, FTP, SMTP, Cryptographic Principles, Symmetric & Asymmetric Encryption, Firewalls.`,
  },
  {
    title: 'Operating Systems (Semester 4)',
    dept: 'Computer Engineering',
    content: `Unit 1: OS Structures & Process Management
OS Services, System Calls, Process States, Process Control Block (PCB), Context Switching, Inter-process Communication.

Unit 2: CPU Scheduling & Synchronization
Scheduling Criteria, FCFS, SJF, Priority, Round Robin, Critical Section Problem, Peterson's Solution, Semaphores, Classic Sync Problems.

Unit 3: Deadlocks & Handling Strategies
Deadlock Characterization, Resource Allocation Graphs, Deadlock Prevention, Deadlock Avoidance (Banker's Algorithm), Deadlock Detection & Recovery.

Unit 4: Memory Management & Virtual Memory
Logical vs Physical Address Space, Paging, Segmentation, Demand Paging, Page Replacement Algorithms (FIFO, LRU, Optimal), Thrashing.

Unit 5: File Systems & I/O Systems
File Concepts, Directory Structures, Allocation Methods, Free Space Management, Disk Scheduling (FCFS, SSTF, SCAN, LOOK).`,
  },
  {
    title: 'Database Management Systems (Semester 4)',
    dept: 'Information Technology',
    content: `Unit 1: Database Architecture & ER Modeling
DBMS Architecture, 3-tier schema architecture, Data Independence, Entity-Relationship (ER) model, Extended ER features.

Unit 2: Relational Model & SQL Querying
Relational Algebra, SQL DDL/DML, Nested subqueries, Joins, Views, Triggers, Integrity Constraints.

Unit 3: Relational Database Design & Normalization
Functional Dependencies, Normal Forms (1NF, 2NF, 3NF, BCNF, 4NF), Lossless Join Decomposition, Dependency Preservation.

Unit 4: Transaction Management & Concurrency
ACID Properties, Serializability, Concurrency Control Protocols (Two-Phase Locking, Timestamp Ordering), Deadlock Handling.

Unit 5: Indexing, Storage & NoSQL Concepts
B+ Trees, Hashing techniques, RAID levels, Introduction to Document & Key-Value NoSQL databases.`,
  },
];

export const SyllabusMatcher: React.FC = () => {
  const [syllabusText, setSyllabusText] = useState(SAMPLE_SYLLABI[0].content);
  const [department, setDepartment] = useState('Computer Engineering');
  const [matchedUnits, setMatchedUnits] = useState<SyllabusUnitMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const navigate = useNavigate();

  const handleMatchSyllabus = async (customText?: string) => {
    const textToMatch = customText || syllabusText;
    if (!textToMatch.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await api.post('/ai/syllabus-matcher', {
        syllabusText: textToMatch,
        department,
      });

      if (res.data.success) {
        setMatchedUnits(res.data.units || []);
      }
    } catch (err) {
      console.error('Syllabus matcher error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (sample: (typeof SAMPLE_SYLLABI)[0]) => {
    setSyllabusText(sample.content);
    setDepartment(sample.dept);
    handleMatchSyllabus(sample.content);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-brand-900/40">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold uppercase mb-4 tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Curriculum Alignment AI
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Syllabus to Catalog Text Matcher
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Paste your university curriculum or course outline. Our neural matcher identifies exact unit coverage across thousands of library textbooks and reference guides.
          </p>
        </div>
      </div>

      {/* Quick Sample Presets */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2.5">
          Try standard engineering syllabi:
        </h3>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_SYLLABI.map((sample, i) => (
            <button
              key={i}
              onClick={() => handleLoadSample(sample)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-all shadow-2xs active:scale-95"
            >
              📄 {sample.title}
            </button>
          ))}
        </div>
      </div>

      {/* Syllabus Textarea Input Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Paste Course Units / Module Descriptions
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Department:</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-900 dark:text-white"
            >
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
            </select>
          </div>
        </div>

        <textarea
          rows={6}
          value={syllabusText}
          onChange={(e) => setSyllabusText(e.target.value)}
          placeholder="Paste course modules (e.g., Unit 1: Introduction..., Unit 2: Memory Management...)"
          className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 transition-all leading-relaxed"
        />

        <div className="flex justify-end">
          <button
            onClick={() => handleMatchSyllabus()}
            disabled={loading || !syllabusText.trim()}
            className="py-2.5 px-6 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Matching Against DB...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Analyze & Match Library Books
              </>
            )}
          </button>
        </div>
      </div>

      {/* Matched Results Section */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm font-semibold">Scanning 2,000+ catalog titles for syllabus coverage...</p>
        </div>
      ) : hasSearched && matchedUnits.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-600" />
              Module-by-Module Text Mappings ({matchedUnits.length} Units)
            </h2>
          </div>

          <div className="space-y-6">
            {matchedUnits.map((unit) => (
              <div
                key={unit.unitNumber}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4"
              >
                {/* Unit Title */}
                <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      Module {unit.unitNumber}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {unit.unitTitle}
                    </h3>
                  </div>

                  {/* Topics covered pill list */}
                  <div className="flex flex-wrap gap-1.5 max-w-md">
                    {unit.topics.slice(0, 4).map((top, tIdx) => (
                      <span
                        key={tIdx}
                        className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-md"
                      >
                        {top}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Matched Books for this Unit */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {unit.matchedBooks.map((item, bIdx) => (
                    <div
                      key={bIdx}
                      className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-brand-500 transition-colors relative"
                    >
                      {/* Match Score Badge */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.matchType === 'Primary Textbook'
                              ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          }`}
                        >
                          {item.matchType}
                        </span>
                        <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          {item.matchScore}% Match
                        </span>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug line-clamp-2">
                          {item.book.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          By {item.book.author}
                        </p>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {item.book.availableCopiesCount > 0
                              ? `✅ ${item.book.availableCopiesCount} Available`
                              : '⏳ Waitlist'}
                          </span>
                          <span className="text-slate-400 truncate max-w-[120px]">
                            📍 {item.book.shelfLocation}
                          </span>
                        </div>

                        <button
                          onClick={() => navigate(`/book/${item.book.id}`)}
                          className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 hover:bg-brand-600 hover:text-white border border-slate-200 dark:border-slate-700 hover:border-brand-600 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                        >
                          View in Catalog <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SyllabusMatcher;
