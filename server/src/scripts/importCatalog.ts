import path from 'path';
import fs from 'fs';
import { ExcelImportService } from '../services/excelImportService.js';
import { prisma } from '../config/db.js';

async function runCatalogImport() {
  console.log('🚀 Starting LibraAI Direct Excel Catalog Batch Importer...');

  const dataCandidates = [
    path.resolve(process.cwd(), '../data/books.xlsx'),
    path.resolve(process.cwd(), 'data/books.xlsx'),
    path.resolve(process.cwd(), '../../data/books.xlsx'),
  ];

  let targetPath = '';
  for (const cand of dataCandidates) {
    if (fs.existsSync(cand)) {
      targetPath = cand;
      break;
    }
  }

  if (!targetPath) {
    console.error('❌ Could not find books.xlsx in candidate data paths.');
    process.exit(1);
  }

  console.log(`📁 Found catalog file at: ${targetPath}`);

  // Preview workbook
  const preview = ExcelImportService.parseWorkbookPreview(targetPath);
  console.log(`📊 Total rows in spreadsheet: ${preview.totalRows.toLocaleString()}`);
  console.log(`📑 Available sheets: ${preview.sheetNames.join(', ')}`);
  console.log(`📋 Detected Headers: ${preview.headers.join(', ')}`);

  const mapping = preview.suggestedMapping as any;
  if (!mapping.title || !mapping.author) {
    console.warn('⚠️ Auto-detection could not find title/author automatically. Applying fallback mapping...');
    mapping.title = preview.headers.find((h) => /title|book/i.test(h)) || preview.headers[0];
    mapping.author = preview.headers.find((h) => /author|writer/i.test(h)) || preview.headers[1];
  }

  console.log('🗺️ Active column mapping:', mapping);

  console.log('\n⏳ Beginning batch database insertion (batches of 500)...');
  const startTime = Date.now();

  const result = await ExcelImportService.executeImport({
    filePath: targetPath,
    mapping,
    mergeDuplicates: true,
    batchSize: 500,
    onProgress: (processed, total, stats) => {
      const pct = ((processed / total) * 100).toFixed(1);
      process.stdout.write(
        `\r⚡ Progress: ${processed.toLocaleString()} / ${total.toLocaleString()} rows (${pct}%) | Titles: ${stats.createdBooksCount.toLocaleString()} | Copies: ${stats.createdCopiesCount.toLocaleString()}`
      );
    },
  });

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n\n✅ ========================================');
  console.log('🎉 Catalog Batch Import Completed Successfully!');
  console.log(`⏱️ Duration: ${durationSec}s`);
  console.log(`📚 Unique Book Titles: ${result.createdBooksCount.toLocaleString()}`);
  console.log(`📖 Total Physical Copies: ${result.createdCopiesCount.toLocaleString()}`);
  console.log(`🔄 Skipped Existing Duplicates: ${result.skippedDuplicatesCount.toLocaleString()}`);
  console.log(`⚠️ Errors Encountered: ${result.errorCount}`);
  console.log('========================================\n');

  await prisma.$disconnect();
}

runCatalogImport().catch((err) => {
  console.error('❌ Fatal error during catalog import:', err);
  process.exit(1);
});
