import React from 'react';

interface CoverGeneratorProps {
  title: string;
  author: string;
  department?: string;
  className?: string;
}

export const CoverGenerator: React.FC<CoverGeneratorProps> = ({
  title,
  author,
  department = 'General',
  className = 'h-52 w-36',
}) => {
  // Select harmonious academic gradients based on department
  const getGradient = () => {
    const d = department.toLowerCase();
    if (d.includes('comp')) {
      return 'from-sky-600 via-indigo-700 to-slate-900 border-sky-400/30';
    }
    if (d.includes('mech')) {
      return 'from-amber-600 via-orange-700 to-stone-900 border-amber-400/30';
    }
    if (d.includes('civil')) {
      return 'from-emerald-600 via-teal-700 to-zinc-900 border-emerald-400/30';
    }
    if (d.includes('electr')) {
      return 'from-blue-600 via-cyan-700 to-slate-900 border-blue-400/30';
    }
    if (d.includes('science') || d.includes('chem')) {
      return 'from-purple-600 via-pink-700 to-slate-900 border-purple-400/30';
    }
    return 'from-indigo-600 via-slate-700 to-slate-900 border-indigo-400/30';
  };

  return (
    <div
      className={`relative flex flex-col justify-between p-3 rounded-xl bg-gradient-to-br ${getGradient()} text-white shadow-lg select-none overflow-hidden border ${className}`}
    >
      {/* Book spine lighting overlay */}
      <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />

      {/* Header Badge */}
      <div className="relative z-10">
        <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white/90">
          {department.split(' ')[0]}
        </span>
      </div>

      {/* Title & Author */}
      <div className="relative z-10 my-auto">
        <h4 className="text-xs font-black leading-tight tracking-tight line-clamp-3 text-white drop-shadow-sm">
          {title}
        </h4>
        <p className="text-[10px] text-white/80 font-medium mt-1 line-clamp-1 italic">
          {author}
        </p>
      </div>

      {/* Footer Pattern */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/15 text-[8px] font-mono text-white/60">
        <span>LIBRA-ED</span>
        <span>ACADEMIC</span>
      </div>
    </div>
  );
};
