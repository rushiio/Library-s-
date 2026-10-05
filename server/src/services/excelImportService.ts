import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/db.js';
import { AuditService } from './auditService.js';
import { AIService } from './aiService.js';

export interface ColumnMapping {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  year?: string;
  edition?: string;
  department?: string;
  resourceType?: string;
  language?: string;
  location?: string;
  shelfNumber?: string;
  condition?: string;
  price?: string;
  invoiceNo?: string;
  accessionSeries?: string;
  accessionNumber?: string;
  callNumber?: string;
  copies?: string;
}

export interface ImportPreviewResult {
  sheetNames: string[];
  selectedSheet: string;
  totalRows: number;
  headers: string[];
  suggestedMapping: Partial<ColumnMapping>;
  sampleRows: Record<string, any>[];
  detectedDepartments: string[];
}

export class ExcelImportService {
  /**
   * Fuzzy auto-detection dictionary for mapping header names
   */
  static detectMapping(headers: string[]): Partial<ColumnMapping> {
    const mapping: Partial<ColumnMapping> = {};
    const norm = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const h of headers) {
      const n = norm(h);
      if (!mapping.title && (n.includes('title') || n.includes('bookname') || n.includes('nameofthebook'))) {
        mapping.title = h;
      } else if (!mapping.author && (n.includes('author') || n.includes('writer') || n.includes('authorname'))) {
        mapping.author = h;
      } else if (!mapping.isbn && (n.includes('isbn') || n.includes('isbno') || n.includes('isbnnumber'))) {
        mapping.isbn = h;
      } else if (!mapping.publisher && (n.includes('publisher') || n.includes('publication') || n.includes('pub'))) {
        mapping.publisher = h;
      } else if (!mapping.year && (n.includes('year') || n.includes('yearofpub') || n.includes('pubyear'))) {
        mapping.year = h;
      } else if (!mapping.edition && (n.includes('edition') || n.includes('resourceedition') || n.includes('edn'))) {
        mapping.edition = h;
      } else if (!mapping.department && (n.includes('department') || n.includes('dept') || n.includes('category') || n.includes('branch'))) {
        mapping.department = h;
      } else if (!mapping.resourceType && (n.includes('resourcetype') || n.includes('type') || n.includes('booktype'))) {
        mapping.resourceType = h;
      } else if (!mapping.language && (n.includes('language') || n.includes('resourcelanguage') || n.includes('lang'))) {
        mapping.language = h;
      } else if (!mapping.location && (n.includes('location') || n.includes('librarylocation') || n.includes('section'))) {
        mapping.location = h;
      } else if (!mapping.shelfNumber && (n.includes('shelf') || n.includes('rack') || n.includes('shelfno') || n.includes('cupboard'))) {
        mapping.shelfNumber = h;
      } else if (!mapping.condition && (n.includes('condition') || n.includes('resourcecondition') || n.includes('state'))) {
        mapping.condition = h;
      } else if (!mapping.price && (n.includes('price') || n.includes('cost') || n.includes('priceinrs') || n.includes('netprice'))) {
        mapping.price = h;
      } else if (!mapping.invoiceNo && (n.includes('invoice') || n.includes('billno') || n.includes('invoicebillno'))) {
        mapping.invoiceNo = h;
      } else if (!mapping.accessionSeries && (n.includes('accessionseries') || n.includes('series') || n.includes('accseries'))) {
        mapping.accessionSeries = h;
      } else if (!mapping.accessionNumber && (n.includes('accessionnumber') || n.includes('accno') || n.includes('accessionno'))) {
        mapping.accessionNumber = h;
      } else if (!mapping.callNumber && (n.includes('callnumber') || n.includes('callno'))) {
        mapping.callNumber = h;
      } else if (!mapping.copies && (n.includes('copies') || n.includes('totalcopies') || n.includes('qty'))) {
        mapping.copies = h;
      }
    }

    return mapping;
  }

  /**
   * Normalizes Department / Category casing and titles
   */
  static normalizeDepartment(dept?: string | null): string {
    if (!dept || typeof dept !== 'string') return 'General';
    const trimmed = dept.trim();
    const lower = trimmed.toLowerCase();

    if (lower.includes('comp') || lower.includes('cs') || lower.includes('it')) {
      return 'Computer Engineering';
    }
    if (lower.includes('mech')) {
      return 'Mechanical Engineering';
    }
    if (lower.includes('civil')) {
      return 'Civil Engineering';
    }
    if (lower.includes('electr') && !lower.includes('tele')) {
      return 'Electrical Engineering';
    }
    if (lower.includes('e & tc') || lower.includes('etc') || lower.includes('telecom') || lower.includes('electronic')) {
      return 'Electronics and Telecommunication Engineering';
    }
    if (lower.includes('science') || lower.includes('fe') || lower.includes('first year')) {
      return 'Engineering Science';
    }
    if (lower.includes('library') || lower.includes('general')) {
      return 'General Library';
    }

    // Default title case
    return trimmed.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase());
  }

  /**
   * Generates a preview of the Excel workbook
   */
  static parseWorkbookPreview(filePath: string, sheetName?: string): ImportPreviewResult {
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const sheetNames = workbook.SheetNames;
    const activeSheetName = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0];
    const sheet = workbook.Sheets[activeSheetName];

    const rawRows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });
    const headers = rawRows.length > 0 ? Object.keys(rawRows[0]) : [];

    const suggestedMapping = this.detectMapping(headers);
    const sampleRows = rawRows.slice(0, 20);

    const departmentsSet = new Set<string>();
    const deptCol = suggestedMapping.department;
    if (deptCol) {
      for (const r of rawRows) {
        if (r[deptCol]) {
          departmentsSet.add(this.normalizeDepartment(String(r[deptCol])));
        }
      }
    }

    return {
      sheetNames,
      selectedSheet: activeSheetName,
      totalRows: rawRows.length,
      headers,
      suggestedMapping,
      sampleRows,
      detectedDepartments: Array.from(departmentsSet),
    };
  }

  /**
   * Executes batch import with deduplication and copy generation
   */
  static async executeImport(params: {
    filePath: string;
    sheetName?: string;
    mapping: ColumnMapping;
    mergeDuplicates?: boolean;
    batchSize?: number;
    userId?: string;
    onProgress?: (processed: number, total: number, stats: any) => void;
  }) {
    const { filePath, sheetName, mapping, mergeDuplicates = true, batchSize = 250, userId } = params;

    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const activeSheetName = sheetName && workbook.SheetNames.includes(sheetName) ? sheetName : workbook.SheetNames[0];
    const sheet = workbook.Sheets[activeSheetName];
    const rows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, { defval: null });

    const totalRows = rows.length;
    let createdBooksCount = 0;
    let updatedBooksCount = 0;
    let createdCopiesCount = 0;
    let skippedDuplicatesCount = 0;
    let errorRows: { row: number; reason: string }[] = [];

    // Cache existing books by normalized (title + author) and ISBN
    const existingBooks = await prisma.book.findMany({
      select: { id: true, title: true, author: true, isbn: true },
    });

    const bookMapByTitleAuthor = new Map<string, string>();
    const bookMapByIsbn = new Map<string, string>();

    for (const b of existingBooks) {
      const key = `${b.title.toLowerCase().trim()}:::${b.author.toLowerCase().trim()}`;
      bookMapByTitleAuthor.set(key, b.id);
      if (b.isbn) {
        bookMapByIsbn.set(b.isbn.toLowerCase().trim(), b.id);
      }
    }

    // Cache existing copy barcodes to prevent duplicate barcode constraints
    const existingCopies = await prisma.bookCopy.findMany({
      select: { barcode: true },
    });
    const existingBarcodes = new Set(existingCopies.map((c) => c.barcode));

    // Process in batches
    for (let i = 0; i < totalRows; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const rowNumber = i + j + 1;

        try {
          const rawTitle = row[mapping.title];
          const rawAuthor = row[mapping.author];

          if (!rawTitle || String(rawTitle).trim() === '') {
            errorRows.push({ row: rowNumber, reason: 'Missing Book Title' });
            continue;
          }

          const title = String(rawTitle).trim();
          const author = rawAuthor ? String(rawAuthor).trim() : 'Unknown Author';
          const isbn = mapping.isbn && row[mapping.isbn] ? String(row[mapping.isbn]).trim() : null;
          const publisher = mapping.publisher && row[mapping.publisher] ? String(row[mapping.publisher]).trim() : null;
          const edition = mapping.edition && row[mapping.edition] ? String(row[mapping.edition]).trim() : null;
          
          let year: number | null = null;
          if (mapping.year && row[mapping.year]) {
            const parsedYear = parseInt(String(row[mapping.year]).replace(/\D/g, ''), 10);
            if (!isNaN(parsedYear) && parsedYear > 1800 && parsedYear <= new Date().getFullYear() + 1) {
              year = parsedYear;
            }
          }

          const department = this.normalizeDepartment(mapping.department ? row[mapping.department] : 'General');
          const resourceType = mapping.resourceType && row[mapping.resourceType] ? String(row[mapping.resourceType]).trim() : 'Text Book';
          const language = mapping.language && row[mapping.language] ? String(row[mapping.language]).trim() : 'English';
          const location = mapping.location && row[mapping.location] ? String(row[mapping.location]).trim() : 'Diploma Library';
          const condition = mapping.condition && row[mapping.condition] ? String(row[mapping.condition]).trim() : 'Good';
          const invoiceNo = mapping.invoiceNo && row[mapping.invoiceNo] ? String(row[mapping.invoiceNo]).trim() : null;
          const callNumber = mapping.callNumber && row[mapping.callNumber] ? String(row[mapping.callNumber]).trim() : null;
          
          let price = 0.0;
          if (mapping.price && row[mapping.price]) {
            const parsedPrice = parseFloat(String(row[mapping.price]).replace(/[^0-9.]/g, ''));
            if (!isNaN(parsedPrice)) price = parsedPrice;
          }

          // Check if book already exists
          const titleAuthorKey = `${title.toLowerCase()}:::${author.toLowerCase()}`;
          let bookId = (isbn && bookMapByIsbn.get(isbn.toLowerCase())) || bookMapByTitleAuthor.get(titleAuthorKey);

          if (!bookId) {
            // Assign difficulty level heuristic
            let difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced' = 'Beginner';
            if (resourceType.toLowerCase().includes('reference') || title.toLowerCase().includes('advanced') || title.toLowerCase().includes('design')) {
              difficultyLevel = 'Advanced';
            } else if (title.toLowerCase().includes('applied') || title.toLowerCase().includes('principle') || title.toLowerCase().includes('analysis')) {
              difficultyLevel = 'Intermediate';
            }

            // Generate vector embedding for semantic search
            const embeddingVector = AIService.generateVector(`${title} ${author} ${department} ${resourceType} ${publisher || ''}`);

            const newBook = await prisma.book.create({
              data: {
                title,
                author,
                isbn,
                publisher,
                edition,
                year,
                department,
                resourceType,
                language,
                difficultyLevel,
                tags: JSON.stringify([department, resourceType, publisher].filter(Boolean)),
                embedding: JSON.stringify(embeddingVector),
              },
            });

            bookId = newBook.id;
            bookMapByTitleAuthor.set(titleAuthorKey, bookId);
            if (isbn) bookMapByIsbn.set(isbn.toLowerCase(), bookId);
            createdBooksCount++;
          } else {
            updatedBooksCount++;
          }

          // Handle physical copy creation
          const series = mapping.accessionSeries && row[mapping.accessionSeries] ? String(row[mapping.accessionSeries]).trim() : 'D';
          const accNo = mapping.accessionNumber && row[mapping.accessionNumber] ? String(row[mapping.accessionNumber]).trim() : String(rowNumber);
          const barcode = `${series}-${accNo}`.toUpperCase();

          // Check if copy barcode already exists
          if (existingBarcodes.has(barcode)) {
            skippedDuplicatesCount++;
            continue;
          }

          await prisma.bookCopy.create({
            data: {
              bookId,
              accessionSeries: series,
              accessionNumber: accNo,
              barcode,
              location,
              shelfNumber: `Rack ${department.charAt(0)}-${((parseInt(accNo, 10) || 1) % 10) + 1}`,
              condition,
              price,
              invoiceNo,
              callNumber,
              status: 'AVAILABLE',
            },
          });

          existingBarcodes.add(barcode);
          createdCopiesCount++;
        } catch (err: any) {
          errorRows.push({ row: rowNumber, reason: err.message || 'Database insertion error' });
        }
      }

      if (params.onProgress) {
        params.onProgress(Math.min(i + batchSize, totalRows), totalRows, {
          createdBooksCount,
          createdCopiesCount,
          skippedDuplicatesCount,
        });
      }
    }

    // Log to audit log
    await AuditService.logAction({
      userId,
      action: 'EXCEL_CATALOG_IMPORT',
      details: {
        totalRows,
        createdBooksCount,
        createdCopiesCount,
        skippedDuplicatesCount,
        errorCount: errorRows.length,
        sheetName: activeSheetName,
      },
    });

    return {
      success: true,
      totalRows,
      createdBooksCount,
      updatedBooksCount,
      createdCopiesCount,
      skippedDuplicatesCount,
      errorCount: errorRows.length,
      errorRows: errorRows.slice(0, 50),
    };
  }

  /**
   * Exports the entire catalog to an Excel buffer
   */
  static async exportCatalogToExcel(): Promise<Buffer> {
    const books = await prisma.book.findMany({
      include: {
        copies: true,
      },
      orderBy: { title: 'asc' },
    });

    const exportRows: Record<string, any>[] = [];

    for (const book of books) {
      if (book.copies.length > 0) {
        for (const copy of book.copies) {
          exportRows.push({
            'Accession Series': copy.accessionSeries,
            'Accession Number': copy.accessionNumber,
            'Barcode': copy.barcode,
            'Title': book.title,
            'Author': book.author,
            'ISBN': book.isbn || '',
            'Publisher': book.publisher || '',
            'Edition': book.edition || '',
            'Year': book.year || '',
            'Department': book.department,
            'Resource Type': book.resourceType,
            'Language': book.language,
            'Location': copy.location,
            'Shelf': copy.shelfNumber || '',
            'Condition': copy.condition,
            'Status': copy.status,
            'Price (₹)': copy.price,
            'Invoice No': copy.invoiceNo || '',
            'Call Number': copy.callNumber || '',
          });
        }
      } else {
        exportRows.push({
          'Accession Series': '',
          'Accession Number': '',
          'Barcode': '',
          'Title': book.title,
          'Author': book.author,
          'ISBN': book.isbn || '',
          'Publisher': book.publisher || '',
          'Edition': book.edition || '',
          'Year': book.year || '',
          'Department': book.department,
          'Resource Type': book.resourceType,
          'Language': book.language,
          'Location': '',
          'Shelf': '',
          'Condition': '',
          'Status': 'NO_COPIES',
          'Price (₹)': 0,
          'Invoice No': '',
          'Call Number': '',
        });
      }
    }

    const worksheet = xlsx.utils.json_to_sheet(exportRows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Catalog Export');
    return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
