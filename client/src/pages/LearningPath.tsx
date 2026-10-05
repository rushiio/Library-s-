import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Search,
  Filter,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';
import api from '../services/api';
import { LearningPathResult, LearningStage } from '../types';

const PRESET_GOALS = [
  {
    title: 'Full Stack Web Developer',
    dept: 'Computer Engineering',
    desc: 'HTML5/React, Node.js, Database Systems, System Design & Cloud',
    icon: '💻',
  },
  {
    title: 'Data Scientist & AI Engineer',
    dept: 'Computer Engineering',
    desc: 'Linear Algebra, Python Data Science, Machine Learning & Neural Networks',
    icon: '📊',
  },
  {
    title: 'Robotics & Automation Specialist',
    dept: 'Mechanical Engineering',
    desc: 'Microcontrollers, Sensor Interfacing, Kinematics & PLC Control',
    icon: '🤖',
  },
  {
    title: 'VLSI & Embedded Systems Engineer',
    dept: 'Electrical Engineering',
    desc: 'Digital Circuit Design, Verilog/VHDL, ARM Processors & RTOS',
    icon: '⚡',
  },
  {
    title: 'Cybersecurity & Network Defense',
    dept: 'Information Technology',
    desc: 'TCP/IP Protocols, Cryptography, Ethical Hacking & Security Audits',
    icon: '🛡️',
  },
];

export const LearningPath: React.FC = () => {
  const [goal, setGoal] = useState('Full Stack Web Developer');
  const [department, setDepartment] = useState('Computer Engineering');
  const [semester, setSemester] = useState(6);
  const [roadmap, setRoadmap] = useState<LearningPathResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const navigate = useNavigate();

  const handleGenerateRoadmap = async (customGoal?: string, customDept?: string) => {
    const targetGoal = customGoal || goal;
    const targetDept = customDept || department;

    setLoading(true);
    try {
      const res = await api.post('/ai/learning-path', {
        goal: targetGoal,
        department: targetDept,
        semester,
      });

      if (res.data.success) {
        setRoadmap(res.data);
      }
    } catch (err) {
      console.error('Learning path error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleGenerateRoadmap();
  }, []);

  const toggleStageCompletion = (stageNum: number) => {
    setCompletedStages((prev) =>
      prev.includes(stageNum) ? prev.filter((s) => s !== stageNum) : [...prev, stageNum]
    );
  };

  const calculateProgress = () => {
    if (!roadmap?.stages.length) return 0;
    return Math.round((completedStages.length / roadmap.stages.length) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-brand-800/40">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-bold uppercase mb-4 tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            AI Career Pathway Generator
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Tailored Engineering Reading Roadmaps
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Transform any career ambition or academic target into a sequenced, semester-aligned study plan mapped directly to physical library books and e-resources.
          </p>
        </div>
      </div>

      {/* Preset Career Chips */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Popular Industry Pathways:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRESET_GOALS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setGoal(preset.title);
                setDepartment(preset.dept);
                handleGenerateRoadmap(preset.title, preset.dept);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all relative group flex flex-col justify-between ${
                goal === preset.title
                  ? 'bg-white dark:bg-slate-900 border-brand-500 shadow-md ring-2 ring-brand-500/20'
                  : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-brand-400 hover:shadow-xs'
              }`}
            >
              <div>
                <span className="text-2xl mb-2 block">{preset.icon}</span>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs leading-snug">
                  {preset.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {preset.desc}
                </p>
              </div>
              <span className="mt-3 text-[10px] font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Explore Plan <ArrowRight className="w-3 h-3" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Roadmap Generator Input */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerateRoadmap();
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end"
        >
          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Target Career / Skill Objective
            </label>
            <div className="relative">
              <Compass className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g., Deep Learning Specialist, Cloud Architect..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
            >
              <option value="Computer Engineering">Computer Engineering</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Roadmap
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Progress & Milestone Overview */}
      {roadmap && (
        <div className="bg-brand-50/70 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900/60 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {roadmap.goal}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Department of {roadmap.department} • {roadmap.totalStages} Progressive Stages • ~{roadmap.estimatedTotalHours} Total Study Hours
            </p>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-4 min-w-[240px]">
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>Curriculum Progress</span>
                <span>{calculateProgress()}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-brand-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${calculateProgress()}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-black text-brand-600 dark:text-brand-400">
              {completedStages.length}/{roadmap.stages.length}
            </span>
          </div>
        </div>
      )}

      {/* Sequenced Roadmap Stages Timeline */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-600" />
          <p className="text-sm font-semibold">Synthesizing personalized academic milestones...</p>
        </div>
      ) : (
        <div className="space-y-8 relative before:absolute before:inset-0 before:left-6 sm:before:left-8 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {roadmap?.stages.map((stage) => {
            const isCompleted = completedStages.includes(stage.stageNumber);

            return (
              <div key={stage.stageNumber} className="relative pl-14 sm:pl-20">
                {/* Milestone Step Number Badge */}
                <button
                  onClick={() => toggleStageCompletion(stage.stageNumber)}
                  title="Click to toggle completion status"
                  className={`absolute left-0 top-0 w-12 sm:w-16 h-12 sm:h-16 rounded-2xl flex items-center justify-center font-black text-base sm:text-lg border-2 transition-all shadow-md group ${
                    isCompleted
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-900 border-brand-500 text-brand-600 dark:text-brand-400 hover:scale-105'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />
                  ) : (
                    `0${stage.stageNumber}`
                  )}
                </button>

                {/* Stage Content Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        Milestone {stage.stageNumber} • {stage.estimatedWeeks} Weeks ({stage.estimatedHours} Hours)
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                        {stage.title}
                      </h3>
                    </div>

                    <button
                      onClick={() => toggleStageCompletion(stage.stageNumber)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isCompleted ? 'Completed' : 'Mark as Done'}
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {stage.description}
                  </p>

                  {/* Key Skills Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {stage.keySkills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 text-brand-700 dark:text-brand-300 px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Recommended Physical Catalog Books */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-brand-500" />
                      Required Library Textbooks & Catalog Resources:
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {stage.recommendedBooks.map((book) => (
                        <div
                          key={book.id}
                          className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5 flex flex-col justify-between space-y-3 hover:border-brand-500 transition-colors"
                        >
                          <div>
                            <h5 className="font-bold text-slate-900 dark:text-white text-xs leading-snug line-clamp-2">
                              {book.title}
                            </h5>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                              By {book.author}
                            </p>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {book.availableCopiesCount > 0
                                  ? `✅ ${book.availableCopiesCount} In Stock`
                                  : '⏳ Waitlisted'}
                              </span>
                              <span className="text-slate-400 truncate max-w-[120px]">
                                📍 {book.shelfLocation}
                              </span>
                            </div>

                            <button
                              onClick={() => navigate(`/book/${book.id}`)}
                              className="w-full py-1.5 px-3 bg-white dark:bg-slate-900 hover:bg-brand-600 hover:text-white border border-slate-200 dark:border-slate-700 hover:border-brand-600 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                            >
                              Inspect Details <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearningPath;
