import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Layers,
  ArrowRight,
  Download,
  RefreshCw,
  Sliders,
  Database,
  Check,
  FileUp,
} from 'lucide-react';
import api from '../services/api';
import { ColumnMapping } from '../types';

export const AdminImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('Book List');
  const [headers, setHeaders] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [sampleRows, setSampleRows] = useState<Record<string, any>[]>([]);
  const [detectedDepartments, setDetectedDepartments] = useState<string[]>([]);

  const [mapping, setMapping] = useState<ColumnMapping>({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    year: '',
    edition: '',
    department: '',
    resourceType: '',
    language: '',
    location: '',
    shelfNumber: '',
    condition: '',
    price: '',
    invoiceNo: '',
    accessionSeries: '',
    accessionNumber: '',
    callNumber: '',
    copies: '',
  });

  const [mergeDuplicates, setMergeDuplicates] = useState(true);
  const [batchSize, setBatchSize] = useState(500);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; total: number; percent: number } | null>(null);
  const [importResult, setImportResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-load preloaded data/books.xlsx preview on mount
  useEffect(() => {
    loadServerFilePreview('Book List');
  }, []);

  const loadServerFilePreview = async (sheetName?: string) => {
    setIsLoadingPreview(true);
    setError(null);
    try {
      const res = await api.get('/import/server-file-preview', {
        params: { sheetName: sheetName || selectedSheet },
      });
      if (res.data.success) {
        setFilePath(res.data.filePath);
        setFileName(res.data.fileName);
        setSheetNames(res.data.sheetNames);
        setSelectedSheet(res.data.selectedSheet);
        setHeaders(res.data.headers);
        setTotalRows(res.data.totalRows);
        setSampleRows(res.data.sampleRows);
        setDetectedDepartments(res.data.detectedDepartments || []);

        // Apply suggested mappings
        setMapping((prev: ColumnMapping) => ({
          ...prev,
          ...res.data.suggestedMapping,
        }));
      }
    } catch (err: any) {
      console.warn('Server file preview notice:', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setIsLoadingPreview(true);
    setError(null);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', selected);

    try {
      const res = await api.post('/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setFilePath(res.data.filePath);
        setFileName(res.data.fileName);
        setSheetNames(res.data.sheetNames);
        setSelectedSheet(res.data.selectedSheet);
        setHeaders(res.data.headers);
        setTotalRows(res.data.totalRows);
        setSampleRows(res.data.sampleRows);
        setDetectedDepartments(res.data.detectedDepartments || []);

        setMapping((prev: ColumnMapping) => ({
          ...prev,
          ...res.data.suggestedMapping,
        }));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to upload and parse Excel file.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!filePath) {
      setError('Please select or upload an Excel file first.');
      return;
    }
    if (!mapping.title || !mapping.author) {
      setError('Title and Author columns are required for catalog mapping.');
      return;
    }

    setIsImporting(true);
    setError(null);
    setProgress({ processed: 0, total: totalRows, percent: 0 });

    try {
      // Simulate smooth progress ticks while server processes batches
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (!prev || prev.percent >= 90) return prev;
          const nextPercent = Math.min(prev.percent + 15, 90);
          return {
            processed: Math.floor((nextPercent / 100) * totalRows),
            total: totalRows,
            percent: nextPercent,
          };
        });
      }, 500);

      const res = await api.post('/import/process', {
        filePath,
        sheetName: selectedSheet,
        mapping,
        mergeDuplicates,
        batchSize,
      });

      clearInterval(progressInterval);

      if (res.data.success) {
        setProgress({ processed: totalRows, total: totalRows, percent: 100 });
        setImportResult(res.data);
      } else {
        throw new Error(res.data.error || 'Import failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Import execution failed.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportCatalog = async () => {
    try {
      const res = await api.get('/import/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `LibraAI_Catalog_Export_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to export catalog.');
    }
  };

  const mappingFields: { key: keyof ColumnMapping; label: string; required?: boolean; desc: string }[] = [
    { key: 'title', label: 'Book Title', required: true, desc: 'Name of the textbook or volume' },
    { key: 'author', label: 'Author(s)', required: true, desc: 'Primary or contributing authors' },
    { key: 'isbn', label: 'ISBN Number', desc: '10 or 13 digit International Standard Book Number' },
    { key: 'department', label: 'Department / Branch', desc: 'Normalized academic branch' },
    { key: 'edition', label: 'Edition', desc: 'e.g., 4th, 5th, Revised' },
    { key: 'publisher', label: 'Publisher', desc: 'Publishing house name' },
    { key: 'year', label: 'Publication Year', desc: 'Year of release' },
    { key: 'resourceType', label: 'Resource Type', desc: 'Text Book, Reference, Journal' },
    { key: 'accessionSeries', label: 'Accession Series', desc: 'Prefix code (e.g., D)' },
    { key: 'accessionNumber', label: 'Accession Number', desc: 'Copy ID (e.g., 1, 501)' },
    { key: 'location', label: 'Library Location', desc: 'Section or branch library' },
    { key: 'condition', label: 'Condition', desc: 'Physical condition (Good, Fair)' },
    { key: 'price', label: 'Price (₹)', desc: 'Book purchase cost' },
    { key: 'invoiceNo', label: 'Invoice / Bill No', desc: 'Financial purchase invoice reference' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Excel Books Importer & Data Engine
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
              Admin Only
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Batch import, column auto-detection, copy accession generation, and catalog export.
          </p>
        </div>

        <button
          onClick={handleExportCatalog}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 shrink-0"
        >
          <Download className="h-4 w-4" />
          <span>Export Catalog (.xlsx)</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 text-xs font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload / Source Selection Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upload Dropzone */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Upload className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            <span>Select or Upload Excel File (.xlsx / .csv)</span>
          </h2>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-brand-500 transition-colors">
            <input
              type="file"
              id="excel-file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="excel-file" className="cursor-pointer flex flex-col items-center gap-2">
              <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                <FileSpreadsheet className="h-8 w-8" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {file ? file.name : 'Click to browse or drop .xlsx file here'}
              </span>
              <span className="text-xs text-slate-400">Supports up to 50MB (8,000+ rows)</span>
            </label>
          </div>

          {/* Preset Buttons */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Current Active File: <strong className="text-brand-600 dark:text-brand-400">{fileName || 'None'}</strong>
              </span>
            </div>

            <button
              type="button"
              onClick={() => loadServerFilePreview('Book List')}
              disabled={isLoadingPreview}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPreview ? 'animate-spin' : ''}`} />
              <span>Reload data/books.xlsx</span>
            </button>
          </div>
        </div>

        {/* File Overview KPI */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Dataset Summary</span>
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Total Rows Detected:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{totalRows.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Columns Detected:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{headers.length} headers</span>
              </div>

              {sheetNames.length > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <label className="block text-slate-500 dark:text-slate-400 mb-1">Select Sheet:</label>
                  <select
                    value={selectedSheet}
                    onChange={(e) => {
                      setSelectedSheet(e.target.value);
                      loadServerFilePreview(e.target.value);
                    }}
                    className="w-full text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 text-slate-900 dark:text-white"
                  >
                    {sheetNames.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={mergeDuplicates}
                onChange={(e) => setMergeDuplicates(e.target.checked)}
                className="h-4 w-4 rounded text-brand-600"
              />
              <span>Merge duplicate titles & append physical copies</span>
            </label>
          </div>
        </div>

      </div>

      {/* Column Mapping Section */}
      {headers.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
                <span>Column Mapping Studio</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Match your Excel columns to database fields. We've auto-detected best matches below:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mappingFields.map((f) => (
              <div key={String(f.key)} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-900 dark:text-white">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                </div>
                <p className="text-[10px] text-slate-400 mb-2">{f.desc}</p>
                <select
                  value={mapping[f.key] || ''}
                  onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}
                  className="w-full text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">-- Do Not Map / None --</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Action Button & Progress */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              {progress && (
                <div className="space-y-1.5 w-72">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Importing...</span>
                    <span>{progress.percent}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-brand-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || !mapping.title || !mapping.author}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 hover:bg-brand-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25 transition-all active:scale-95 disabled:opacity-50"
            >
              {isImporting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Processing {totalRows.toLocaleString()} Records...</span>
                </div>
              ) : (
                <>
                  <span>Execute Batch Import ({totalRows.toLocaleString()} Records)</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success Summary Result Modal / Box */}
      {importResult && (
        <div className="rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-6 sm:p-8 text-emerald-900 dark:text-emerald-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-2xl bg-emerald-500 text-white">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-black">Catalog Import Successfully Completed!</h3>
              <p className="text-xs opacity-90">All physical copies and title embeddings have been synchronized.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center mt-6">
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="text-2xl font-black">{importResult.createdBooksCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">New Titles Created</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="text-2xl font-black">{importResult.createdCopiesCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Accession Copies Added</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="text-2xl font-black">{importResult.skippedDuplicatesCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Duplicates Skipped</div>
            </div>
            <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-emerald-200/50 dark:border-emerald-800/50">
              <div className="text-2xl font-black">{importResult.errorCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Error Rows</div>
            </div>
          </div>
        </div>
      )}

      {/* 20-Row Sample Preview Table */}
      {sampleRows.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Live Preview (First 20 Records)
            </h3>
            <span className="text-xs text-slate-400">Showing 20 of {totalRows.toLocaleString()} rows</span>
          </div>

          <div className="overflow-x-auto max-h-96 rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-2.5">#</th>
                  {headers.map((h) => (
                    <th key={h} className="p-2.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {sampleRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-2.5 text-slate-400 font-bold">{idx + 1}</td>
                    {headers.map((h) => (
                      <td key={h} className="p-2.5 whitespace-nowrap text-slate-700 dark:text-slate-300">
                        {r[h] !== null && r[h] !== undefined ? String(r[h]) : <span className="text-slate-300 dark:text-slate-600">-</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
