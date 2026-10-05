import React from 'react';
import { MapPin, Navigation, Compass } from 'lucide-react';

interface ShelfLocatorProps {
  location?: string;
  shelfNumber?: string;
  department?: string;
}

export const ShelfLocator: React.FC<ShelfLocatorProps> = ({
  location = 'Diploma Library',
  shelfNumber = 'Rack C-04, Shelf 2',
  department = 'Computer Engineering',
}) => {
  // Determine highlighted rack slot
  const rackCode = shelfNumber.match(/Rack\s*([A-Z0-9-]+)/i)?.[1] || 'C-04';

  const racks = [
    { id: 'A-01', label: 'Rack A-1 (Mech)', active: rackCode.startsWith('M') },
    { id: 'B-02', label: 'Rack B-2 (Civil)', active: rackCode.startsWith('C') && department.includes('Civil') },
    { id: 'C-04', label: 'Rack C-4 (Comp)', active: rackCode.includes('C') || department.includes('Comp') },
    { id: 'D-03', label: 'Rack D-3 (E&TC)', active: rackCode.startsWith('E') || department.includes('TC') },
    { id: 'E-05', label: 'Rack E-5 (Sci)', active: rackCode.startsWith('E') && department.includes('Science') },
    { id: 'F-06', label: 'Rack F-6 (Ref)', active: false },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Physical Shelf Location</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{location} • <span className="font-semibold text-brand-600 dark:text-brand-400">{shelfNumber}</span></p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
          <MapPin className="h-3 w-3" /> Live Shelf Map
        </span>
      </div>

      {/* 2D Floor Visual Diagram */}
      <div className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3 overflow-hidden">
        <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex justify-between">
          <span>ENTRANCE / ISSUE COUNTER</span>
          <span>EAST READING HALL</span>
        </div>

        {/* Floor Rack Grid */}
        <div className="grid grid-cols-3 gap-2">
          {racks.map((rack) => (
            <div
              key={rack.id}
              className={`p-2 rounded-lg border text-center transition-all ${
                rack.active
                  ? 'bg-brand-500 text-white font-bold border-brand-600 shadow-md ring-2 ring-brand-400/40 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="text-[10px]">{rack.label}</div>
              <div className="text-[8px] opacity-80">{rack.active ? '📍 YOUR BOOK IS HERE' : 'Regular Stacks'}</div>
            </div>
          ))}
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Section: <strong className="text-slate-700 dark:text-slate-300">{department}</strong></span>
          <span>Direction: <strong className="text-brand-600 dark:text-brand-400">Aisle 3, Row B</strong></span>
        </div>
      </div>
    </div>
  );
};
