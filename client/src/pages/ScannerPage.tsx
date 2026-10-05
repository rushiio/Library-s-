import React, { useState, useEffect, useRef } from 'react';
import {
  QrCode,
  Search,
  BookOpen,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  CameraOff,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Tag,
  Clock,
  History,
  Volume2,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BookCopy, User } from '../types';

export const ScannerPage: React.FC = () => {
  const { user } = useAuth();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [copyData, setCopyData] = useState<any | null>(null);
  const [memberInput, setMemberInput] = useState('');
  const [targetMember, setTargetMember] = useState<User | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [recentScans, setRecentScans] = useState<Array<{ barcode: string; title: string; time: string; status: string }>>([]);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'libra-camera-viewfinder';

  // Play audio beep on scan
  const playBeep = (freq = 880, duration = 150) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // Lookup Copy by Barcode
  const handleLookupCopy = async (codeToSearch: string) => {
    const code = codeToSearch.trim();
    if (!code) return;

    try {
      setLoading(true);
      setFeedback(null);
      const res = await api.get(`/circulation/copy/${encodeURIComponent(code)}`);

      if (res.data.success && res.data.copy) {
        const copy = res.data.copy;
        setCopyData(copy);
        playBeep(1046, 120);

        // Append to recent scans
        setRecentScans((prev) => [
          {
            barcode: copy.barcode,
            title: copy.book?.title || 'Book Copy',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: copy.status,
          },
          ...prev.filter((p) => p.barcode !== copy.barcode).slice(0, 7),
        ]);
      }
    } catch (err: any) {
      setCopyData(null);
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || `Book copy '${code}' not found in catalog.`,
      });
      playBeep(300, 200);
    } finally {
      setLoading(false);
    }
  };

  // Member search lookup
  const handleLookupMember = async (memberIdOrEmail: string) => {
    if (!memberIdOrEmail.trim()) return;

    try {
      setMemberLoading(true);
      const res = await api.get(`/users?search=${encodeURIComponent(memberIdOrEmail.trim())}`);
      if (res.data.success && res.data.users?.length > 0) {
        setTargetMember(res.data.users[0]);
      } else {
        setTargetMember(null);
        setFeedback({ type: 'error', message: `Member '${memberIdOrEmail}' not found.` });
      }
    } catch (err: any) {
      console.error('Member lookup error:', err);
    } finally {
      setMemberLoading(false);
    }
  };

  // One-click Issue Book
  const handleIssueBook = async () => {
    if (!copyData || !targetMember) {
      setFeedback({ type: 'error', message: 'Please select a valid book copy and member.' });
      return;
    }

    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await api.post('/circulation/issue', {
        bookCopyId: copyData.id,
        userId: targetMember.id,
      });

      if (res.data.success) {
        setFeedback({ type: 'success', message: res.data.message });
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        playBeep(1200, 180);
        // Refresh copy data
        handleLookupCopy(copyData.barcode);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to issue book copy.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // One-click Return Book
  const handleReturnBook = async () => {
    if (!copyData) return;

    try {
      setActionLoading(true);
      setFeedback(null);
      const res = await api.post('/circulation/return', {
        bookCopyId: copyData.id,
        returnRemarks: 'Returned via mobile barcode scanner',
      });

      if (res.data.success) {
        setFeedback({ type: 'success', message: res.data.message });
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        playBeep(1320, 200);
        handleLookupCopy(copyData.barcode);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || 'Failed to return book copy.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Start Camera QR Scanner
  const startCamera = async () => {
    try {
      setCameraActive(true);
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setBarcodeInput(decodedText);
          handleLookupCopy(decodedText);
          // Optional: pause or stop camera after successful scan
        },
        (errorMessage) => {
          // ignore frame decode fails
        }
      );
    } catch (err) {
      console.error('Camera start error:', err);
      setCameraActive(false);
      setFeedback({
        type: 'error',
        message: 'Unable to access camera. Please check browser camera permissions.',
      });
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && cameraActive) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Camera stop error:', e);
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && cameraActive) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [cameraActive]);

  const isStaff = ['LIBRARIAN', 'ADMIN'].includes(user?.role || '');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider mb-2 border border-brand-200/50 dark:border-brand-800/50">
            <QrCode className="h-3.5 w-3.5" />
            <span>Circulation Scanner</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Camera & Barcode Scanner
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Scan physical book barcodes or shelf codes for instant status verification, rapid checkout, and returns.
          </p>
        </div>

        {/* Camera Toggle Button */}
        <button
          onClick={cameraActive ? stopCamera : startCamera}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold shadow-md transition-all active:scale-95 ${
            cameraActive
              ? 'bg-rose-600 hover:bg-rose-500 text-white'
              : 'bg-brand-600 hover:bg-brand-500 text-white'
          }`}
        >
          {cameraActive ? (
            <>
              <CameraOff className="h-4 w-4" /> Stop Camera
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" /> Open Camera Scanner
            </>
          )}
        </button>
      </div>

      {/* Camera Viewfinder Area */}
      {cameraActive && (
        <div className="mb-8 bg-slate-950 rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-2xl relative overflow-hidden flex flex-col items-center">
          <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Align Barcode or QR Code within the frame</span>
          </div>
          <div
            id={scannerContainerId}
            className="w-full max-w-sm rounded-2xl overflow-hidden border-2 border-dashed border-brand-400"
          />
        </div>
      )}

      {/* Manual Input Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookupCopy(barcodeInput);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Enter or scan Barcode / Accession # (e.g., D-1, D-501, CS-101)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || !barcodeInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            <span>Lookup Copy</span>
          </button>
        </form>

        {/* Quick Demo Barcodes */}
        <div className="mt-4 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">Try Barcode:</span>
          {['D-1', 'D-2', 'D-3', 'D-4', 'D-501'].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setBarcodeInput(code);
                handleLookupCopy(code);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300 font-semibold hover:bg-brand-50 dark:hover:bg-brand-950 hover:text-brand-600 transition-colors"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`mb-8 p-4 rounded-2xl flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 text-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span className="text-sm font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Main Copy Result Card */}
      {copyData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-28 h-40 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                {copyData.book?.coverUrl ? (
                  <img
                    src={copyData.book.coverUrl}
                    alt={copyData.book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="h-10 w-10 text-slate-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span
                    className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      copyData.status === 'AVAILABLE'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : copyData.status === 'ISSUED'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    ● {copyData.status}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Accession: #{copyData.accessionSeries}-{copyData.accessionNumber}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {copyData.book?.title}
                </h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  by {copyData.book?.author} • {copyData.book?.publisher || 'Publisher N/A'}
                </p>

                {/* Metadata badges */}
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Tag className="h-3 w-3" /> Barcode
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                      {copyData.barcode}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Shelf Location
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                      {copyData.shelfNumber || copyData.location || 'Diploma Stack'}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Condition
                    </div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {copyData.condition || 'Good'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Currently Issued to Info */}
            {copyData.status === 'ISSUED' && copyData.currentIssue && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                      Currently Issued To:
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {copyData.currentIssue.user?.name} ({copyData.currentIssue.user?.memberId})
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Due Date: {new Date(copyData.currentIssue.dueDate).toLocaleDateString()} (
                      {copyData.currentIssue.user?.department || 'Department N/A'})
                    </div>
                  </div>

                  {isStaff && (
                    <button
                      onClick={handleReturnBook}
                      disabled={actionLoading}
                      className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                    >
                      {actionLoading ? 'Processing...' : 'Return Book Now 📥'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Issue Panel for Staff */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                <UserCheck className="h-5 w-5 text-brand-500" />
                <span>Issue to Member</span>
              </h3>

              {copyData.status !== 'AVAILABLE' ? (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
                  This copy is currently <strong className="uppercase">{copyData.status}</strong> and cannot be issued to another member.
                </div>
              ) : isStaff ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Member ID / Email
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. STU001 or student@libra.ai"
                        value={memberInput}
                        onChange={(e) => setMemberInput(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleLookupMember(memberInput)}
                        disabled={memberLoading || !memberInput.trim()}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 transition-colors"
                      >
                        Find
                      </button>
                    </div>
                  </div>

                  {targetMember && (
                    <div className="p-3.5 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800">
                      <div className="text-xs font-black text-brand-900 dark:text-brand-200">
                        {targetMember.name}
                      </div>
                      <div className="text-[11px] text-brand-700 dark:text-brand-400">
                        ID: {targetMember.memberId} • Role: {targetMember.role}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleIssueBook}
                    disabled={actionLoading || !targetMember}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{actionLoading ? 'Issuing...' : 'Confirm Issue Book 📤'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
                  Staff privileges (Librarian/Admin) required to issue books directly at circulation counter.
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span>Audited SHA-256 Ledger</span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Scans Strip */}
      {recentScans.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-brand-500" /> Recent Scans Session
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentScans.map((scan, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setBarcodeInput(scan.barcode);
                  handleLookupCopy(scan.barcode);
                }}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-left hover:border-brand-300 dark:hover:border-brand-700 transition-all flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                    {scan.barcode}
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {scan.title}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">{scan.time}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerPage;
