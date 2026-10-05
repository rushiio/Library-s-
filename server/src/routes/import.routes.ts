import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize, AuthRequest } from '../middleware/authMiddleware.js';
import { ExcelImportService, ColumnMapping } from '../services/excelImportService.js';

const router = Router();

// Configure multer file upload
const uploadDir = path.resolve(process.cwd(), '../data/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx, .xls, and .csv files are supported.'));
    }
  },
});

/**
 * Preview uploaded Excel / CSV file
 */
router.post('/preview', authenticate, authorize(['ADMIN']), upload.single('file'), (req: AuthRequest, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded.' });
      return;
    }

    const { sheetName } = req.body;
    const preview = ExcelImportService.parseWorkbookPreview(req.file.path, sheetName);

    res.json({
      success: true,
      filePath: req.file.path,
      fileName: req.file.originalname,
      ...preview,
    });
  } catch (error: any) {
    console.error('Preview error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to parse Excel file.' });
  }
});

/**
 * Preview default server catalog at data/books.xlsx
 */
router.get('/server-file-preview', authenticate, authorize(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const defaultPath = path.resolve(process.cwd(), '../data/books.xlsx');
    if (!fs.existsSync(defaultPath)) {
      res.status(404).json({ success: false, error: 'File data/books.xlsx was not found on server.' });
      return;
    }

    const sheetName = req.query.sheetName as string;
    const preview = ExcelImportService.parseWorkbookPreview(defaultPath, sheetName);

    res.json({
      success: true,
      filePath: defaultPath,
      fileName: 'books.xlsx (Preloaded Dataset)',
      ...preview,
    });
  } catch (error: any) {
    console.error('Server file preview error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to inspect server books.xlsx.' });
  }
});

/**
 * Execute Batch Import with Mapped Columns
 */
router.post('/process', authenticate, authorize(['ADMIN']), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { filePath, sheetName, mapping, mergeDuplicates, batchSize } = req.body;

    if (!filePath || !fs.existsSync(filePath)) {
      res.status(400).json({ success: false, error: 'Target Excel file path is missing or invalid.' });
      return;
    }

    if (!mapping || !mapping.title || !mapping.author) {
      res.status(400).json({ success: false, error: 'Title and Author column mappings are required.' });
      return;
    }

    const result = await ExcelImportService.executeImport({
      filePath,
      sheetName,
      mapping: mapping as ColumnMapping,
      mergeDuplicates: Boolean(mergeDuplicates),
      batchSize: batchSize ? parseInt(batchSize, 10) : 250,
      userId: req.user?.id,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Import execution error:', error);
    res.status(500).json({ success: false, error: error.message || 'Import process failed.' });
  }
});

/**
 * Export Catalog to Excel
 */
router.get('/export', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const buffer = await ExcelImportService.exportCatalogToExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="LibraAI_Catalog_Export_${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate catalog export.' });
  }
});

export default router;
